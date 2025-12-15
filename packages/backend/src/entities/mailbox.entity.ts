import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'mailboxes' })
export class MailboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.mailboxes)
  org!: OrganizationEntity;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'text', default: 'active' })
  syncState!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;
}
