import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav'];
const MAX_SIZES: Record<string, number> = { image: 10 * 1024 * 1024, video: 50 * 1024 * 1024, audio: 10 * 1024 * 1024 };

const STORAGE_ROOT = join(__dirname, '..', '..', '..', 'storage');

@Injectable()
export class MediaService {
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
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (!ALLOWED_MIMES.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');

    const category = file.mimetype.startsWith('image/') ? 'images' : file.mimetype.startsWith('video/') ? 'videos' : 'audios';
    const maxSize = MAX_SIZES[category === 'images' ? 'image' : category === 'videos' ? 'video' : 'audio'];
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
