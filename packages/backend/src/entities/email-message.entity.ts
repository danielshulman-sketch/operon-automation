import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmailThreadEntity } from './email-thread.entity';
import { OrganizationEntity } from './organization.entity';
import { MailboxEntity } from './mailbox.entity';

@Entity({ name: 'email_messages' })
export class EmailMessageEntity {
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

  @Column({ type: 'uuid' })
  threadId!: string;

  @ManyToOne(() => EmailThreadEntity, (thread) => thread.messages)
  thread!: EmailThreadEntity;

  @Column({ type: 'text' })
  from!: string;

  @Column({ type: 'text', array: true })
  to!: string[];

  @Column({ type: 'text', nullable: true })
  bodyText?: string;

  @Column({ type: 'text', nullable: true })
  bodyHtml?: string;

  @Column({ type: 'text' })
  messageId!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
