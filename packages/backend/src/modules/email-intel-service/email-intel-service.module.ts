import { Module } from '@nestjs/common';
import { EmailIntelServiceController } from './email-intel-service.controller';
import { EmailIntelServiceService } from './email-intel-service.service';
import { SharedModule } from '../../shared/shared.module';
import { WorkflowServiceModule } from '../workflow-service/workflow-service.module';

@Module({
  imports: [SharedModule, WorkflowServiceModule],
  controllers: [EmailIntelServiceController],
  providers: [EmailIntelServiceService],
  exports: [EmailIntelServiceService],
})
export class EmailIntelServiceModule {}
