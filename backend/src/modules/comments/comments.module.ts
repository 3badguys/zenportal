import { Module } from '@nestjs/common';
import { CommentsController, AdminCommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService, PrismaService],
})
export class CommentsModule {}
