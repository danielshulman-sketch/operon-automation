import { Controller, Post, Body } from '@nestjs/common';
import { IntegrationServiceService } from './integration-service.service';
import { NormalizedEmailInput } from '../../domain/types';

@Controller('integration')
export class IntegrationServiceController {
  constructor(private readonly integrationService: IntegrationServiceService) {}

  @Post('connect')
  async connectIntegration(@Body() body: { service: string }) {
    return this.integrationService.connect(body.service);
  }

  @Post('gmail/webhook')
  async gmailWebhook(@Body() body: NormalizedEmailInput) {
    return this.integrationService.handleGmailWebhook(body);
  }
}
