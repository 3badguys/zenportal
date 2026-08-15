import { Module } from '@nestjs/common';
import { PostsModule } from './modules/posts/posts.module';
import { LayoutModule } from './modules/layout/layout.module';
import { SiteModule } from './modules/site/site.module';
import { MediaModule } from './modules/media/media.module';
import { CommentsModule } from './modules/comments/comments.module';
import { BackupModule } from './modules/backup/backup.module';
import { TagsModule } from './modules/tags/tags.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaService } from './config/prisma.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

@Module({
  imports: [PostsModule, LayoutModule, SiteModule, MediaModule, CommentsModule, BackupModule, TagsModule, AdminModule],
  providers: [
    PrismaService,
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
