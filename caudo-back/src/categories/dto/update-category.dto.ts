import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Transporte Urbano' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: '🚍' })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El icono no puede superar 50 caracteres' })
  icono?: string;

  @ApiPropertyOptional({ example: false, description: 'Activa o desactiva la categoría' })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean;
}
