import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { GoalsModule } from '../goals/goals.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [
    CategoriesModule,
    UsersModule,
    TransactionsModule,
    GoalsModule,
    RecommendationsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
