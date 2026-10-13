import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum CategoryType {
  INGRESO = 'ingreso',
  EGRESO = 'egreso',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  tipo: CategoryType;

  @Column({ length: 50, nullable: true })
  icono: string;

  // HU-20: las categorías se desactivan en lugar de eliminarse cuando ya
  // tienen transacciones asociadas.
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
