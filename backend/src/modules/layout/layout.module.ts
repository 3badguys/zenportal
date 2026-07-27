import { Module } from '@nestjs/common';
import { LayoutController, AdminLayoutController } from './layout.controller';
import { LayoutService } from './layout.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [LayoutController, AdminLayoutController],
  providers: [LayoutService, PrismaService],
})
export class LayoutModule {}
