import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quota } from './quota.entity';

@Injectable()
export class QuotasService {
  constructor(
    @InjectRepository(Quota)
    private quotasRepository: Repository<Quota>,
  ) {}

  async getQuota(userId: string): Promise<Quota> {
    let quota = await this.quotasRepository.findOne({ where: { userId } });

    if (!quota) {
      quota = this.quotasRepository.create({
        userId,
        plan: 'free',
        storageUsed: 0,
        storageLimit: 5368709120, // 5GB
        transcodeMinutes: 0,
        transcodeLimit: 60,
        aiCredits: 0,
        aiCreditLimit: 100,
      });
      quota = await this.quotasRepository.save(quota);
    }

    return quota;
  }

  async updateUsage(userId: string, field: string, amount: number): Promise<Quota> {
    const quota = await this.getQuota(userId);

    if (field === 'storageUsed') {
      quota.storageUsed += amount;
    } else if (field === 'transcodeMinutes') {
      quota.transcodeMinutes += amount;
    } else if (field === 'aiCredits') {
      quota.aiCredits += amount;
    } else {
      throw new BadRequestException(`Unknown quota field: ${field}`);
    }

    return this.quotasRepository.save(quota);
  }

  async checkQuota(userId: string, field: string, required: number): Promise<boolean> {
    const quota = await this.getQuota(userId);

    if (field === 'storage') {
      return quota.storageUsed + required <= quota.storageLimit;
    } else if (field === 'transcode') {
      return quota.transcodeMinutes + required <= quota.transcodeLimit;
    } else if (field === 'aiCredits') {
      return quota.aiCredits + required <= quota.aiCreditLimit;
    }

    throw new BadRequestException(`Unknown quota field: ${field}`);
  }

  async resetMonthlyQuotas(): Promise<void> {
    // Reset transcode minutes and AI credits
    const quotas = await this.quotasRepository.find();

    for (const quota of quotas) {
      quota.transcodeMinutes = 0;
      quota.aiCredits = 0;
      quota.resetAt = new Date();
      await this.quotasRepository.save(quota);
    }
  }
}
