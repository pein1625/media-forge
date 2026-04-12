import { Controller, Get, UseGuards } from '@nestjs/common';
import { QuotasService } from './quotas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@media-forge/common';
import { User } from '../users/user.entity';
import { Quota } from './quota.entity';

@Controller('users/me/quota')
export class QuotasController {
  constructor(private quotasService: QuotasService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getQuota(@CurrentUser() user: User): Promise<Quota> {
    return this.quotasService.getQuota(user.id);
  }
}
