import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar recomendaciones del usuario' })
  @ApiQuery({ name: 'noLeidas', required: false, type: Boolean })
  findAll(@Request() req, @Query('noLeidas') noLeidas?: string) {
    return this.recommendationsService.findAll(
      req.user.userId,
      noLeidas === 'true',
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de recomendaciones no leídas' })
  getUnreadCount(@Request() req) {
    return this.recommendationsService.getUnreadCount(req.user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  markAllAsRead(@Request() req) {
    return this.recommendationsService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar recomendación como leída' })
  markAsRead(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.recommendationsService.markAsRead(req.user.userId, id);
  }
}
