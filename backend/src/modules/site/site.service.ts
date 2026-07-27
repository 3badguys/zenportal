import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class SiteService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.siteConfig.findUnique({ where: { id: 1 } });
    if (!config) {
      config = await this.prisma.siteConfig.create({ data: { id: 1, siteTitle: 'My Site', siteDescription: '' } });
    }
    return config;
  }

  async updateConfig(data: { siteTitle?: string; siteDescription?: string }) {
    return this.prisma.siteConfig.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
  }
}
