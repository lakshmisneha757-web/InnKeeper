import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { EmailModule } from '../email/email.module';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EmailModule,
    LockModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
