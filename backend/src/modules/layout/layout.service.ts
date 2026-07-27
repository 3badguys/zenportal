import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class LayoutService {
  constructor(private prisma: PrismaService) {}

  async getLayout(pageSlug = 'home') {
    let layout = await this.prisma.pageLayout.findUnique({ where: { pageSlug } });
    if (!layout) {
      layout = await this.prisma.pageLayout.create({ data: { pageSlug, blocks: [] } });
    }
    // Enrich FeaturedPosts blocks
    const blocks = layout.blocks as any[];
    const enriched = await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'FeaturedPosts' && block.props?.postIds?.length > 0) {
          const posts = await this.prisma.post.findMany({
            where: { id: { in: block.props.postIds }, isPublished: true },
            select: { id: true, slug: true, title: true, summary: true, coverImage: true, publishedAt: true },
            orderBy: { publishedAt: 'desc' },
          });
          return { ...block, props: { ...block.props, posts } };
        }
        return block;
      }),
    );
    return { pageSlug, blocks: enriched };
  }

  async updateLayout(pageSlug: string, blocks: any[]) {
    await this.prisma.pageLayout.upsert({
      where: { pageSlug },
      update: { blocks },
      create: { pageSlug, blocks },
    });
    return this.getLayout(pageSlug);
  }
}
