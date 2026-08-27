import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear meta financiera' })
  create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar metas del usuario' })
  findAll(@Request() req) {
    return this.goalsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de meta' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar meta' })
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar meta' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.goalsService.remove(req.user.userId, id);
  }
}
