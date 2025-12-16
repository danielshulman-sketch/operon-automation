import { Controller, Post, Body } from '@nestjs/common';
import { NotificationServiceService } from './notification-service.service';

@Controller('notification')
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationServiceService) {}

  @Post('send')
  async sendNotification(@Body() body: { message: string }) {
    return this.notificationService.send(body.message);
  }
}