import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'Fondo de emergencia' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 5000000, description: 'Monto objetivo en COP' })
  @IsNumber({}, { message: 'El monto objetivo debe ser un número' })
  @Min(1, { message: 'El monto objetivo debe ser mayor a 0' })
  montoObjetivo: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString({}, { message: 'Ingrese una fecha válida (YYYY-MM-DD)' })
  fechaLimite: string;
}
