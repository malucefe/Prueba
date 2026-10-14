import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/entities/category.entity';
import { UsersService } from '../users/users.service';
import { Role } from '../users/entities/user.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { GoalsService } from '../goals/goals.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RecommendationType } from '../recommendations/entities/recommendation.entity';
import { RecommendationRule } from '../rules/entities/recommendation-rule.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly goalsService: GoalsService,
    private readonly recommendationsService: RecommendationsService,
    // SeedModule no importa RulesModule: se usa el DataSource global de
    // TypeORM para sembrar las reglas sin tocar seed.module.ts (HU-20).
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // SEED_ENABLED=false apaga TODO el seed (deploy sin tocar datos existentes).
    if (process.env['SEED_ENABLED'] === 'false') {
      this.logger.log('SEED_ENABLED=false: seed deshabilitado, se omite');
      return;
    }

    await this.seedCategories();
    await this.seedRules();
    await this.seedUsers();
    await this.seedTransactions();
    await this.seedGoals();
    await this.seedRecommendations();
  }

  private async seedCategories() {
    const count = await this.categoriesService.count();
    if (count > 0) {
      this.logger.log('Categorías ya existen, omitiendo seed');
      return;
    }

    this.logger.log('Sembrando categorías para el consumidor colombiano...');

    const categoriasEgreso = [
      { nombre: 'Transporte', tipo: CategoryType.EGRESO, icono: '🚌' },
      { nombre: 'Alimentación', tipo: CategoryType.EGRESO, icono: '🍽️' },
      { nombre: 'Arriendo', tipo: CategoryType.EGRESO, icono: '🏠' },
      { nombre: 'Servicios Públicos', tipo: CategoryType.EGRESO, icono: '💡' },
      { nombre: 'Entretenimiento', tipo: CategoryType.EGRESO, icono: '🎬' },
      { nombre: 'Salud', tipo: CategoryType.EGRESO, icono: '🏥' },
      { nombre: 'Educación', tipo: CategoryType.EGRESO, icono: '📚' },
      { nombre: 'Ropa', tipo: CategoryType.EGRESO, icono: '👕' },
      { nombre: 'Tecnología', tipo: CategoryType.EGRESO, icono: '💻' },
      { nombre: 'Ahorro', tipo: CategoryType.EGRESO, icono: '🏦' },
      { nombre: 'Mascota', tipo: CategoryType.EGRESO, icono: '🐾' },
      { nombre: 'Cuidado Personal', tipo: CategoryType.EGRESO, icono: '💆' },
      { nombre: 'Suscripciones', tipo: CategoryType.EGRESO, icono: '📺' },
      { nombre: 'Otros Gastos', tipo: CategoryType.EGRESO, icono: '📦' },
    ];

    const categoriasIngreso = [
      { nombre: 'Salario', tipo: CategoryType.INGRESO, icono: '💰' },
      { nombre: 'Freelance', tipo: CategoryType.INGRESO, icono: '💼' },
      { nombre: 'Inversiones', tipo: CategoryType.INGRESO, icono: '📈' },
      { nombre: 'Ventas', tipo: CategoryType.INGRESO, icono: '💰' },
      { nombre: 'Bonificaciones', tipo: CategoryType.INGRESO, icono: '🎁' },
      { nombre: 'Otros Ingresos', tipo: CategoryType.INGRESO, icono: '💵' },
    ];

    const todas = [...categoriasEgreso, ...categoriasIngreso];

    for (const cat of todas) {
      await this.categoriesService.create(cat);
    }

    this.logger.log(`${todas.length} categorías creadas exitosamente`);
  }

  private async seedRules() {
    const rulesRepository = this.dataSource.getRepository(RecommendationRule);
    const count = await rulesRepository.count();
    if (count > 0) {
      this.logger.log('Reglas del motor ya existen, omitiendo seed');
      return;
    }

    // Valores y plantillas copiados textualmente del nodo "Motor de reglas"
    // del workflow n8n (n8n/workflow.json), para que el comportamiento del
    // motor no cambie al pasar a reglas configurables (HU-20).
    const rules = [
      {
        key: 'regla1',
        nombre: 'Concentración de gasto por categoría',
        parametros: { umbralPorcentaje: 30 },
        plantilla:
          'Tu gasto en ${cat} representa el ${porcentaje.toFixed(1)}% de tus ingresos. Considera reducirlo para mantener un balance saludable.',
        activa: true,
      },
      {
        key: 'regla2',
        nombre: 'Ratio de gastos sobre ingresos',
        parametros: { ratioMaximo: 0.8 },
        plantilla:
          'Tus gastos superan el 80% de tus ingresos este mes. Es recomendable mantener los gastos por debajo del 70% para poder ahorrar.',
        activa: true,
      },
      {
        key: 'regla3',
        nombre: 'Sin ahorro registrado',
        parametros: { porcentajeAhorro: 10 },
        plantilla:
          'No hemos registrado movimientos de ahorro este mes. Te recomendamos destinar al menos el 10% de tus ingresos a una meta de ahorro.',
        activa: true,
      },
      {
        key: 'regla4',
        nombre: 'Gastos recurrentes (suscripciones)',
        parametros: { minMovimientos: 3, varianzaMaxima: 0.2, stddevDias: 5 },
        plantilla:
          'Hemos detectado gastos recurrentes en ${cat} (${entries.length} veces este mes). Podría ser una suscripción que vale la pena revisar.',
        activa: true,
      },
    ];

    await rulesRepository.save(rules);
    this.logger.log(`${rules.length} reglas del motor creadas`);
  }

  private async seedUsers() {
    const count = await this.usersService.count();
    if (count > 0) {
      this.logger.log('Usuarios ya existen, omitiendo seed');
      return;
    }

    // Contraseñas desde env. En producción NO hay defaults: si faltan, se
    // advierte y se omite SOLO el seed de usuarios (el resto del seed corre).
    const isProduction = process.env['NODE_ENV'] === 'production';
    const adminPassword =
      process.env['SEED_ADMIN_PASSWORD'] ?? (isProduction ? undefined : 'Admin1234!');
    const userPassword =
      process.env['SEED_USER_PASSWORD'] ?? (isProduction ? undefined : 'User1234!');

    if (!adminPassword || !userPassword) {
      this.logger.warn(
        'Faltan SEED_ADMIN_PASSWORD y/o SEED_USER_PASSWORD en producción: se omite el seed de usuarios',
      );
      return;
    }

    const adminHash = await bcrypt.hash(adminPassword, 12);
    const userHash = await bcrypt.hash(userPassword, 12);

    await this.usersService.create({
      nombre: 'Admin Caudo',
      email: 'admin@caudo.dev',
      passwordHash: adminHash,
      role: Role.ADMIN,
    });

    await this.usersService.create({
      nombre: 'Usuario Demo',
      email: 'user@caudo.dev',
      passwordHash: userHash,
      role: Role.USER,
    });

    this.logger.log('Usuarios admin@caudo.dev y user@caudo.dev creados');
  }

  private async seedTransactions() {
    const txCount = await this.transactionsService.count();
    const user = await this.usersService.findByEmail('user@caudo.dev');
    if (txCount > 0 || !user) {
      return;
    }

    const categories = await this.categoriesService.findAll();
    const byName = (nombre: string) =>
      categories.find((c) => c.nombre === nombre);

    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const salario = byName('Salario');
    const freelance = byName('Freelance');
    const alimentacion = byName('Alimentación');
    const transporte = byName('Transporte');
    const arriendo = byName('Arriendo');
    const servicios = byName('Servicios Públicos');
    const entretenimiento = byName('Entretenimiento');
    const salud = byName('Salud');

    const seed = [
      { tipo: TransactionType.INGRESO, monto: 4500000, categoriaId: salario?.id, descripcion: 'Salario mensual', fecha: daysAgo(55) },
      { tipo: TransactionType.EGRESO, monto: 1200000, categoriaId: arriendo?.id, descripcion: 'Arriendo apartamento', fecha: daysAgo(53) },
      { tipo: TransactionType.INGRESO, monto: 800000, categoriaId: freelance?.id, descripcion: 'Proyecto freelance', fecha: daysAgo(40) },
      { tipo: TransactionType.EGRESO, monto: 350000, categoriaId: alimentacion?.id, descripcion: 'Mercado del mes', fecha: daysAgo(35) },
      { tipo: TransactionType.EGRESO, monto: 180000, categoriaId: transporte?.id, descripcion: 'Transporte mensual', fecha: daysAgo(30) },
      { tipo: TransactionType.EGRESO, monto: 220000, categoriaId: servicios?.id, descripcion: 'Servicios públicos', fecha: daysAgo(25) },
      { tipo: TransactionType.EGRESO, monto: 150000, categoriaId: entretenimiento?.id, descripcion: 'Cine y salidas', fecha: daysAgo(15) },
      { tipo: TransactionType.EGRESO, monto: 95000, categoriaId: salud?.id, descripcion: 'Farmacia', fecha: daysAgo(5) },
    ];

    for (const tx of seed) {
      if (!tx.categoriaId) continue;
      await this.transactionsService.create(user.id, {
        tipo: tx.tipo,
        monto: tx.monto,
        categoriaId: tx.categoriaId,
        descripcion: tx.descripcion,
        fecha: tx.fecha,
      });
    }

    this.logger.log('Transacciones de ejemplo creadas');
  }

  private async seedGoals() {
    const user = await this.usersService.findByEmail('user@caudo.dev');
    if (!user) return;

    const goals = await this.goalsService.findAll(user.id);
    if (goals.length > 0) return;

    await this.goalsService.create(user.id, {
      nombre: 'Fondo de emergencia',
      montoObjetivo: 10000000,
      montoActual: 2500000,
      fechaLimite: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
    } as any);

    await this.goalsService.create(user.id, {
      nombre: 'Viaje de vacaciones',
      montoObjetivo: 5000000,
      montoActual: 800000,
      fechaLimite: new Date(new Date().setMonth(new Date().getMonth() + 6))
        .toISOString()
        .split('T')[0],
    } as any);

    this.logger.log('Metas de ejemplo creadas');
  }

  private async seedRecommendations() {
    const user = await this.usersService.findByEmail('user@caudo.dev');
    if (!user) return;

    const count = await this.recommendationsService.count();
    if (count > 0) return;

    await this.recommendationsService.create({
      userId: user.id,
      contenido: 'Tu gasto en entretenimiento subió un 20% este mes. Considera ajustar el presupuesto.',
      tipo: RecommendationType.ALERTA,
    });

    await this.recommendationsService.create({
      userId: user.id,
      contenido: 'Destinaste menos del 10% de tus ingresos al ahorro. Intenta automatizar un aporte mensual.',
      tipo: RecommendationType.CONSEJO,
    });

    await this.recommendationsService.create({
      userId: user.id,
      contenido: 'Vas bien con tu fondo de emergencia: ya tienes el 25% de tu meta.',
      tipo: RecommendationType.AHORRO,
    });

    this.logger.log('Recomendaciones de ejemplo creadas');
  }
}
