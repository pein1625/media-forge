import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('quotas')
export class Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', default: 'free' })
  plan: string;

  @Column({ type: 'bigint', default: 0 })
  storageUsed: number;

  @Column({ type: 'bigint', default: 5368709120 }) // 5GB
  storageLimit: number;

  @Column({ type: 'int', default: 0 })
  transcodeMinutes: number;

  @Column({ type: 'int', default: 60 })
  transcodeLimit: number;

  @Column({ type: 'int', default: 0 })
  aiCredits: number;

  @Column({ type: 'int', default: 100 })
  aiCreditLimit: number;

  @Column({ type: 'timestamp', nullable: true })
  resetAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
