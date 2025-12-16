import { Module } from '@nestjs/common';
import { AuthServiceModule } from './modules/auth-service/auth-service.module';
import { OrgServiceModule } from './modules/org-service/org-service.module';
import { EmailIntelServiceModule } from './modules/email-intel-service/email-intel-service.module';
import { WorkflowServiceModule } from './modules/workflow-service/workflow-service.module';
import { AgentServiceModule } from './modules/agent-service/agent-service.module';
import { NotificationServiceModule } from './modules/notification-service/notification-service.module';
import { IntegrationServiceModule } from './modules/integration-service/integration-service.module';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    AuthServiceModule,
    OrgServiceModule,
    EmailIntelServiceModule,
    WorkflowServiceModule,
    AgentServiceModule,
    NotificationServiceModule,
    IntegrationServiceModule,
  ],
})
export class AppModule {}
