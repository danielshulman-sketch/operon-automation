import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.users)
  org!: OrganizationEntity;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  displayName!: string;

  @Column({ type: 'text', default: 'member' })
  role!: string;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
