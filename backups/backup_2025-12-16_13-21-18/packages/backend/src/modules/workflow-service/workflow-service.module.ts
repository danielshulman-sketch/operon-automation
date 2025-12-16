import { Module } from '@nestjs/common';
import { WorkflowServiceController } from './workflow-service.controller';
import { WorkflowServiceService } from './workflow-service.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [WorkflowServiceController],
  providers: [WorkflowServiceService],
  exports: [WorkflowServiceService],
})
export class WorkflowServiceModule {}
