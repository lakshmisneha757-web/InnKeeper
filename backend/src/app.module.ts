import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';

import { LockModule } from './lock/lock.module';

@Module({

  imports: [

    PrismaModule,

    LockModule,

  ],

})

export class AppModule {}