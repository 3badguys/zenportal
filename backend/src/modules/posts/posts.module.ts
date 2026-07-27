import { Module } from '@nestjs/common';
import { PostsController, AdminPostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}
