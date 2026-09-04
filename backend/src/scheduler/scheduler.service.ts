import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  onModuleInit() {
    this.logger.log('SchedulerService disabled');
  }

  async handleAutomatedCheckInEmail() {
    // Disabled: broken scheduler referencing non-existent Prisma schema fields
  }
}
