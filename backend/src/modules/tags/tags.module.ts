import { Module } from '@nestjs/common';
import { TagsController, AdminTagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [TagsController, AdminTagsController],
  providers: [TagsService, PrismaService],
})
export class TagsModule {}
