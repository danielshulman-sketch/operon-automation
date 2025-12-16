import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmailThreadEntity } from './email-thread.entity';
import { EmailMessageEntity } from './email-message.entity';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'detected_tasks' })
export class DetectedTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => OrganizationEntity)
  org!: OrganizationEntity;

  @Column({ type: 'uuid' })
  threadId!: string;

  @ManyToOne(() => EmailThreadEntity, (thread) => thread.tasks)
  thread!: EmailThreadEntity;

  @Column({ type: 'uuid' })
  messageId!: string;

  @ManyToOne(() => EmailMessageEntity)
  message!: EmailMessageEntity;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', default: 'open' })
  status!: string;

  @Column({ type: 'numeric', default: 0 })
  confidence!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
