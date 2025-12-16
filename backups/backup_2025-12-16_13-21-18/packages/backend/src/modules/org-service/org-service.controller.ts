import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrgServiceService } from './org-service.service';

@Controller('org')
export class OrgServiceController {
  constructor(private readonly orgService: OrgServiceService) {}

  @Get()
  async getOrganizations() {
    return this.orgService.getOrganizations();
  }

  @Post()
  async createOrganization(@Body() body: { name: string }) {
    return this.orgService.createOrganization(body.name);
  }
}