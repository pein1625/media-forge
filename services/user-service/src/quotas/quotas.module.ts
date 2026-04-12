import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quota } from './quota.entity';
import { QuotasService } from './quotas.service';
import { QuotasController } from './quotas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quota])],
  providers: [QuotasService],
  controllers: [QuotasController],
  exports: [QuotasService],
})
export class QuotasModule {}
