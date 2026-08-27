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

@Entity('goals')
@Index(['userId'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ name: 'monto_objetivo', type: 'decimal', precision: 15, scale: 2 })
  montoObjetivo: number;

  @Column({ name: 'monto_actual', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montoActual: number;

  @Column({ name: 'fecha_limite', type: 'date' })
  fechaLimite: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
