import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './tags.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAllPublic();
  }
}

@Controller('api/admin/tags')
@UseGuards(AdminGuard)
export class AdminTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('all')
  findAll() {
    return this.tagsService.findAll();
  }

  @Get()
  findAllAdmin(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.tagsService.findAllAdmin(+page, +pageSize);
  }

  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post(':id/merge')
  merge(@Param('id') id: string, @Body() body: { targetId: string }) {
    return this.tagsService.merge(id, body.targetId);
  }
}
