import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';

const ALLOWED_MIMES = [
  // --- Images ---
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/tiff', 'image/avif',
  'image/heic', 'image/x-icon', // ICO icon

  // --- Videos ---
  'video/mp4', 'video/webm', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska', 'video/mpeg',
  'video/3gpp', 'video/ogg',

  // --- Audio ---
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4',
  'audio/aac', 'audio/flac', 'audio/opus', 'audio/m4a', 'audio/x-wav',
];

const MAX_SIZES: Record<string, number> = {
  image: (parseInt(process.env.MEDIA_MAX_IMAGE_SIZE_MB || '') || 10) * 1024 * 1024,
  video: (parseInt(process.env.MEDIA_MAX_VIDEO_SIZE_MB || '') || 50) * 1024 * 1024,
  audio: (parseInt(process.env.MEDIA_MAX_AUDIO_SIZE_MB || '') || 10) * 1024 * 1024,
};

// derive category + limits from mimetype prefix
const TYPE_PREFIX = (mime: string) => mime.split('/')[0];
const CATEGORY_DIR: Record<string, string> = { image: 'images', video: 'videos', audio: 'audios' };

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// multer/busboy encodes multipart filenames as latin1; decode to UTF-8
// only when the name actually contains high bytes (avoids double-decoding ASCII)
function decodeFilename(name: string): string {
  const hasHighByte = [...name].some((ch) => ch.charCodeAt(0) > 127);
  if (!hasHighByte) return name;
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    return decoded.includes('\uFFFD') ? name : decoded;
  } catch {
    return name;
  }
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.medium.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      this.prisma.medium.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async upload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    file.originalname = decodeFilename(file.originalname);
    if (!ALLOWED_MIMES.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');

    const prefix = TYPE_PREFIX(file.mimetype);
    const category = CATEGORY_DIR[prefix] || 'others';
    if (category === 'others') throw new BadRequestException('Unsupported file type');
    const maxSize = MAX_SIZES[prefix] ?? 10 * 1024 * 1024;
    this.logger.warn(
      `Upload size check: mimetype="${file.mimetype}" prefix="${prefix}" ` +
      `fileSize=${(file.size / 1024 / 1024).toFixed(2)}MB maxSize=${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    );
    if (file.size > maxSize) throw new BadRequestException(`File too large. Max ${maxSize / 1024 / 1024}MB`);

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dir = join(STORAGE_ROOT, category, year, month);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = `/media/${category}/${year}/${month}/${filename}`;
    const dest = join(dir, filename);

    fs.writeFileSync(dest, file.buffer);

    return this.prisma.medium.create({
      data: {
        filename,
        originalName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async remove(id: string) {
    const medium = await this.prisma.medium.findUnique({ where: { id } });
    if (!medium) throw new NotFoundException('File not found');

    // Check references
    const refs = await this.checkReferences(medium.filePath);
    if (refs.length > 0) {
      throw new BadRequestException({ message: 'File is referenced and cannot be deleted', refs });
    }

    // Delete physical file
    const physicalPath = join(STORAGE_ROOT, medium.filePath.replace('/media/', ''));
    if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);

    return this.prisma.medium.delete({ where: { id } });
  }

  async findUnreferenced() {
    const all = await this.prisma.medium.findMany({ orderBy: { createdAt: 'desc' } });
    const unreferenced: typeof all = [];

    for (const m of all) {
      const refs = await this.checkReferences(m.filePath);
      if (refs.length === 0) unreferenced.push(m);
    }

    return unreferenced;
  }

  async deleteUnreferenced(ids: string[]) {
    const unreferenced = await this.findUnreferenced();
    const toDelete = unreferenced.filter((m) => ids.includes(m.id));

    for (const m of toDelete) {
      const physicalPath = join(STORAGE_ROOT, m.filePath.replace('/media/', ''));
      if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
      await this.prisma.medium.delete({ where: { id: m.id } });
    }

    return { deleted: toDelete.length };
  }

  private async checkReferences(filePath: string): Promise<string[]> {
    const refs: string[] = [];

    const posts = await this.prisma.post.findMany({
      where: { OR: [{ body: { contains: filePath } }, { coverImage: { contains: filePath } }] },
    });
    for (const p of posts) {
      if (p.body.includes(filePath)) refs.push(`Post "${p.title}" (body)`);
      if (p.coverImage?.includes(filePath)) refs.push(`Post "${p.title}" (cover)`);
    }

    const allLayouts = await this.prisma.pageLayout.findMany();
    for (const l of allLayouts) {
      if (JSON.stringify(l.blocks).includes(filePath)) {
        refs.push(`PageLayout "${l.pageSlug}"`);
      }
    }

    const configs = await this.prisma.siteConfig.findMany({
      where: { OR: [{ siteTitle: { contains: filePath } }, { siteDescription: { contains: filePath } }] },
    });
    for (const _c of configs) {
      refs.push('SiteConfig');
    }

    return refs;
  }
}
