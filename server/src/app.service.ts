/**
 * FluentUp - Application Service
 * 
 * Yeh service root API status aur server health check logic provide karti hai.
 */

import { Injectable } from '@nestjs/common';

// @Injectable decorator NestJS ko batata hai ki yeh class dependency injection ke liye available hai
@Injectable()
export class AppService {
  // Server ka health status aur metadata return karne wala function
  getApiStatus() {
    return {
      name: 'FluentUp Backend Engine',
      version: '1.0.0',
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      service: 'English Speaking Partner Matchmaking & Audio Gateway',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
