import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@media-forge/database';
import { KafkaModule } from '@media-forge/kafka';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QuotasModule } from './quotas/quotas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule.forRoot({
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/user_db',
    }),
    KafkaModule.forRoot({
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: 'user-service',
      groupId: 'user-service-group',
    }),
    UsersModule,
    AuthModule,
    QuotasModule,
  ],
})
export class AppModule {}
