import { Module } from '@nestjs/common';
import { IntegrationServiceController } from './integration-service.controller';
import { IntegrationServiceService } from './integration-service.service';
import { EmailIntelServiceModule } from '../email-intel-service/email-intel-service.module';

@Module({
  imports: [EmailIntelServiceModule],
  controllers: [IntegrationServiceController],
  providers: [IntegrationServiceService],
})
export class IntegrationServiceModule {}
