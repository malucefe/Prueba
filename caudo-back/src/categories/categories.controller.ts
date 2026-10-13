import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { CategoriesService } from './categories.service';
import { CategoryType } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar categorías (solo activas; includeInactive solo admin)',
  })
  @ApiQuery({ name: 'tipo', required: false, enum: CategoryType })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Solo admin: incluye categorías desactivadas',
  })
  async findAll(
    @Request() req: { user?: { role?: string } },
    @Query('tipo') tipo?: CategoryType,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const wantsInactive = includeInactive === 'true';
    if (wantsInactive && req?.user?.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Requiere rol de administrador para ver categorías inactivas',
      );
    }

    if (tipo) {
      return this.categoriesService.findByType(tipo, wantsInactive);
    }
    return this.categoriesService.findAll(wantsInactive);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear una categoría (solo admin)' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Editar nombre, icono o estado (solo admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary:
      'Eliminar una categoría sin transacciones; si tiene historial responde 409 sugiriendo desactivarla (solo admin)',
  })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return { success: true };
  }
}
