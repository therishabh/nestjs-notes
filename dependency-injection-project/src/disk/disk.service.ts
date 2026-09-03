import { Injectable } from '@nestjs/common';
import { PowerService } from 'src/power/power.service';

@Injectable()
export class DiskService {
  constructor(private readonly powerService: PowerService) {}

  getData() {
    console.log('we are drawing 20 watts of power from Power Service');
    this.powerService.supplyPower(20);
    return 'disk data';
  }
}
