import { Injectable } from '@nestjs/common';

@Injectable()
export class PowerService {
  supplyPower(watts: string | number) {
    console.log('Total watts i received : ' + watts);
  }
}
