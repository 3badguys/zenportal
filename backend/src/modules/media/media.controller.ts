import {
  Controller, Get, Post, Delete, Query, Param, Body,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/admin/media')
@UseGuards(AdminGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 50) {
    return this.mediaService.findAll(+page, +pageSize);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.upload(file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }

  @Get('unreferenced')
  findUnreferenced() {
    return this.mediaService.findUnreferenced();
  }

  @Delete('unreferenced/batch')
  deleteUnreferenced(@Body() body: { ids: string[] }) {
    return this.mediaService.deleteUnreferenced(body.ids);
  }
}
