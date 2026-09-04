import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule
 * 
 * @Global decorator use kiya hai taaki PrismaService ko har module mein
 * baar-baar import na karna pade. Yeh globally available ho jayegi.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Dusre modules ko PrismaService use karne ki permission
})
export class PrismaModule {}
