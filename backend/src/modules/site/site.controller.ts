import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('api/site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  getConfig() {
    return this.siteService.getConfig();
  }
}

@Controller('api/admin/site')
@UseGuards(AdminGuard)
export class AdminSiteController {
  constructor(private readonly siteService: SiteService) {}

  @Put()
  updateConfig(@Body() body: { siteTitle?: string; siteDescription?: string }) {
    return this.siteService.updateConfig(body);
  }
}
