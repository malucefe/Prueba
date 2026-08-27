import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from './guards/api-key.guard';
import { InternalService } from './internal.service';

@ApiTags('internal')
@ApiSecurity('api-key')
@Controller('internal')
@UseGuards(ApiKeyGuard)
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Obtener transacciones recientes para n8n' })
  getRecentTransactions(@Param('userId') userId: string) {
    return this.internalService.getRecentTransactions(userId);
  }

  @Get('income/:userId')
  @ApiOperation({ summary: 'Obtener ingresos del mes actual para n8n' })
  getCurrentMonthIncome(@Param('userId') userId: string) {
    return this.internalService.getCurrentMonthIncome(userId);
  }

  @Post('recommendations')
  @ApiOperation({ summary: 'Crear recomendaciones en lote desde n8n' })
  batchCreateRecommendations(@Body() recommendations: Array<{
    user_id: string;
    contenido: string;
    tipo: string;
    leida?: boolean;
  }>) {
    return this.internalService.batchCreateRecommendations(recommendations);
  }
}
