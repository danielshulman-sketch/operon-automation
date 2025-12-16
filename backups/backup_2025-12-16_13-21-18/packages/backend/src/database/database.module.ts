import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { MailboxEntity } from '../entities/mailbox.entity';
import { EmailThreadEntity } from '../entities/email-thread.entity';
import { EmailMessageEntity } from '../entities/email-message.entity';
import { DetectedTaskEntity } from '../entities/detected-task.entity';
import { WorkflowRunEntity } from '../entities/workflow-run.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/autm',
        entities: [
          OrganizationEntity,
          UserEntity,
          MailboxEntity,
          EmailThreadEntity,
          EmailMessageEntity,
          DetectedTaskEntity,
          WorkflowRunEntity,
        ],
        synchronize: false, // use migrations
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
