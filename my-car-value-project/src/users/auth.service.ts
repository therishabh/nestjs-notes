import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

// Node ka built-in `crypto.scrypt` callback-based hai (`scrypt(pw, salt, len, callback)`),
// Promise-based nahi. `promisify()` (Node ke `util` module se) ek callback-style function
// ko automatically Promise-return karne wale function me convert kar deta hai — isse
// hum neeche `await scrypt(...)` likh paaye, warna manually callback handle karna padta.
const scrypt = promisify(_scrypt);

// AuthService — "authentication/signup" jaisi cross-cutting business logic yaha rakhi
// gayi hai (duplicate-email check, password hashing), UsersService se ALAG isliye kiya
// gaya kyunki UsersService ko sirf "plain DB CRUD" tak limited rakhna best practice hai —
// AuthService "signup" jaisi higher-level workflow ko orchestrate karta hai, jo internally
// UsersService (DB layer) ko use karta hai. Single Responsibility Principle ka example hai.
@Injectable()
export class AuthService {
  // UsersService inject kiya — DB operations (find/create) ke liye isi service ko
  // delegate kiya jaata hai, AuthService khud repository ko touch nahi karta
  constructor(private readonly usersService: UsersService) {}

  async signup(email: string, password: string) {
    // check if email already exist
    // usersService.find() Step 10 wala "contains" search hai (Like()), lekin yaha exact
    // email diya ja raha hai, isliye practically exact match jaisa hi behave karega —
    // result hamesha ek ARRAY hai (find() ki definition se), isliye `.length` check kiya,
    // `if (user)` nahi (jo array ke liye galat hota, empty array bhi truthy hoti hai JS me)
    const user = await this.usersService.find(email);
    if (user.length) {
      // BadRequestException → Nest automatically 400 status code ke saath structured
      // error response bhej deta hai (duplicate email client ki galti hai, isliye 400 sahi hai,
      // NotFoundException/500 nahi)
      throw new BadRequestException('Email id already exist');
    }

    // ---- hashing user password ----
    // Password KABHI bhi plain text me DB me store nahi karna chahiye — agar DB kabhi
    // leak/breach ho jaaye, to attacker ko seedha real passwords mil jaayenge. Isliye
    // hash karke store karte hain — hash se original password wapas nikalna practically
    // impossible hota hai (one-way function).

    // generate a salt
    // Salt ek random string hai jo har user ke liye ALAG generate hoti hai. Iska fayda:
    // agar do users ka same password ho (e.g. "123456"), to salt alag hone ki wajah se
    // unka final stored hash bhi ALAG hoga — isse "rainbow table" attacks (precomputed
    // hash lookup tables) fail ho jaate hain, kyunki attacker ko HAR user ke liye alag se
    // brute-force karna padega.
    const salt = randomBytes(8).toString('hex');

    // hash a salt and password together
    // scrypt ek "key derivation function" hai (bcrypt/argon2 jaisa), jaan-bujh kar SLOW
    // aur memory-intensive design kiya gaya hai — isse brute-force attacks bahut expensive
    // ho jaate hain (fast hash functions jaise MD5/SHA-256 password hashing ke liye UNSAFE
    // hain, kyunki attacker unhe bahut fast brute-force kar sakta hai).
    // `as Buffer` — scrypt ka TypeScript return type generic hai, humein pata hai ki
    // ye actually Buffer hi return karega (kyunki humne koi custom encoding option nahi di),
    // isliye type assertion se TS ko explicitly bata diya
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // join the hashed result and salt together
    // Salt ko hash ke SAATH hi store karna zaroori hai (`salt.hash` format me) — kyunki
    // login ke time verify karne ke liye wahi salt dobara chahiye hoga (salt secret nahi
    // hota, sirf unique hona chahiye — isliye plain text me saath store karna safe hai)
    const encryptedPassword = salt + '.' + hash.toString('hex');

    // create user
    // Plain `password` ki jagah `encryptedPassword` (salt+hash) DB me save ho raha hai —
    // usersService.create() khud isme koi hashing nahi karta, isliye ye responsibility
    // AuthService ki hai (jahan se bhi user create ho raha hai, is layer se hokar guzarna zaroori hai)
    const newUser = this.usersService.create(email, encryptedPassword);

    return newUser;
  }
}
