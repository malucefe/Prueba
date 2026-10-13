import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';
import { RecommendationRule } from '../rules/entities/recommendation-rule.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Transaction, Recommendation, RecommendationRule]),
  ],
  controllers: [InternalController],
  providers: [InternalService, ApiKeyGuard],
})
export class InternalModule {}
