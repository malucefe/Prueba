import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { MetricsService } from './metrics.service';

type Period = { desde: string; hasta: string };

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly datePattern = /^\d{4}-\d{2}-\d{2}$/;

  constructor(private readonly metricsService: MetricsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Métricas globales de uso por rango de fechas (solo admin)' })
  async getMetrics(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const periodo = this.resolvePeriod(desde, hasta);
    return this.metricsService.getMetrics(periodo.desde, periodo.hasta);
  }

  /**
   * Valida los query params y aplica los defaults: desde = primer día del mes
   * actual, hasta = hoy. Cualquier valor que no sea una fecha real en formato
   * YYYY-MM-DD, o un rango invertido, responde 400.
   */
  private resolvePeriod(desde?: string, hasta?: string): Period {
    const hoy = new Date();
    const periodo: Period = {
      desde: desde ?? this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: hasta ?? this.formatDate(hoy),
    };

    for (const nombre of ['desde', 'hasta'] as const) {
      const valor = periodo[nombre];
      if (!this.datePattern.test(valor) || !this.isRealDate(valor)) {
        throw new BadRequestException(
          `Parámetro "${nombre}" inválido: se espera una fecha válida en formato YYYY-MM-DD`,
        );
      }
    }

    if (periodo.desde > periodo.hasta) {
      throw new BadRequestException(
        'Rango de fechas inválido: "desde" no puede ser posterior a "hasta"',
      );
    }

    return periodo;
  }

  /** YYYY-MM-DD en local, para que el default coincida con el día del admin. */
  private formatDate(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  /**
   * El regex acepta cualquier número en cada posición (2026-02-31 lo pasa),
   * así que se confirma que la fecha exista en el calendario: si no, 400 en
   * lugar de un error de Postgres más tarde.
   */
  private isRealDate(value: string): boolean {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    );
  }
}
