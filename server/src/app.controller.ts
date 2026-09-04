/**
 * FluentUp - Application Controller
 * 
 * Root endpoint controller jo base route (/) aur health check handle karta hai.
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// @Controller decorator route path define karta hai (yahan root '/')
@Controller()
export class AppController {
  // AppService ko constructor ke zariye inject kiya gaya hai
  constructor(private readonly appService: AppService) {}

  // GET / -> Root API health check endpoint
  @Get()
  getApiStatus() {
    return this.appService.getApiStatus();
  }

  // GET /health -> Monitoring aur cloud hosting (Render/Railway) ke liveness probe ke liye
  @Get('health')
  getHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }
}
