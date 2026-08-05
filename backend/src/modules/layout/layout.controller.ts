import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { LayoutService } from './layout.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { UpdateLayoutDto } from './layout.dto';

@Controller('api/layout')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get(':pageSlug')
  getLayout(@Param('pageSlug') pageSlug: string) {
    return this.layoutService.getLayout(pageSlug);
  }
}

@Controller('api/admin/layout')
@UseGuards(AdminGuard)
export class AdminLayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Put(':pageSlug')
  updateLayout(@Param('pageSlug') pageSlug: string, @Body() body: UpdateLayoutDto) {
    return this.layoutService.updateLayout(pageSlug, body.blocks);
  }
}
