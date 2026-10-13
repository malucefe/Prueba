import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRuleDto {
  @ApiPropertyOptional({
    example: { umbralPorcentaje: 30 },
    description: 'Umbrales del motor para esta regla',
  })
  @IsOptional()
  @IsObject({ message: 'Los parámetros deben ser un objeto' })
  parametros?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'Tu gasto en ${cat} supera el umbral configurado.',
  })
  @IsOptional()
  @IsString({ message: 'La plantilla debe ser un texto' })
  plantilla?: string;

  @ApiPropertyOptional({ example: true, description: 'Activa o desactiva la regla' })
  @IsOptional()
  @IsBoolean({ message: 'El campo activa debe ser booleano' })
  activa?: boolean;
}
