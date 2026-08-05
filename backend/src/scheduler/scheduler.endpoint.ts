import { Injectable, Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Injectable()
export class SchedulerEndpoint {
  private readonly logger = new Logger(SchedulerEndpoint.name);

  constructor(private readonly schedulerService: SchedulerService) {}

  async processPendingEmails() {
    this.logger.log('Manual scheduler endpoint triggered for pending emails');
    await this.schedulerService.handleAutomatedCheckInEmail();
    return { ok: true };
  }
}
