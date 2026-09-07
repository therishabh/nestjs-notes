# My Car Value Project

Ye project Nest CLI se generate kiya gaya hai (`nest new my-car-value-project`). Isme ek real-world jaisi app banayenge jo car ki value estimate karti hai — is README me step-by-step likha jayega ki kya-kya banaya, kaise banaya, aur kyun banaya. Jab bhi kuch naya add karo, isi file me neeche add karte jana.

## Table of Contents

- [App Overview](#app-overview)
- [Project Structure](#project-structure)
- [Kaise Run Kare](#kaise-run-kare)
- [Learning Log (Step by Step)](#learning-log-step-by-step)
  - [Step 1: Project Generate Kiya](#step-1-project-generate-kiya)
  - [Step 2: Users aur Reports Modules Banaye](#step-2-users-aur-reports-modules-banaye)
  - [Step 3: TypeORM + SQLite Setup Kiya](#step-3-typeorm--sqlite-setup-kiya)
  - [Step 4: User Entity Banaya](#step-4-user-entity-banaya)
  - [Step 5: Report Entity Banaya](#step-5-report-entity-banaya)
  - [Step 6: Signup Endpoint + Validation Setup](#step-6-signup-endpoint--validation-setup)
- [Concepts Glossary](#concepts-glossary)

## App Overview

App design aur planning ke screenshots — kya banana hai iska rough sketch:

### API Design
<img width="1437" height="691" alt="Screenshot 2026-09-03 at 2 28 45 PM" src="https://github.com/user-attachments/assets/c7915d9a-9006-47d4-98fa-dea2007fbad3" />

### Module Design
<img width="1330" height="626" alt="Screenshot 2026-09-03 at 5 26 39 AM" src="https://github.com/user-attachments/assets/bb8060ef-81f0-4c45-af01-217636140ab0" />

## Project Structure

```
my-car-value-project/
└── src/
    ├── main.ts                          # App bootstrap — AppModule ko root bana kar NestFactory se app create/listen karta hai, global ValidationPipe bhi yahi lagta hai
    ├── app.module.ts                    # Root module — TypeOrmModule.forRoot() se DB connect karta hai, UsersModule aur ReportsModule import karta hai
    ├── app.controller.ts                # Default scaffold controller (GET /)
    ├── app.service.ts                   # Default scaffold service
    ├── users/
    │   ├── users.controller.ts          # `/auth` prefix ke saare routes (e.g. POST /auth/signup)
    │   ├── users.service.ts             # Users se related business logic — `create()` DB me naya user insert karta hai
    │   ├── user.entity.ts               # `User` DB table define karta hai (id, email, password columns)
    │   ├── user.dto.ts                  # `CreateUserDto` — signup request body ka expected shape + class-validator rules
    │   └── users.module.ts              # UsersController + UsersService ko group karta hai, TypeOrmModule.forFeature([User]) se User repository inject karne layak banata hai
    └── reports/
        ├── reports.controller.ts        # `/reports` route ka entry point (abhi khaali, aage endpoints add honge)
        ├── reports.service.ts           # Reports se related business logic (abhi khaali)
        ├── report.entity.ts             # `Report` DB table define karta hai (id, price columns)
        └── reports.module.ts            # ReportsController + ReportsService ko group karta hai, TypeOrmModule.forFeature([Report]) se Report repository inject karne layak banata hai
```

## Kaise Run Kare

```bash
npm install
npm run start:dev
```

Server `http://localhost:3000` pe start hoga. Run hote hi root folder me `db.sqlite` naam ki SQLite file auto-create ho jayegi (TypeORM `synchronize: true` ki wajah se) — abhi koi entity nahi hai isliye koi table nahi banega, lekin connection zaroor test ho jayega.

---

## Learning Log (Step by Step)

### Step 1: Project Generate Kiya

Nest CLI se project scaffold kiya gaya — default `AppModule`, `AppController`, `AppService` aur Jest testing setup already configured aata hai. Ye scaffold [dependency-injection-project](../dependency-injection-project/README.md) jaisa hi hai, bas isme purana scaffold hataya nahi gaya — `AppModule` ko hi aage extend karte gaye.

### Step 2: Users aur Reports Modules Banaye

App ke do main domains — `users` (log in karne wale users) aur `reports` (car value estimate reports) — ke liye Nest CLI ke schematics (`nest g module/controller/service`) use karke resource generate kiya:

```ts
// users/users.module.ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

```ts
// reports/reports.module.ts
@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

Dono modules abhi sirf skeleton hain (controller/service khaali hain), lekin root `AppModule` ke `imports` array me register ho chuke hain, isliye `/users` aur `/reports` route prefix already active hain:

```ts
// app.module.ts
@Module({
  imports: [
    UsersModule,
    ReportsModule,
  ],
  ...
})
export class AppModule {}
```

Isse ye pattern reinforce hota hai: **har feature ka apna module hota hai**, aur root module sirf un modules ko `imports` karta hai — [dependency-injection-project](../dependency-injection-project/README.md) me jo `imports`/`exports` ka concept seekha tha, wahi yahan real feature-modules ke liye use ho raha hai.

### Step 3: TypeORM + SQLite Setup Kiya

Database connect karne ke liye `@nestjs/typeorm`, `typeorm`, aur `sqlite3` packages install kiye, aur root `AppModule` me `TypeOrmModule.forRoot()` call karke connection configure kiya:

```ts
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',        // Database driver/engine — kaunsa database use ho raha hai (yahan SQLite, ek file-based DB)
      database: 'db.sqlite',  // Database file ka naam/path — SQLite yahan is file me data store karega
      entities: [],            // Entity classes (tables) ki list — abhi empty, User/Report entities banne ke baad yaha add hongi
      synchronize: true,       // TypeORM ko entities ke basis pe DB schema auto create/update karne dega — dev me convenient, production me data loss ka risk
    }),
    UsersModule,
    ReportsModule,
  ],
  ...
})
export class AppModule {}
```

**Ek gotcha jo yaha mila**: `package.json` me `typeorm` ka version galti se `^1.1.1` (ek bahut purana, incompatible version) install ho gaya tha, jabki `@nestjs/typeorm@12` ko TypeORM `0.3.x` chahiye. Isi wajah se TypeScript error aa raha tha:

```
error TS2322: Type '"sqlite"' is not assignable to type '"aurora-mysql" | ... | undefined'.
```

Kyunki purane typings me `type` field ke valid values ki list me `'sqlite'` shamil hi nahi tha. Fix simple tha — sahi version install karna:

```bash
npm install typeorm@^0.3.20
```

Isse ye seekhne ko mila: agar kisi library ka type error samajh na aaye, to pehle ye check karo ki **installed version compatible hai ya nahi** — kabhi kabhi bug code me nahi, `package.json` ke dependency version mismatch me hota hai.

### Step 4: User Entity Banaya

Ab tak `entities: []` khaali tha — pehli real entity `User` banayi gayi, jo TypeORM decorators use karke ek DB table ko represent karti hai:

```ts
// users/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  password!: string;
}
```

- **`@Entity()`** class ko ek DB table bana deta hai (default table naam class ke naam se, yahan `user`).
- **`@PrimaryGeneratedColumn()`** primary key column banata hai jiski value TypeORM khud auto-increment karke generate karta hai.
- **`@Column()`** ek normal DB column banata hai — yahan `email` aur `password` dono plain text columns hain.
- **`!` (definite assignment assertion)** har property ke aage laga hai kyunki TypeScript ka `strictPropertyInitialization` chahta hai ki har property constructor me hi initialize ho jaaye, warna compile error deta hai. Lekin `id`/`email`/`password` humne khud `new User()` karke set nahi karni — TypeORM DB se row load karte waqt ya insert ke time inhe internally populate karta hai. `!` laga kar TS ko bola jaata hai: *"trust karo, ye value runtime pe zaroor set hogi, compile-time check mat karo."*

Is entity ko do jagah register karna zaroori tha:

```ts
// app.module.ts — poori app ko batata hai ki User entity DB schema ka hissa hai
TypeOrmModule.forRoot({
  ...
  entities: [User],
}),
```

```ts
// users.module.ts — sirf UsersModule ko User ka repository (DB queries chalane wala object) inject karne layak banata hai
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

Farak samajhna zaroori hai: `forRoot()` me `entities` array **global schema** define karta hai (TypeORM ko pata chalta hai kaunse tables exist karte hain), jabki `forFeature()` sirf us particular module ko us entity ka **repository** (`@InjectRepository(User)` se use hone wala) available karata hai — dono alag purpose serve karte hain.

### Step 5: Report Entity Banaya

`User` ke baad wahi pattern doosri entity `Report` ke liye repeat kiya gaya — car value report ke liye bhi ek DB table chahiye tha:

```ts
// reports/report.entity.ts
@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  price!: number;
}
```

Aur `User` jaisa hi wiring do jagah kiya gaya:

```ts
// app.module.ts — Report ko bhi global entity list me add kiya
TypeOrmModule.forRoot({
  ...
  entities: [User, Report],
}),
```

```ts
// reports.module.ts — ReportsModule ko Report ka repository inject karne layak banaya
@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

Isse ye confirm hota hai ki [Step 4](#step-4-user-entity-banaya) me seekha gaya pattern — entity banao, `forRoot()` ke `entities` me global register karo, aur jis module ko uska repository chahiye usme `forFeature()` se import karo — **har entity ke liye repeat hota hai**, ye ek fixed recipe hai jo poore project me follow hoga.

### Step 6: Signup Endpoint + Validation Setup

Pehla real endpoint bana — `POST /auth/signup` — jisme ek DTO, validation, aur DB insert teeno jud kar kaam karte hain.

**`user.dto.ts`** — request body ka expected shape aur uski validation rules define karta hai:

```ts
// users/user.dto.ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
```

**`main.ts`** — global `ValidationPipe` lagaya gaya taaki har route pe alag se validation lagane ki zaroorat na pade:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

- **`ValidationPipe`** request aane par usse DTO ke decorators (`@IsEmail`, `@IsString`) ke against check karta hai — validation fail hote hi controller tak pahunche bina hi `400 Bad Request` return ho jaata hai.
- **`whitelist: true`** DTO me define na kiye gaye extra fields (jo body me aaye but unpe koi decorator nahi hai) ko silently strip kar deta hai, error nahi deta.

**`users.controller.ts`** — request receive karke `UsersService` ko delegate karta hai:

```ts
@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/signup')
  create(@Body() bodyData: CreateUserDto) {
    return this.usersService.create(bodyData.email, bodyData.password);
  }
}
```

**`users.service.ts`** — actual DB insert karta hai:

```ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  create(email: string, password: string) {
    const user = this.repo.create({ email, password });
    return this.repo.save(user);
  }
}
```

- **`repo.create({ email, password })`** sirf ek **in-memory** `User` instance banata hai — DB me abhi kuch save nahi hota.
- **`repo.save(user)`** asal me DB me `INSERT` query chalata hai, aur ek `Promise<User>` return karta hai jisme saved user (auto-generated `id` ke saath) hota hai.
- Controller me `return this.usersService.create(...)` likhna zaroori tha — Nest is returned Promise ko khud resolve karke response body me bhej deta hai. Pehle `return` missing tha, isliye response khaali (`undefined`) jaata tha.

**Ek gotcha jo yaha mila**: JSON body bhejte waqt (Postman/curl se) agar keys bina double-quotes ke likhi jaye (jaise JS object literal — `{ email: "x" }`), to Express ka body-parser fail ho jaata hai kyunki wo **strict JSON** parse karta hai (JS object syntax nahi):

```json
{
  "statusCode": 400,
  "message": "Expected property name or '}' in JSON at position 6 (line 2 column 5)",
  "error": "Bad Request"
}
```

Fix: har key ko double quotes me likho — `{ "email": "test@test.com", "password": "123456" }`. Ye error `ValidationPipe` se pehle hi aata hai, is liye DTO validation se koi lena dena nahi hai.

**Floating promises**: `bootstrap()` aur controller ke `create()` dono async kaam karte hain jinke Promise ko explicitly handle na karne pe ESLint warning deta hai ("Promises must be awaited..."). Fix: jaha result chahiye wahan `return` karo (controller me), aur jaha result me interest nahi hai wahan `void` operator se explicitly ignore karo (`void bootstrap();`) — dono cases me ESLint ko pata chal jaata hai ki Promise jaan-bujh kar handle nahi ki gayi hai, accidentally nahi bhoola gaya.

---

## Concepts Glossary

Jitne bhi NestJS/TS/TypeORM concepts is project me cover kiye hain, unki short reference yahan hai — kisi bhi cheez ka matlab bhoolo to yahan dekh lo.

| Concept | Kahan use hua | Iska matlab |
| --- | --- | --- |
| **Nest CLI** (`nest new`) | [Step 1](#step-1-project-generate-kiya) | Boilerplate project scaffold karne ka tool — module/controller/service ka default setup auto-generate karta hai |
| **Nest CLI Schematics** (`nest g module/controller/service`) | [Step 2](#step-2-users-aur-reports-modules-banaye) | Ek command se ek feature ke liye module + controller + service teeno files aur unka boilerplate wiring auto-generate karta hai |
| **Feature Module** | [Step 2](#step-2-users-aur-reports-modules-banaye) | Ek specific domain/feature (yahan `users`, `reports`) ke controllers aur providers ko apne andar group karne wala module |
| **`@Controller('prefix')`** | [Step 2](#step-2-users-aur-reports-modules-banaye) | Class ko HTTP routes handle karne wala controller banata hai, aur uske saare routes ke aage `prefix` add karta hai (e.g. `/users`) |
| **TypeORM** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Node.js/TypeScript ka ORM (Object-Relational Mapper) — DB tables ko JS/TS classes (entities) ke through manage karne deta hai, raw SQL likhne ki zaroorat kam ho jaati hai |
| **`@nestjs/typeorm`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | TypeORM ko NestJS ke DI system ke saath integrate karne wala official wrapper package |
| **`TypeOrmModule.forRoot()`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Poori application ke liye ek baar database connection configure/establish karta hai (root module me use hota hai) |
| **`type` (DB driver)** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Kaunsa database engine use ho raha hai batata hai (`sqlite`, `postgres`, `mysql`, etc.) — TypeORM isi ke basis pe sahi driver load karta hai |
| **`database`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | SQLite jaise file-based DB ke liye us file ka naam/path jaha actual data store hota hai |
| **`entities`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Un saari classes ki list jo DB tables represent karti hain — TypeORM inhi se schema samajhta hai |
| **`synchronize: true`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | TypeORM ko entities dekh kar DB schema (tables/columns) automatically create/update karne deta hai — dev me fast iteration ke liye achha, production me **kabhi use nahi karna** (accidental data loss ho sakta hai) |
| **Dependency Version Mismatch** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Jab `package.json` me kisi library ka version doosri dependency (e.g. `@nestjs/typeorm`) ki required range se match nahi karta, aur usse type errors ya runtime errors aate hain — fix hamesha sahi version install karna hota hai, code nahi |
| **`@Entity()`** | [Step 4](#step-4-user-entity-banaya) | Class ko ek DB table ke roop me register karta hai — TypeORM isi class se schema samajhta hai |
| **`@PrimaryGeneratedColumn()`** | [Step 4](#step-4-user-entity-banaya) | Table ka primary key column banata hai, jiski value TypeORM khud auto-increment karke generate karta hai |
| **`@Column()`** | [Step 4](#step-4-user-entity-banaya) | Class property ko ek normal DB column banata hai |
| **Definite Assignment Assertion (`!`)** | [Step 4](#step-4-user-entity-banaya) | Property naam ke aage laga `!`, TypeScript ko batata hai ki value humne khud set nahi ki (yahan TypeORM runtime pe karega), isliye "not initialized" compile error na de |
| **`TypeOrmModule.forRoot()` vs `forFeature()`** | [Step 4](#step-4-user-entity-banaya) | `forRoot()` poori app ke liye DB connection + global entity list define karta hai; `forFeature([Entity])` sirf us module ko us entity ka repository (DB query karne wala object) inject karne layak banata hai |
| **DTO (`CreateUserDto`)** | [Step 6](#step-6-signup-endpoint--validation-setup) | Ek plain class jo request body ka expected shape define karti hai, aur `class-validator` decorators ke through validation rules bhi carry karti hai |
| **`class-validator` decorators (`@IsEmail`, `@IsString`)** | [Step 6](#step-6-signup-endpoint--validation-setup) | DTO ki har property pe lagte hain, aur batate hain ki us field ki value kis format/type me honi chahiye |
| **`ValidationPipe`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Incoming request body ko DTO ke validation rules ke against automatically check karta hai — fail hone par controller tak pahunche bina hi `400` return kar deta hai |
| **`useGlobalPipes()`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Ek pipe ko poori application ke har route pe apply karta hai, har controller me alag se lagane ki zaroorat nahi rehti |
| **`whitelist: true`** | [Step 6](#step-6-signup-endpoint--validation-setup) | DTO me define na kiye gaye extra request body fields ko silently strip/remove kar deta hai |
| **`@InjectRepository(Entity)`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Constructor parameter pe lagta hai, Nest ko batata hai ki us entity ka `Repository` yaha inject karo (`forFeature()` se available hua provider) |
| **`repo.create()` vs `repo.save()`** | [Step 6](#step-6-signup-endpoint--validation-setup) | `create()` sirf ek in-memory entity instance banata hai (DB me kuch nahi hota); `save()` asal me DB me insert/update query chalata hai aur Promise return karta hai |
| **Floating Promise** | [Step 6](#step-6-signup-endpoint--validation-setup) | Jab ek async function ka returned Promise na `await` kiya jaye, na `return` kiya jaye, na `.catch()` laga ho — ESLint isse warning deta hai kyunki reject hone par error silently gum ho sakta hai; fix `return`, `await`, ya jaan-bujh kar `void` operator lagana hai |
| **JSON.parse strictness** | [Step 6](#step-6-signup-endpoint--validation-setup) | Raw HTTP body ko JSON banane ke liye keys **double-quotes** me hona zaroori hai (JS object literal syntax jaise unquoted keys yaha invalid hain) — warna `ValidationPipe` tak pahunchne se pehle hi body-parser 400 de deta hai |
