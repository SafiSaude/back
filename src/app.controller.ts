import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('/')
  getWelcome() {
    return this.appService.getWelcome();
  }

  @Post('seed/super-admin')
  seedSuperAdmin() {
    return this.appService.seedSuperAdmin();
  }
}
