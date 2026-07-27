import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { generateVisitorId } from '../../common/utils/visitor.util';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByPostSlug(slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('Post not found');

    const comments = await this.prisma.comment.findMany({
      where: { postId: post.id, isApproved: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by visitorId
    const groups: Record<string, any[]> = {};
    for (const c of comments) {
      const vid = generateVisitorId(c.ip);
      if (!groups[vid]) groups[vid] = [];
      groups[vid].push(c);
    }

    return Object.entries(groups).map(([visitorId, items]) => ({
      visitorId,
      comments: items,
    }));
  }

  async create(slug: string, ip: string, content: string, nickname?: string, parentId?: string) {
    const post = await this.prisma.post.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException('Post not found');

    // Auto-approve if same IP already has approved comments
    const approvedCount = await this.prisma.comment.count({
      where: { ip, isApproved: true },
    });
    const isApproved = approvedCount > 0;

    return this.prisma.comment.create({
      data: {
        postId: post.id,
        content,
        ip,
        nickname: nickname || null,
        isApproved,
        parentId: parentId || null,
      },
    });
  }

  async findAllAdmin(page = 1, pageSize = 20, approved?: boolean) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (approved !== undefined) where.isApproved = approved;

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { post: { select: { slug: true, title: true } } },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async approve(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.comment.update({ where: { id }, data: { isApproved: true } });
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.comment.delete({ where: { id } });
  }
}
