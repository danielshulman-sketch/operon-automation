import { Controller, Post, Body } from '@nestjs/common';
import { EmailIntelServiceService } from './email-intel-service.service';
import { NormalizedEmailInput } from '../../domain/types';

@Controller('email-intel')
export class EmailIntelServiceController {
  constructor(private readonly emailIntelService: EmailIntelServiceService) {}

  @Post('ingest')
  async ingest(@Body() body: NormalizedEmailInput) {
    return this.emailIntelService.handleIncomingEmail(body);
  }
}
