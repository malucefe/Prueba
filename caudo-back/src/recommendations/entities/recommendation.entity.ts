import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RecommendationType {
  ALERTA = 'alerta',
  CONSEJO = 'consejo',
  META = 'meta',
  AHORRO = 'ahorro',
}

@Entity('recommendations')
@Index(['userId', 'leida'])
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({
    type: 'enum',
    enum: RecommendationType,
    default: RecommendationType.CONSEJO,
  })
  tipo: RecommendationType;

  @Column({ default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.recommendations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
