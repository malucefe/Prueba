import { Controller, Get, Post, Patch, Put, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios (solo admin)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear un usuario (solo admin)' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Editar nombre, email o rol de un usuario (solo admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    const user = await this.usersService.updateUser(id, dto, req.user.userId);
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspender una cuenta (solo admin, idempotente)' })
  async suspend(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.suspend(id, req.user.userId);
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivar una cuenta suspendida (solo admin, idempotente)' })
  async reactivate(@Param('id') id: string) {
    const user = await this.usersService.reactivate(id);
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.update(req.user.userId, dto);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...result } = user;
    return result;
  }
}
