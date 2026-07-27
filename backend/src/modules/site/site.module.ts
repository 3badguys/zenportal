import { Module } from '@nestjs/common';
import { SiteController, AdminSiteController } from './site.controller';
import { SiteService } from './site.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [SiteController, AdminSiteController],
  providers: [SiteService, PrismaService],
})
export class SiteModule {}
