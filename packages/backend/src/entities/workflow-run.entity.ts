import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { DetectedTaskEntity } from './detected-task.entity';

@Entity({ name: 'workflow_runs' })
export class WorkflowRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orgId!: string;

  @ManyToOne(() => OrganizationEntity)
  org!: OrganizationEntity;

  @Column({ type: 'uuid' })
  detectedTaskId!: string;

  @ManyToOne(() => DetectedTaskEntity)
  detectedTask!: DetectedTaskEntity;

  @Column({ type: 'text', default: 'running' })
  status!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
