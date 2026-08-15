import { Controller, Get, Param, Query, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 10, @Query('tag') tag?: string) {
    return this.postsService.findAll(+page, +pageSize, tag);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }
}

@Controller('api/admin/posts')
@UseGuards(AdminGuard)
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.postsService.findAllAdmin(+page, +pageSize);
  }

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
