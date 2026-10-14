import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { GoalsModule } from './goals/goals.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { FilesModule } from './files/files.module';
import { SeedModule } from './seed/seed.module';
import { InternalModule } from './internal/internal.module';
import { RulesModule } from './rules/rules.module';

import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Goal } from './goals/entities/goal.entity';
import { Recommendation } from './recommendations/entities/recommendation.entity';
import { RecommendationRule } from './rules/entities/recommendation-rule.entity';

type ParsedDatabaseUrl = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  // Render emite certificados autofirmados en conexiones internas.
  ssl?: { rejectUnauthorized: boolean };
};

const decodeComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Parsea DATABASE_URL (postgres:// o postgresql://) tal como la inyecta Render.
 * Devuelve null si la env no existe o es inválida: en ese caso se usa el
 * camino local clásico (DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME).
 */
function parseDatabaseUrl(url?: string): ParsedDatabaseUrl | null {
  const trimmed = url?.trim();
  if (!trimmed || !/^(postgres|postgresql):\/\//.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const database = decodeComponent(parsed.pathname.replace(/^\//, ''));
    if (!parsed.hostname || !database) {
      return null;
    }

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      username: decodeComponent(parsed.username),
      password: decodeComponent(parsed.password),
      database,
      // sslmode=require => TLS con certificado autofirmado (rejectUnauthorized=false).
      // Sin sslmode, la conexión interna de Render permite texto plano.
      ...(parsed.searchParams.get('sslmode') === 'require'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    };
  } catch {
    return null;
  }
}

@Module({
  // AppController (GET /api) es el health check de Render (healthCheckPath: /api).
  controllers: [AppController],
  providers: [AppService],
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // Configuración de TypeORM con PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Render (Blueprint) inyecta DATABASE_URL (postgres://...). Si existe,
        // manda sobre DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME; sin ella
        // se conserva exactamente el camino local actual (getOrThrow de DB_PASSWORD).
        const fromUrl = parseDatabaseUrl(configService.get<string>('DATABASE_URL'));
        // DB_SYNC ('true'/'false') tiene prioridad; sin env válido mantiene el
        // default actual: NODE_ENV !== 'production'.
        const dbSync = configService.get<string>('DB_SYNC')?.trim().toLowerCase();

        return {
          type: 'postgres',
          ...(fromUrl ?? {
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.getOrThrow<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME', 'caudo'),
          }),
          entities: [User, Category, Transaction, Goal, Recommendation, RecommendationRule],
          synchronize:
            dbSync === 'true' || dbSync === 'false'
              ? dbSync === 'true'
              : configService.get('NODE_ENV') !== 'production',
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    // Servir archivos estáticos (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    GoalsModule,
    RecommendationsModule,
    FilesModule,
    SeedModule,
    InternalModule,
    RulesModule,
  ],
})
export class AppModule {}
