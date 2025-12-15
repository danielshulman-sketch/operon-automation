import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { MailboxEntity } from './mailbox.entity';

@Entity({ name: 'organisations' })
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', default: 'free' })
  plan!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.org)
  users!: UserEntity[];

  @OneToMany(() => MailboxEntity, (mailbox) => mailbox.org)
  mailboxes!: MailboxEntity[];
}
