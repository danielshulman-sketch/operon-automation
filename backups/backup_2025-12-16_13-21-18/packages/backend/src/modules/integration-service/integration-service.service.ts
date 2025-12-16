import { Injectable } from '@nestjs/common';
import { EmailIntelServiceService } from '../email-intel-service/email-intel-service.service';
import { NormalizedEmailInput } from '../../domain/types';

@Injectable()
export class IntegrationServiceService {
  constructor(private readonly emailIntelService: EmailIntelServiceService) {}

  async connect(service: string) {
    // skeleton
    return { connected: true };
  }

  async handleGmailWebhook(payload: NormalizedEmailInput) {
    // In production validate signature and translate provider payload into NormalizedEmailInput
    return this.emailIntelService.handleIncomingEmail(payload);
  }
}
