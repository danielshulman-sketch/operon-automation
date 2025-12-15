import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { MailboxEntity } from './mailbox.entity';
import { EmailMessageEntity } from './email-message.entity';
import { DetectedTaskEntity } from './detected-task.entity';

@Entity({ name: 'email_threads' })
export class EmailThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => OrganizationEntity)
  org!: OrganizationEntity;

  @Column({ type: 'uuid' })
  mailboxId!: string;

  @ManyToOne(() => MailboxEntity)
  mailbox!: MailboxEntity;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text', default: 'open' })
  status!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @OneToMany(() => EmailMessageEntity, (msg) => msg.thread)
  messages!: EmailMessageEntity[];

  @OneToMany(() => DetectedTaskEntity, (task) => task.thread)
  tasks!: DetectedTaskEntity[];
}
