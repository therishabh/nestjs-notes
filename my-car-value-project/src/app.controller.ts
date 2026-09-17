import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// AuthGuard ab globally "login required" default hai (dekho app.module.ts). Ye route
// (default health-check-jaisa root `/`) jaan-bujh kar public rakha — root route pe login
// maangna real apps me bhi anusual hota, isliye `@Public()` se explicitly guard se
// exclude kiya.
import { Public } from './users/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
