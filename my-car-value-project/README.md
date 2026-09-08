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
- [Interview Prep — Q&A](#interview-prep--qa)

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

---

## Interview Prep — Q&A

Ye project me jo concepts practically use kiye, unpe based common interview questions — taaki sirf "code likh diya" na ho, balki "kyun likha aur alternative kya the" bhi explain kar sako.

### NestJS Core / Dependency Injection

**Q: Dependency Injection kya hai aur NestJS isse kaise implement karta hai?**
DI ek design pattern hai jisme koi class apni dependencies khud `new` nahi karti, balki bahar se (constructor ke through) receive karti hai. NestJS ke paas ek built-in **DI container/IoC container** hai jo `@Injectable()` classes ko track karta hai aur jab kisi constructor me wo class maangi jaati hai, khud instance bana kar (ya already-bani instance reuse karke) inject kar deta hai. Fayda: **loose coupling** (classes ek doosre ke concrete implementation pe depend nahi karti) aur **testability** (test me real dependency ki jagah mock inject kar sakte ho).

**Q: `@Module()`, `@Controller()`, `@Injectable()` — teeno me kya farak hai?**
- `@Module()` — ek feature ko group karta hai (`controllers`, `providers`, `imports`, `exports`).
- `@Controller()` — HTTP requests handle karta hai, routes define karta hai.
- `@Injectable()` — class ko DI container me register hone layak "provider" banata hai (services, repositories, guards, etc. sab isi se marked hote hain).

**Q: `imports` aur `exports` array ka kya role hai?**
`providers` array me register hui koi bhi cheez by default sirf usi module ke andar visible hoti hai. Doosre module use tabhi kar sakte hain jab: (1) provider wale module ne usse `exports` array me daala ho, AND (2) use karne wale module ne us provider-wale module ko `imports` me liya ho. Isi project me [Step 2](#step-2-users-aur-reports-modules-banaye) me ye dikhaya gaya — `UsersModule`/`ReportsModule` root `AppModule` ke `imports` me hain.

**Q: Default provider scope kya hota hai?**
**Singleton** — chahe provider kitne bhi modules me import ho, poori application lifetime me uska sirf **ek** instance banta hai (jab tak explicitly `Scope.REQUEST` ya `Scope.TRANSIENT` na diya jaaye).

### TypeORM

**Q: `TypeOrmModule.forRoot()` aur `forFeature()` me kya farak hai?**
`forRoot()` sirf **ek baar**, root module me, DB connection banata hai aur global entity list define karta hai. `forFeature([Entity])` **per-module** hota hai — ye us module ke DI container me `Repository<Entity>` provider register karta hai, taaki wahi module `@InjectRepository(Entity)` use kar sake. `forRoot()` na ho to connection hi nahi banega; `forFeature()` na ho to us particular module me repository inject nahi hogi (chahe entity globally registered ho).

**Q: `repo.create()` aur `repo.save()` me kya farak hai?**
`create()` sirf ek **in-memory** entity instance banata hai — **synchronous** hai, koi DB call nahi hoti, `id` abhi `undefined` hota hai. `save()` **asynchronous** hai (`Promise` return karta hai), aur actual DB query chalata hai: agar entity ke paas `id` nahi hai to `INSERT`, agar hai to `UPDATE` — isliye `save()` create aur update dono handle kar sakta hai. `repo.create()` use karna best practice hai (`new Entity()` ke bajaye) kyunki isse entity ke lifecycle hooks (`@BeforeInsert()`, etc.) sahi se trigger hote hain.

**Q: `synchronize: true` production me kyun risky hai?**
Ye TypeORM ko entities dekh kar khud DB schema (tables/columns) create/alter/drop karne deta hai. Dev me convenient hai (schema hamesha entities se match karta hai), lekin production me agar koi column rename/remove ho jaaye to TypeORM us column ko drop kar sakta hai — **accidental data loss**. Production me iski jagah **migrations** (versioned, reviewable SQL scripts) use karni chahiye.

**Q: ORM (jaise TypeORM) use karne ka fayda/nuksaan kya hai?**
Fayda: raw SQL likhne ki zaroorat kam ho jaati hai, type-safety milti hai (TS classes = tables), database switch karna aasan hota hai (SQLite se Postgres). Nuksaan: complex/optimized queries ke liye ORM ka generated SQL kabhi inefficient ho sakta hai, aur ORM ka apna learning curve/abstraction overhead hota hai.

**Q: `@InjectRepository(Entity)` aur `@InjectDataSource()` me kya farak hai — kab kya use karoge?**
Dono alag abstraction level pe hain:
- **`@InjectRepository(Entity)`** ek **single entity ka Repository** deta hai (`Repository<User>`) jisme `find()`, `save()`, `create()`, `delete()` jaise high-level, entity-scoped methods hote hain. Isi project ka `UsersService` isse use karta hai kyunki sirf ek entity (`User`) pe simple CRUD ho raha hai.
- **`@InjectDataSource()`** poora **`DataSource`** (connection-level) object deta hai — isse `dataSource.getRepository(Entity)` (kisi bhi entity ka repository on-the-fly), raw SQL (`dataSource.query(...)`), aur sabse important **transactions** (`dataSource.transaction(async (manager) => {...})`) chala sakte ho.

**Rule of thumb**: `InjectRepository` = single-entity simple CRUD (jaise abhi `UsersService.create()`). `InjectDataSource` = jab **multiple entities ek saath, ek hi transaction me** update karni ho (e.g. signup pe `User` aur `Report` dono create ho, aur beech me error aaye to dono rollback ho jaayein), ya raw SQL/complex query chahiye ho — ek single Repository se cross-entity transaction possible nahi hai kyunki wo sirf ek entity tak limited hota hai.

```ts
// InjectDataSource se cross-entity transaction ka example
constructor(@InjectDataSource() private dataSource: DataSource) {}

async createUserWithReport(email: string, password: string) {
  return this.dataSource.transaction(async (manager) => {
    const user = await manager.save(User, { email, password });
    await manager.save(Report, { price: 0, userId: user.id });
    return user; // agar Report save fail ho, User save bhi automatically rollback ho jayega
  });
}
```

### Validation & DTOs

**Q: DTO (Data Transfer Object) kya hota hai aur kyun use karte hain?**
DTO ek plain class hai jo define karti hai ki ek request/response me data ka **shape** kya hona chahiye. Isse (1) TypeScript type-safety milti hai controller me, aur (2) `class-validator` decorators laga kar us shape ko **runtime pe bhi validate** kar sakte hain (TypeScript types sirf compile-time pe check hote hain, runtime pe koi bhi JSON aa sakta hai — DTO+ValidationPipe ye gap fill karte hain).

**Q: `ValidationPipe` ka `whitelist: true` kya karta hai, aur `forbidNonWhitelisted` se kaise alag hai?**
`whitelist: true` DTO me define na kiye extra fields ko **silently strip** kar deta hai. `forbidNonWhitelisted: true` (agar saath me lagaya jaaye) unhi extra fields ko strip karne ke bajaye **400 error throw** kar deta hai. Dono alag-alag trade-off dete hain — chup-chaap ignore karna vs explicitly reject karna.

**Q: Pipe kya hota hai NestJS me?**
Pipe ek class hai jo request handler (controller method) chalne se **pehle** input data ko transform ya validate karti hai. `ValidationPipe` inbuilt example hai — Nest ke request lifecycle me ye order hota hai: **Middleware → Guard → Interceptor (pre) → Pipe → Controller Handler → Interceptor (post) → Exception Filter (agar error aaya)**.

### JavaScript / TypeScript Fundamentals

**Q: Promise ke bina `await`/`return`/`.catch()` ke chhod dena kyun bura hai ("floating promise")?**
Agar us Promise ke andar error/rejection aaya (jaise DB insert fail hua), to wo error **silently swallow** ho jaata hai — na kahi log hota hai, na caller ko pata chalta hai. Fix: ya to `await` karo (result chahiye), ya `return` karo (upar propagate karna hai), ya explicitly `void` operator se ignore karo (jaan-bujh kar fire-and-forget), ya `.catch()` laga kar error handle karo.

**Q: Definite assignment assertion (`!`) TypeScript me kya karta hai, aur `?` se kaise alag hai?**
`!` (e.g. `id!: number`) compiler ko bolta hai "ye property zaroor assign hogi (runtime pe), compile-time check mat karo" — property ka type non-nullable rehta hai. `?` (e.g. `id?: number`) property ko **optional** banata hai — uska type automatically `number | undefined` ho jaata hai, aur usse access karne se pehle check karna padta hai. TypeORM entities me `!` isliye use hota hai kyunki ORM khud (constructor ke bahar) properties populate karta hai.

### Dependency Management

**Q: Agar kisi library ka type error/runtime error samajh na aaye to sabse pehle kya check karoge?**
**Installed version compatible hai ya nahi.** Isi project me [Step 3](#step-3-typeorm--sqlite-setup-kiya) me `typeorm@1.1.1` install ho gaya tha jabki `@nestjs/typeorm@12` ko `typeorm@0.3.x` chahiye tha — error TypeScript ka tha (`type: 'sqlite'` assignable nahi), lekin root cause `package.json` ka version mismatch tha, code me kuch galat nahi tha.

### Aage Explore Karne Layak Topics (is project me abhi cover nahi hue)

Interview me aksar in per bhi pucha jaata hai — abhi is project me implement nahi kiye, lekin concept jaanna zaroori hai:

- **Guards** — route access control (e.g. `AuthGuard` — logged-in user hi access kar sake).
- **Interceptors** — response transform karna, logging, caching (request ke pehle aur baad dono me chal sakte hain).
- **Exception Filters** — errors ko custom format me catch/handle karna (`@Catch()`).
- **Middleware** — Express-level, route handler se bhi pehle chalta hai (e.g. logging, cookie parsing).
- **Custom Decorators** (`@CurrentUser()` jaisa) — repetitive logic ko ek decorator me wrap karna.
- **Password Hashing** — abhi `password` plain text store ho raha hai, real app me `bcrypt`/`argon2` se hash hona chahiye — is project ka ek known gap hai jo aage fix hoga.
