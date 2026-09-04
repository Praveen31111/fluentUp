import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * 
 * Yeh service poori NestJS application mein PostgreSQL database connection
 * provide karti hai. Isko kisi bhi module mein inject kiya ja sakta hai.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Application start hote hi database se connect hona (with retry for Neon serverless cold-start)
  async onModuleInit() {
    let retries = 4;
    while (retries > 0) {
      try {
        await this.$connect();
        console.log('✅ Connected to PostgreSQL Database via Prisma');
        return;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error('❌ Failed to connect to PostgreSQL Database after retries:', err.message);
          throw err;
        }
        console.warn(`⚠️ Database waking up/connecting (${err.message}). Retrying in 2s... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Application band ya restart hone par database connection safely close karna
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Disconnected from PostgreSQL Database');
  }
}
