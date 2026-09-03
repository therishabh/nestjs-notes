# NestJS Notes

Ye repo mera NestJS seekhne ka journal hai — har sub-folder ek alag project hai jisme koi na koi naya concept step-by-step practice kiya gaya hai. Neeche projects **usi order me** likhe hain jis order me banaye gaye — jab bhi koi naya project shuru karo, isi list ke end me add karte jana.

## Projects

1. **[scratch](./scratch/README.md)** — NestJS ka sabse pehla project, Nest CLI use kiye bina, manually `npm init` se setup karke basics (modules, controllers, decorators, TypeScript config) samjhe gaye.
2. **[mini-messages-app](./mini-messages-app/README.md)** — Nest CLI se scaffold kiya gaya pehla "real" project — routing, DTOs, `class-validator` validation, file-based repository pattern, Dependency Injection, aur proper error handling (404, etc.) cover kiya.
3. **[dependency-injection-project](./dependency-injection-project/README.md)** — Dependency Injection ko deep-dive karke practice karne ke liye dedicated project — single-module se shuru karke multi-module DI chain (Controller → Service → Service), `exports`, aur singleton scope tak explore kiya.
4. **[my-car-value-project](./my-car-value-project/README.md)** — Abhi fresh Nest CLI scaffold hai, kaam shuru hona baaki hai.

## Kaise Padhein

Har project ke apne README me ek **Learning Log** section hota hai jisme step-by-step likha hota hai ki kya seekha aur kya fix kiya, aur end me ek **Concepts Glossary** table hota hai jisme har NestJS/TS concept ka short matlab aur uska commit link milta hai.
