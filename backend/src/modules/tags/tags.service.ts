import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTagDto, UpdateTagDto } from './tags.dto';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'tag';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  // public: tags + count of PUBLISHED posts (for blog hot tags)
  async findAllPublic() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: { where: { isPublished: true } } } } },
    });
    return tags.map(({ _count, ...t }) => ({ ...t, postCount: _count.posts }));
  }

  // plain list for the post editor tag selector
  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }

  async findAllAdmin(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
        include: { _count: { select: { posts: true } } },
      }),
      this.prisma.tag.count(),
    ]);
    return {
      items: items.map(({ _count, ...t }) => ({ ...t, postCount: _count.posts })),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateTagDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      return await this.prisma.tag.create({
        data: { name: dto.name.trim(), slug, description: dto.description },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('Tag name or slug already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findOrThrow(id);
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('Tag name or slug already exists');
      throw e;
    }
  }

  async remove(id: string) {
    const tag = await this.findOrThrow(id);
    const posts = await this.prisma.post.findMany({
      where: { tags: { some: { id } } },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    });
    if (posts.length > 0) {
      throw new BadRequestException({
        message: 'Tag is in use and cannot be deleted',
        refs: posts.map((p) => p.title),
      });
    }
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: tag.name };
  }

  async merge(id: string, targetId: string) {
    if (id === targetId) throw new BadRequestException('Cannot merge a tag into itself');
    const [source, target] = await Promise.all([this.findOrThrow(id), this.findOrThrow(targetId)]);
    const posts = await this.prisma.post.findMany({
      where: { tags: { some: { id } } },
      select: { id: true },
    });
    await this.prisma.$transaction([
      ...posts.map((p) =>
        this.prisma.post.update({
          where: { id: p.id },
          data: { tags: { connect: { id: targetId }, disconnect: { id } } },
        }),
      ),
      this.prisma.tag.delete({ where: { id } }),
    ]);
    return { merged: source.name, into: target.name, moved: posts.length };
  }

  private async findOrThrow(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }
}
