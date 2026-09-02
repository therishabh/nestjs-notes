import { Injectable } from '@nestjs/common';
import { PowerService } from 'src/power/power.service';

@Injectable()
export class CpuService {
  constructor(private readonly powerService: PowerService) {}

  compute(a: number, b: number) {
    this.powerService.supplyPower(10);
    console.log('we are drawing 10 watts of power from Power Service');
    return a + b;
  }
}
