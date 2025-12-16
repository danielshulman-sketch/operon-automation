import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationServiceService {
  async send(message: string) {
    // skeleton
    return { sent: true };
  }
}