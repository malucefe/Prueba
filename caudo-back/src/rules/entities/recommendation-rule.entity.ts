import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('recommendation_rules')
export class RecommendationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identificador estable del catálogo: regla1..regla4 (HU-20)
  @Column({ length: 20, unique: true })
  key: string;

  @Column({ length: 150 })
  nombre: string;

  // Umbrales que el motor de n8n consume dinámicamente
  @Column({ type: 'jsonb', default: () => "'{}'" })
  parametros: Record<string, unknown>;

  // Mensaje mostrado al usuario; puede usar ${variables} del motor
  @Column({ type: 'text' })
  plantilla: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
