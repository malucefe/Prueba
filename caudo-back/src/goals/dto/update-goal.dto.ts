import { PartialType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @ApiPropertyOptional({ example: 1500000, description: 'Monto actual ahorrado en COP' })
  @IsNumber({}, { message: 'El monto actual debe ser un número' })
  @Min(0)
  @IsOptional()
  montoActual?: number;
}
