import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { ClientIp } from '../../common/decorators/ip.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/posts/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findByPostSlug(@Param('slug') slug: string) {
    return this.commentsService.findByPostSlug(slug);
  }

  @Post()
  create(
    @Param('slug') slug: string,
    @ClientIp() ip: string,
    @Body() body: { content: string; nickname?: string; parentId?: string },
  ) {
    return this.commentsService.create(slug, ip, body.content, body.nickname, body.parentId);
  }
}

@Controller('api/admin/comments')
@UseGuards(AdminGuard)
export class AdminCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 20, @Query('approved') approved?: string) {
    const isApproved = approved === undefined ? undefined : approved === 'true';
    return this.commentsService.findAllAdmin(+page, +pageSize, isApproved);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.commentsService.approve(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
