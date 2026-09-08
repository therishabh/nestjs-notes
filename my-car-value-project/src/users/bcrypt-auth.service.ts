import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// BcryptAuthService — sirf LEARNING/DEMO ke liye banaya gaya, taaki dikha sake ki
// `bcrypt` library se password hashing kitni simple ho jaati hai — hand-rolled
// `crypto.scrypt` (dekho auth.service.ts) ke muqable, bcrypt khud salt generate
// karta hai aur ek hi self-contained string me store karne layak format deta hai.
// (Production me sirf EK approach use karo — dono services rakhna sirf isliye hai
// taaki tum scrypt vs bcrypt ka farak side-by-side dekh sako.)
@Injectable()
export class BcryptAuthService {
  // "Salt rounds" (aka "cost factor") — bcrypt ka core security knob. Ye batata hai
  // kitni baar internally hashing round chalega: actual iterations = 2^saltRounds.
  // Jitna zyada, utna SLOW (isliye brute-force zyada expensive) lekin utna hi zyada
  // CPU time legitimate login pe bhi lagega — 10-12 aajkal ka industry-standard
  // sweet-spot hai (10 = 2^10 = 1024 rounds).
  private readonly saltRounds = 10;

  // ---- HASH karna (signup ke time) ----
  async hashPassword(plainPassword: string): Promise<string> {
    // bcrypt.hash() do kaam ek saath karta hai jo humne scrypt approach me manually
    // kiye the: (1) ek random salt generate karna, (2) usse password ke saath hash karna.
    // Return value ek SINGLE string hoti hai jisme sab kuch encoded hota hai:
    //
    //   $2b$10$N9qo8uLOickgx2ZMRZoMy.MrqPzn8YwqZlN9UUM5tG5UvsGmXO5xu
    //   └┬┘└┬┘└──────────┬───────────┘└─────────────┬──────────────┘
    //  algo  cost      salt (22 chars)         hash (31 chars)
    //
    // Isse hume khud salt ko `.` se join karke store karne ki zaroorat nahi (jaisa
    // scrypt approach me kiya tha) — bcrypt ka format khud self-describing hai,
    // isliye agar kal cost factor badlo (e.g. 10 → 12), purane hashes bhi bina
    // problem ke verify ho payenge (format me hi cost embedded hai).
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  // ---- VERIFY karna (login ke time) ----
  async comparePassword(
    plainPassword: string,
    storedHash: string,
  ): Promise<boolean> {
    // bcrypt.compare() ko RAW plain password aur DB se aaya stored hash dono dene hote hain.
    // Ye khud stored hash se salt+cost extract kar leta hai, plainPassword ko usi salt
    // se dobara hash karta hai, aur dono hashes compare karta hai — humein khud
    // "salt nikaalo, dobara hash karo, string compare karo" jaisa manual kaam nahi karna.
    // NOTE: ye hamesha `bcrypt.compare()` se hi karna — kabhi manually `===` se
    // compare mat karna (timing attacks se bachne ke liye ye constant-time compare karta hai).
    return bcrypt.compare(plainPassword, storedHash);
  }
}
