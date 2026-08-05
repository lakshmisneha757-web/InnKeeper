import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EmailModule } from './email/email.module';
import { LockModule } from './lock/lock.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    LockModule,
    SchedulerModule,
  ],
})
export class AppModule {}
