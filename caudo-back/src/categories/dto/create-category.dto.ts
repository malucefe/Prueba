import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Transporte' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EGRESO })
  @IsEnum(CategoryType, { message: 'Tipo inválido: use ingreso o egreso' })
  tipo: CategoryType;

  @ApiPropertyOptional({ example: '🚌' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El icono no puede superar 50 caracteres' })
  icono?: string;
}
