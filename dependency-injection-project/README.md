# Dependency Injection Project

Ye project Nest CLI se generate kiya gaya hai (`nest new dependency-injection-project`), aur isme NestJS ke **Dependency Injection (DI)** system ko step by step deep-dive karke practice kiya jayega. Neeche jo bhi kiya hai wo order me likha hai — jab bhi kuch naya add karo, isi file me neeche add karte jana.

## Table of Contents

- [Project Structure](#project-structure)
- [Kaise Run Kare](#kaise-run-kare)
- [Learning Log (Step by Step)](#learning-log-step-by-step)
  - [Step 1: Project Generate Kiya](#step-1-project-generate-kiya)
  - [Step 2: Multi-Module DI — Computer → Cpu/Disk → Power](#step-2-multi-module-di--computer--cpudisk--power)
- [Concepts Glossary](#concepts-glossary)

## Project Structure

```
dependency-injection-project/
└── src/
    ├── main.ts                       # App bootstrap — ComputerModule ko root bana kar NestFactory se app create/listen karta hai
    ├── power/
    │   ├── power.service.ts          # Sabse niche wali "shared" service — kisi aur service pe depend nahi karti
    │   └── power.module.ts           # PowerService ko provide + export karta hai
    ├── cpu/
    │   ├── cpu.service.ts            # PowerService inject karke "compute" karta hai
    │   └── cpu.module.ts             # PowerModule import karta hai, CpuService ko export karta hai
    ├── disk/
    │   ├── disk.service.ts           # PowerService inject karke "disk data" return karta hai
    │   └── disk.module.ts            # PowerModule import karta hai, DiskService ko export karta hai
    └── computer/
        ├── computer.controller.ts    # CpuService + DiskService dono inject karke GET /computer serve karta hai
        └── computer.module.ts        # CpuModule + DiskModule import karta hai — ye hi ab root module hai
```

Purana default scaffold (`AppModule`, `AppController`, `AppService`) hata diya gaya hai — ab root module `ComputerModule` hai, jo ek 4-level DI chain (Controller → Service → Service) demonstrate karta hai.

## Kaise Run Kare

```bash
npm install
npm run start:dev
```

Server `http://localhost:3000` pe start hoga. `GET /computer` route call karne par `CpuService.compute()` aur `DiskService.getData()` dono call hote hain, aur dono internally `PowerService.supplyPower()` use karte hain — response ek array hoga jisme dono ka result hoga.

---

## Learning Log (Step by Step)

### Step 1: Project Generate Kiya

Nest CLI se project scaffold kiya gaya — isme by default `AppModule`, `AppController`, `AppService` aur testing setup (Jest) already configured aata hai. Iske alawa `nest-cli.json`, ESLint, Prettier config bhi default se aaye.

Default scaffold me hi DI ka sabse basic pattern already dikh jaata hai:

```ts
// app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  ...
}
```

```ts
// app.service.ts
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

- `AppService` pe `@Injectable()` decorator laga hai, isliye Nest isse ek "provider" maanta hai jo DI container me register ho sakta hai.
- `app.module.ts` ke `providers: [AppService]` array me register hone ki wajah se, `AppController` apne constructor me `AppService` maang sakta hai — Nest khud `new AppService()` karke inject kar deta hai, controller ko khud instance banane ki zaroorat nahi.

Ye samajhna hi is project ka starting point hai — aage inhi buniyaadi ideas (providers, scopes, custom providers, `@Inject()`, circular dependencies, etc.) ko explore karenge.

---

### Step 2: Multi-Module DI — Computer → Cpu/Disk → Power

Step 1 ka default `AppModule`/`AppController`/`AppService` hata kar ek real-world jaisa 4-module setup banaya gaya, jisse ye dikhe ki DI sirf ek module ke andar nahi, **poore application graph** me kaam karta hai.

**`PowerModule`** — sabse niche ki layer, sirf ek `PowerService` provide karta hai jo kisi aur service pe depend nahi karta:

```ts
// power.service.ts
@Injectable()
export class PowerService {
  supplyPower(watts: string | number) {
    console.log('Total watts i received : ' + watts);
  }
}
```

```ts
// power.module.ts
@Module({
  providers: [PowerService],
  exports: [PowerService],
})
export class PowerModule {}
```

`exports: [PowerService]` yahan sabse zaroori line hai — iske bina `PowerService` sirf `PowerModule` ke andar hi use ho paati, kisi doosre module ko dikhti hi nahi.

**`CpuModule`** aur **`DiskModule`** — dono `PowerModule` ko `imports` me le kar `PowerService` istemal karte hain:

```ts
// cpu.service.ts
@Injectable()
export class CpuService {
  constructor(private readonly powerService: PowerService) {}

  compute(a: number, b: number) {
    this.powerService.supplyPower(10);
    return a + b;
  }
}
```

```ts
// cpu.module.ts
@Module({
  imports: [PowerModule],
  providers: [CpuService],
  exports: [CpuService],
})
export class CpuModule {}
```

`DiskModule` bhi bilkul isi pattern pe hai (`DiskService` → `PowerService`, aur `exports: [DiskService]`).

**`ComputerModule`** — sabse upar, `CpuModule` aur `DiskModule` dono ko import karta hai, aur ye ab **root module** hai (`main.ts` me `NestFactory.create(ComputerModule)`):

```ts
// computer.controller.ts
@Controller('computer')
export class ComputerController {
  constructor(
    private readonly diskService: DiskService,
    private readonly cpuService: CpuService,
  ) {}

  @Get()
  run() {
    return [this.cpuService.compute(1, 2), this.diskService.getData()];
  }
}
```

```ts
// computer.module.ts
@Module({
  controllers: [ComputerController],
  imports: [CpuModule, DiskModule],
})
export class ComputerModule {}
```

Isse jo cheezein clear hoti hain:

- **Chained/transitive DI**: `ComputerController` ko `PowerService` ke baare me kuch pata bhi nahi, phir bhi wo indirectly `CpuService`/`DiskService` ke through use ho rahi hai — har module sirf apni immediate dependency jaanta hai.
- **`exports` ek "public API" hai**: koi bhi provider by default sirf apne module ke andar hi visible hota hai. Doosre module use tab hi use kar sakte hain jab wo `exports` array me explicitly listed ho.
- **Har module apni dependency khud import karta hai**: `CpuModule` aur `DiskModule` dono independently `PowerModule` ko import karte hain — `ComputerModule` ko `PowerModule` se koi seedha matlab nahi.
- **Singleton scope by default**: `PowerService` do jagah (`CpuModule`, `DiskModule`) import hone ke bawajood, Nest DI container uska sirf **ek hi instance** banata hai (default provider scope `DEFAULT`/singleton hai) — dono services same `PowerService` instance share karti hain, do alag instance nahi.
- **Root module badal sakta hai**: `main.ts` me `NestFactory.create()` ko ab koi bhi module diya ja sakta hai jo poore application graph ko `imports` se jod de — zaroori nahi ki naam `AppModule` hi ho.

---

## Concepts Glossary

Jitne bhi NestJS/TS concepts is project me cover kiye hain, unki short reference yahan hai — kisi bhi cheez ka matlab bhoolo to yahan dekh lo.

| Concept | Kahan use hua | Iska matlab | Commit |
| --- | --- | --- | --- |
| **Nest CLI** (`nest new`) | [Step 1](#step-1-project-generate-kiya) | Boilerplate project scaffold karne ka tool — module/controller/service ka default setup auto-generate karta hai | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **`@Module()`** | [Step 1](#step-1-project-generate-kiya) | Ek feature (yahan root `AppModule`) ke `controllers`, `providers`, `imports`, `exports` ko group karta hai | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **`@Controller()`** | [Step 1](#step-1-project-generate-kiya) | Class ko HTTP routes handle karne wala controller banata hai | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **`@Injectable()`** | [Step 1](#step-1-project-generate-kiya) | Class ko DI container me instantiate/inject karne layak "provider" banata hai | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **Dependency Injection (DI)** | [Step 1](#step-1-project-generate-kiya) | Classes apni dependencies khud `new` nahi karti — Nest ka DI container constructor me automatically inject karta hai | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **Module `providers` array** | [Step 1](#step-1-project-generate-kiya) | `@Injectable()` classes ko us module ke DI scope me actually register karta hai — sirf decorator kaafi nahi | [`0a1d7e7`](https://github.com/therishabh/nestjs-notes/commit/0a1d7e7) |
| **Module `imports` array** | [Step 2](#step-2-multi-module-di--computer--cpudisk--power) | Kisi doosre module ke exported providers ko current module ke DI scope me available karata hai | [`822f0f8`](https://github.com/therishabh/nestjs-notes/commit/822f0f8) |
| **Module `exports` array** | [Step 2](#step-2-multi-module-di--computer--cpudisk--power) | Module ke providers me se kis-kisko "public" banana hai (import karne wale modules ke liye) wo decide karta hai | [`822f0f8`](https://github.com/therishabh/nestjs-notes/commit/822f0f8) |
| **Transitive/Chained DI** | [Step 2](#step-2-multi-module-di--computer--cpudisk--power) | Ek provider doosre provider pe depend karta hai, jo aage kisi teesre pe — Nest poori chain khud resolve kar deta hai | [`822f0f8`](https://github.com/therishabh/nestjs-notes/commit/822f0f8) |
| **Singleton Provider Scope** | [Step 2](#step-2-multi-module-di--computer--cpudisk--power) | Default scope — chahe ek provider kitne bhi modules me import ho, Nest DI container uska sirf ek hi instance banata hai | [`822f0f8`](https://github.com/therishabh/nestjs-notes/commit/822f0f8) |
| **Root Module (bootstrap)** | [Step 2](#step-2-multi-module-di--computer--cpudisk--power) | `NestFactory.create()` ko diya jaane wala module, jo poore application dependency graph ka entry point hota hai | [`822f0f8`](https://github.com/therishabh/nestjs-notes/commit/822f0f8) |
