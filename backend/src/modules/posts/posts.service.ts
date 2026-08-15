import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 10, tag?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      isPublished: true,
      ...(tag ? { tags: { some: { slug: tag } } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true, slug: true, title: true, summary: true, coverImage: true, publishedAt: true, createdAt: true, updatedAt: true,
          tags: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findAllAdmin(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { tags: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.post.count(),
    ]);
    return { items, total, page, pageSize };
  }

  private async findOrThrow(where: { id: string } | { slug: string }) {
    const post = await this.prisma.post.findUnique({
      where,
      include: { tags: { select: { id: true, name: true, slug: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findBySlug(slug: string) {
    return this.findOrThrow({ slug });
  }

  async findById(id: string) {
    return this.findOrThrow({ id });
  }

  async create(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        coverImage: dto.coverImage,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date(dto.publishedAt || Date.now()) : null,
        ...(dto.tagIds?.length ? { tags: { connect: dto.tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { tags: { select: { id: true, name: true, slug: true } } },
    });
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.findById(id);
    const data: any = { ...dto };
    delete data.tagIds;
    if (dto.isPublished !== undefined) {
      data.publishedAt = dto.isPublished ? new Date(dto.publishedAt || Date.now()) : null;
    }
    if (dto.tagIds) {
      data.tags = { set: dto.tagIds.map((tid) => ({ id: tid })) };
    }
    return this.prisma.post.update({ where: { id }, data, include: { tags: { select: { id: true, name: true, slug: true } } } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.post.delete({ where: { id } });
  }
}
