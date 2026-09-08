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
  - [Step 7: Find, Update, Remove Methods Add Kiye](#step-7-find-update-remove-methods-add-kiye)
  - [Step 8: Entity Lifecycle Hooks Add Kiye](#step-8-entity-lifecycle-hooks-add-kiye)
  - [Step 9: Full CRUD REST Endpoints Banaye](#step-9-full-crud-rest-endpoints-banaye)
  - [Step 10: Email Contains Search (`Like()`)](#step-10-email-contains-search-like)
  - [Step 11: Response Serialization with Interceptor](#step-11-response-serialization-with-interceptor)
  - [Step 12: Reusable `Serialize()` Decorator Banaya](#step-12-reusable-serialize-decorator-banaya)
  - [Step 13: AuthService — Password Hashing](#step-13-authservice--password-hashing)
  - [Step 14: `bcrypt` se Password Hashing (Learning Demo)](#step-14-bcrypt-se-password-hashing-learning-demo)
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
    ├── interceptors/
    │   └── serialize.interceptor.ts     # `SerializeInterceptor` (reusable, DTO constructor-param leta hai) + `Serialize()` decorator factory — response ko target DTO shape me convert karta hai (password chhupane ke liye)
    ├── users/
    │   ├── users.controller.ts          # `/auth` prefix ke saare CRUD routes — signup (AuthService ko delegate), get by id, list/search, update, delete
    │   ├── users.service.ts             # Users se related PLAIN DB CRUD — create/findOne/find (contains search)/update/remove, sab TypeORM Repository se
    │   ├── auth.service.ts              # Signup workflow — duplicate-email check + scrypt password hashing, phir UsersService.create() ko delegate karta hai
    │   ├── bcrypt-auth.service.ts       # Learning demo — `bcrypt` library se hash/compare (koi controller isse abhi use nahi karta)
    │   ├── user.entity.ts               # `User` DB table define karta hai (id, email, password columns) + AfterInsert/AfterUpdate/AfterRemove lifecycle hooks
    │   ├── user.dto.ts                  # `CreateUserDto` (signup) + `UpdateUserDto` (partial update) + `UserDto` (safe response shape, password exclude) — sab request/response shapes
    │   ├── request.http                 # Manual testing ke liye sample requests (VS Code REST Client extension se run hote hain)
    │   └── users.module.ts              # UsersController + UsersService + AuthService ko group karta hai, TypeOrmModule.forFeature([User]) se User repository inject karne layak banata hai
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

### Step 7: Find, Update, Remove Methods Add Kiye

`UsersService` me baaki CRUD operations (**R**ead, **U**pdate, **D**elete) add kiye:

```ts
findOne(id: number) {
  return this.repo.findOneBy({ id });
}

find(email: string) {
  return this.repo.find({ where: { email } });
}

async update(id: number, attrs: Partial<User>) {
  const user = await this.findOne(id);
  if (!user) {
    throw new Error('user not found');
  }
  Object.assign(user, attrs);
  return this.repo.save(user);
}

async remove(id: number) {
  const user = await this.findOne(id);
  if (!user) {
    throw new Error('user not found');
  }
  return this.repo.remove(user);
}
```

- **`findOneBy({ id })` vs `find({ where: { email } })`** — `findOneBy`/`findOne` ek single record (ya `null`) return karta hai, jabki `find` hamesha ek **array** return karta hai (chahe 0, 1, ya multiple matches mile) — is liye `find(email)` conceptually "is email wale saare users" dhoondta hai, ek single user nahi.
- **`update()`** pehle DB se current entity fetch karta hai (`findOne`), `Object.assign()` se naye `attrs` merge karta hai, phir `save()` karta hai — `save()` yaha `INSERT` nahi `UPDATE` chalata hai kyunki `user.id` already set hota hai (`save()` ka "upsert-like" behavior [Step 6](#step-6-signup-endpoint--validation-setup) me discuss ho chuka hai).
- **`Partial<User>`** ek TypeScript utility type hai jo `User` ke saare properties ko **optional** bana deta hai — isse `update()` ko caller sirf wahi fields de sakta hai jo change karni hain (poora object dobara bhejne ki zaroorat nahi).

**`remove()` me `repo.remove(user)` use kiya, `repo.delete(id)` nahi — dono me farak kya hai?**

Ye do alag TypeORM methods hain jo dikhne me similar lagte hain but different tareeke se kaam karte hain:

| | `repo.remove(entity)` | `repo.delete(criteria)` |
| --- | --- | --- |
| Input kya chahiye | Poora **loaded entity object** (pehle `findOne()` se fetch karna padta hai) | Sirf `id` ya koi bhi where-condition — entity load karne ki zaroorat nahi |
| DB calls | 2 (pehle SELECT fetch, phir DELETE) | 1 (direct DELETE query) |
| Lifecycle hooks (`@BeforeRemove`, `@AfterRemove`) | **Trigger hote hain** | **Trigger nahi hote** (TypeORM ke paas entity instance hi nahi hota) |
| Return value | Deleted entity object (jiska `id` ab `undefined` set ho jaata hai) | `DeleteResult` — `{ affected: number }` |
| "User exist karta tha?" pata chalta hai kaise | `findOne()` ke `null` check se pehle hi pata chal jaata hai | `affected === 0` check karna padta hai baad me |

Is project me `remove()` isliye chuna gaya kyunki "user not found" case ko **explicitly, readable error ke saath** handle karna tha — us case me entity load karna to hoga hi, isliye `repo.remove()` natural fit tha. Agar sirf fast bulk-delete chahiye hota aur "not found" ki fikar na hoti, to `repo.delete(id)` zyada **efficient** choice hoti (ek hi DB round-trip me kaam ho jaata, entity fetch karne ki zaroorat nahi padti).

### Step 8: Entity Lifecycle Hooks Add Kiye

`User` entity me TypeORM ke **lifecycle hooks** (aka "entity listeners") add kiye — ye methods TypeORM khud call karta hai jab respective DB operation successfully complete ho jaaye:

```ts
// users/user.entity.ts
@AfterInsert()
logAfterInsert() {
  console.log('User Inserted with ID : ', this.id);
}

@AfterUpdate()
logAfterUpdate() {
  console.log('User updated successfully with ID : ', this.id);
}

@AfterRemove()
logAfterRemove() {
  console.log('User Removed with ID : ', this.id);
}
```

**Sabse important cheez jo yaha samajhni hai**: ye hooks sirf tabhi trigger hote hain jab operation **entity instance ke through** ho —

- `repo.save()` → `@AfterInsert()`/`@AfterUpdate()` trigger karta hai (kyunki ye ek loaded/created entity object pe kaam karta hai).
- `repo.remove()` → `@AfterRemove()` trigger karta hai (kyunki ismein bhi poora entity object pass hota hai — [Step 7](#step-7-find-update-remove-methods-add-kiye) me isi wajah se `remove()` use kiya gaya tha).
- `repo.delete(id)` / `repo.update(id, ...)` → **koi hook trigger nahi karte**, kyunki ye sirf ek query-level `criteria` (jaise `id`) leke seedha SQL chalate hain, TypeORM ke paas kabhi actual entity instance banta hi nahi.

Isse ye pattern real-world me use hota hai: audit logging, cache invalidation, ya side-effects (jaise signup ke baad welcome email bhejna) — lekin dhyan rakhna zaroori hai ki agar tumhari team `repo.delete()`/`repo.update()` jaisi query-level shortcuts use karti hai to ye hooks silently skip ho jaayenge, jo ek common production bug source hai.

### Step 9: Full CRUD REST Endpoints Banaye

`UsersController` me baaki saare CRUD endpoints wire kiye — ab `UsersService` ke saare methods (`findOne`, `find`, `update`, `remove`) HTTP routes se accessible hain:

```ts
// users/users.controller.ts
@Get('/:id')
async findUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(parseInt(id));
  if (!user) {
    throw new NotFoundException('user not found');
  }
  return user;
}

@Get()
findAllUsers(@Query('email') email: string) {
  return this.usersService.find(email);
}

@Put('/:id')
updateUserCompleteInfo(@Param('id') id: string, @Body() bodyData: UpdateUserDto) {
  return this.usersService.update(parseInt(id), bodyData);
}

@Delete('/:id')
removeUser(@Param('id') id: string) {
  return this.usersService.remove(parseInt(id));
}
```

Kuch decorators/concepts jo yaha naye hain:

- **`@Param('id')`** — URL path ka dynamic segment (`/auth/:id` me `id`) extract karta hai. Route param **hamesha string** aata hai (URL text hi hoti hai), isliye `UsersService.findOne(id: number)` ko dene se pehle `parseInt(id)` se number me convert kiya.
- **`@Query('email')`** — URL ke query string se value nikalta hai (e.g. `/auth?email=gmail` se `email = "gmail"` milta hai). `findAllUsers` isi se optional search term leta hai.
- **`@Put('/:id')`** — REST convention me `PUT` **poora resource replace** karne ke liye hota hai (saare fields expected), jabki `PATCH` **partial update** ke liye hota hai. Yaha `UpdateUserDto` ke saare fields `@IsOptional()` hain, isliye technically ye zyada `PATCH`-jaisa behavior hai `PUT` route pe — real-world me `PUT` chahiye to poore required fields lene chahiye, ya route ko `PATCH` bana dena chahiye (`request.http` me ek `PATCH` example bhi hai, lekin abhi controller me uska koi `@Patch()` handler nahi hai — ye ek known gap hai).
- **`NotFoundException`** — Nest ka built-in HTTP exception hai jo automatically `404` status code ke saath ek structured error response bhej deta hai (`{ statusCode: 404, message: '...', error: 'Not Found' }`). `UsersService` ke `update()`/`remove()` me bhi plain `Error` ki jagah ab yehi use ho raha hai, taaki "user not found" case sahi HTTP status (`404`) ke saath client ko mile — plain `Error` throw karne se Nest default `500 Internal Server Error` bhej deta, jo galat/misleading hota (client ki galti thi — galat `id`, server ki nahi).

### Step 10: Email Contains Search (`Like()`)

`UsersService.find()` pehle **exact match** karta tha — ab TypeORM ke `Like()` find-operator se **contains/partial match** kiya:

```ts
// Pehle — exact match
find(email: string) {
  return this.repo.find({ where: { email } });
}

// Ab — contains match
find(email: string) {
  if (email) return this.repo.find({ where: { email: Like(`%${email}%`) } });
  else return this.repo.find();
}
```

- **`Like()`** `where` clause ki condition ko equality (`=`) ke bajaye SQL `LIKE` pattern me convert kar deta hai.
- **`%` wildcard** — "yaha kuch bhi (ya kuch nahi) ho sakta hai": `%value` = end me match, `value%` = start me match, `%value%` = **kahi bhi** match (yahi "contains" search chahiye tha).
- **Case-sensitivity DB-dependent hai** — SQLite me `LIKE` by default ASCII case-insensitive hota hai, Postgres/MySQL me case-sensitive ho sakta hai (waha case-insensitive ke liye `ILIKE` ya `LOWER()` chahiye hota).
- Agar `email` query param bilkul diya hi na ho (`undefined`/empty), to `Like('%%')` jaisi cheez banane ke bajaye seedha `this.repo.find()` (bina filter) call kiya — ye edge-case handling hai taaki `GET /auth` bina query ke saare users list kar sake.

### Step 11: Response Serialization with Interceptor

Ek security gap fix kiya: ab tak koi bhi route jo `User` return karta tha (jaise `GET /auth/:id`), poora entity object bhej raha tha — jisme **`password` bhi shamil hota tha** (chahe plain text ho ya hashed, dono hi client ko expose nahi karne chahiye). Fix karne ke liye ek **response DTO** aur ek **custom Interceptor** banaya.

**`user.dto.ts`** — naya `UserDto` add kiya, jo sirf safe/public fields declare karta hai:

```ts
// users/user.dto.ts
export class UserDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;
}
```

`@Expose()` (`class-transformer` se) us field ko "whitelist" karta hai — jab bhi is class me `excludeExtraneousValues: true` ke saath conversion ho, sirf `@Expose()` wale fields hi result me aayenge. `password` field yaha hai hi nahi, isliye wo kabhi bhi is DTO ke through expose nahi ho sakta.

**`interceptors/serialize.interceptor.ts`** — ek custom Interceptor jo response ko is DTO shape me convert karta hai:

```ts
// interceptors/serialize.interceptor.ts
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(
      map((data: any) => {
        return plainToClass(UserDto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
```

- **Interceptor** NestJS ke request lifecycle ka hissa hai — Controller Handler chalne ke **pehle aur/ya baad**, dono me kaam kar sakta hai. Yaha `next.handle()` (jo controller ka actual response ek RxJS `Observable` ke roop me deta hai) pe `.pipe(map(...))` laga kar response ko **modify** kiya ja raha hai, controller chalne ke **baad**.
- **`plainToClass(UserDto, data, { excludeExtraneousValues: true })`** — controller se aaya plain `User` object (jisme `password` bhi hai) leke, sirf `UserDto` me `@Expose()` wale fields (`id`, `email`) rakh kar baaki sab (`password` included) **drop** kar deta hai.

**`users.controller.ts`** — interceptor ko route pe attach kiya:

```ts
@UseInterceptors(SerializeInterceptor)
@Get('/:id')
async findUser(@Param('id') id: string) {
  ...
}
```

**Known limitation (Step 11 tak)**: `@UseInterceptors()` yaha **method-level** (sirf `findUser` route pe) lagaya gaya tha — controller ke baaki routes (`create`, `findAllUsers`, `update`, `remove`) ka response abhi bhi raw entity hi tha (`password` sahit). Aur `SerializeInterceptor` hardcoded `UserDto` pe based tha, isliye kisi doosri entity (jaise `Report`) ke liye reuse nahi ho sakta tha.

### Step 12: Reusable `Serialize()` Decorator Banaya

`SerializeInterceptor` ko **generic/reusable** banane ke liye do changes kiye:

**1. Interceptor ka constructor ab target DTO class accept karta hai** (hardcoded `UserDto` ki jagah):

```ts
// interceptors/serialize.interceptor.ts
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(
      map((data: any) => {
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
```

`private dto: any` **constructor property shorthand** hai — `private` keyword laga kar TypeScript automatically ek `this.dto` class property bhi bana deta hai, alag se `this.dto = dto` likhna nahi padta. Ab `intercept()` me hardcoded `UserDto` ki jagah `this.dto` use hota hai, isliye jo bhi class constructor me pass ki jaaye wahi apply hogi.

**2. Ek "decorator factory" (`Serialize()`) banaya jo isse use karne me aasaan banata hai:**

```ts
export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
```

`Serialize()` ek **function hai jo khud ek decorator return karta hai** (isiliye "decorator factory" kehte hain — jaise `@Column()`, `@IsEmail()` bhi actually factories hi hain). Isse controller me likhna hota hai `@Serialize(UserDto)`, jo internally `@UseInterceptors(new SerializeInterceptor(UserDto))` jaisa hi hai — bas chhota aur zyada readable syntax milta hai.

```ts
// users.controller.ts
@Serialize(UserDto)
@Get('/:id')
async findUser(@Param('id') id: string) { ... }

@Serialize(UserDto)
@Get()
findAllUsers(@Query('email') email: string) { ... }
```

**Ek bonus fact jo yaha discover hua**: `find()` route (`findAllUsers`) `User[]` (array) return karta hai, phir bhi `@Serialize(UserDto)` sahi se kaam karta hai — `plainToClass()` khud detect kar leta hai ki input array hai, aur **har element ko individually** target DTO me convert kar deta hai. Manually `.map()` likhne ki zaroorat nahi padi.

**Baaki gaps abhi bhi hain** (jaan-bujh kar is project ka aage ka scope): `create`, `update`, `remove` routes pe abhi `@Serialize()` nahi lagaya, isliye unka response abhi bhi raw entity hi hai. Real app me poore controller pe class-level `@Serialize(UserDto)` laga dena zyada consistent hota.

### Step 13: AuthService — Password Hashing

Ab tak `password` **plain text** me DB me store ho raha tha (README ke shuru se hi ye known gap ke roop me note tha). Fix karne ke liye ek naya **`AuthService`** banaya, jo signup ka poora workflow (duplicate-email check + hashing) handle karta hai:

```ts
// users/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(email: string, password: string) {
    const user = await this.usersService.find(email);
    if (user.length) {
      throw new BadRequestException('Email id already exist');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const encryptedPassword = salt + '.' + hash.toString('hex');

    return this.usersService.create(email, encryptedPassword);
  }
}
```

Kuch important design decisions:

- **`AuthService` alag kyun banaya, `UsersService` me hi kyun nahi daala?** — `UsersService` ko jaan-bujh kar **plain DB CRUD** tak limited rakha gaya (Single Responsibility Principle) — usse sirf ye pata hai "DB me kaise save/find/update/delete karna hai". `AuthService` ek **higher-level workflow** hai jo business rules (duplicate check, hashing) apply karke phir `UsersService` (DB layer) ko use karta hai. Isse `UsersService` reusable rehta hai — koi bhi doosra feature (jo hashing na chahta ho) bhi seedha `UsersService` use kar sakta hai.
- **Duplicate email check** — `usersService.find(email)` (jo Step 10 me "contains" search bana diya tha) yaha exact email se call hota hai, aur agar result array khaali nahi (`user.length`), to `BadRequestException` (`400`) throw hota hai.
- **`promisify()`** — Node ka built-in `crypto.scrypt` callback-based API hai, `Promise` return nahi karta. `util.promisify()` isse ek Promise-returning function me convert kar deta hai, taaki `await scrypt(...)` likha ja sake.
- **Salt** — har user ke liye ek **random, unique** string generate hoti hai (`randomBytes(8)`). Isse same password wale do users ka bhi final hash **alag** ban jaata hai, jo "rainbow table" attacks (precomputed hash lookup) ko fail kar deta hai.
- **`scrypt`** — ek **"key derivation function"** (bcrypt/argon2 jaisa) hai jo jaan-bujh kar slow/memory-intensive design ki gayi hai, taaki brute-force attacks expensive ho jaayein. Fast hash functions (MD5, SHA-256) **password hashing ke liye unsafe** hain, kyunki wo bahut fast brute-force ho sakte hain.
- **`salt + '.' + hash`** — salt ko hash ke saath **plain text me hi** store kiya jaata hai (`encryptedPassword` string me), kyunki login ke time verify karne ke liye wahi salt dobara chahiye hoga. Salt secret nahi hota, sirf **unique** hona chahiye.

**`users.controller.ts`** — signup route ab `usersService.create()` ki jagah `authService.signup()` ko delegate karta hai; controller ko iske internal detail (hashing kaise ho rahi hai) se koi matlab nahi:

```ts
@Post('/signup')
@Serialize(UserDto)
create(@Body() bodyData: CreateUserDto) {
  return this.authService.signup(bodyData.email, bodyData.password);
}
```

### Step 14: `bcrypt` se Password Hashing (Learning Demo)

Step 13 me hand-rolled `crypto.scrypt` se hashing implement ki thi. Us cheez ko industry-standard `bcrypt` library se **compare** karke seekhne ke liye ek naya **`BcryptAuthService`** banaya — ye abhi koi route use nahi karta, sirf side-by-side dekhne ke liye hai ki dono approaches me kya farak hai.

Pehle package install kiya:

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

```ts
// users/bcrypt-auth.service.ts
@Injectable()
export class BcryptAuthService {
  private readonly saltRounds = 10;

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async comparePassword(plainPassword: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, storedHash);
  }
}
```

**`scrypt` (Step 13) vs `bcrypt` (Step 14) — practical farak:**

| | Hand-rolled `crypto.scrypt` (Step 13) | `bcrypt` library (Step 14) |
| --- | --- | --- |
| Salt generate karna | Manually (`randomBytes(8)`) | `bcrypt.hash()` khud internally karta hai |
| Salt store karna | Manually string-join karna padta (`salt + '.' + hash`) | Automatically ek single self-describing string me embedded (`$2b$10$...`) |
| Cost factor | Hardcoded/implicit (`scrypt(password, salt, 32)`) | Explicit `saltRounds` (10-12 industry-standard), khud output string me encoded |
| Verify karna | Manually salt nikaalo → dobara hash karo → string compare karo | `bcrypt.compare()` — ek call me sab handle |
| Timing-attack safety | Manual comparison likhoge to risk hai | `bcrypt.compare()` khud constant-time compare karta hai |

**Sabse important seekh**: `bcrypt` ka output format (`$2b$10$<22-char-salt><31-char-hash>`) **self-describing** hai — algorithm version (`2b`), cost factor (`10`), aur salt sab usi string me embedded hain. Isse agar kal cost factor 10 se 12 badal do, purane hashes (jo `$2b$10$...` se start hote hain) bhi bina kisi problem ke verify ho payenge, kyunki `bcrypt.compare()` stored hash se hi cost/salt padh leta hai — hume kahi alag se track nahi karna padta ki kaunsa hash kis config se bana tha.

---

## Concepts Glossary

Jitne bhi NestJS/TS/TypeORM concepts is project me cover kiye hain, unki short reference yahan hai — kisi bhi cheez ka matlab bhoolo to yahan dekh lo.

| Concept | Kahan use hua | Iska matlab | Commit |
| --- | --- | --- | --- |
| **Nest CLI** (`nest new`) | [Step 1](#step-1-project-generate-kiya) | Boilerplate project scaffold karne ka tool — module/controller/service ka default setup auto-generate karta hai | [`55145c9`](https://github.com/therishabh/nestjs-notes/commit/55145c9) |
| **Nest CLI Schematics** (`nest g module/controller/service`) | [Step 2](#step-2-users-aur-reports-modules-banaye) | Ek command se ek feature ke liye module + controller + service teeno files aur unka boilerplate wiring auto-generate karta hai | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **Feature Module** | [Step 2](#step-2-users-aur-reports-modules-banaye) | Ek specific domain/feature (yahan `users`, `reports`) ke controllers aur providers ko apne andar group karne wala module | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`@Controller('prefix')`** | [Step 2](#step-2-users-aur-reports-modules-banaye) | Class ko HTTP routes handle karne wala controller banata hai, aur uske saare routes ke aage `prefix` add karta hai (e.g. `/users`) | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **TypeORM** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Node.js/TypeScript ka ORM (Object-Relational Mapper) — DB tables ko JS/TS classes (entities) ke through manage karne deta hai, raw SQL likhne ki zaroorat kam ho jaati hai | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`@nestjs/typeorm`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | TypeORM ko NestJS ke DI system ke saath integrate karne wala official wrapper package | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`TypeOrmModule.forRoot()`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Poori application ke liye ek baar database connection configure/establish karta hai (root module me use hota hai) | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`type` (DB driver)** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Kaunsa database engine use ho raha hai batata hai (`sqlite`, `postgres`, `mysql`, etc.) — TypeORM isi ke basis pe sahi driver load karta hai | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`database`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | SQLite jaise file-based DB ke liye us file ka naam/path jaha actual data store hota hai | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`entities`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Un saari classes ki list jo DB tables represent karti hain — TypeORM inhi se schema samajhta hai | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`synchronize: true`** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | TypeORM ko entities dekh kar DB schema (tables/columns) automatically create/update karne deta hai — dev me fast iteration ke liye achha, production me **kabhi use nahi karna** (accidental data loss ho sakta hai) | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **Dependency Version Mismatch** | [Step 3](#step-3-typeorm--sqlite-setup-kiya) | Jab `package.json` me kisi library ka version doosri dependency (e.g. `@nestjs/typeorm`) ki required range se match nahi karta, aur usse type errors ya runtime errors aate hain — fix hamesha sahi version install karna hota hai, code nahi | [`7dff8a5`](https://github.com/therishabh/nestjs-notes/commit/7dff8a5) |
| **`@Entity()`** | [Step 4](#step-4-user-entity-banaya) | Class ko ek DB table ke roop me register karta hai — TypeORM isi class se schema samajhta hai | [`2f75e65`](https://github.com/therishabh/nestjs-notes/commit/2f75e65) |
| **`@PrimaryGeneratedColumn()`** | [Step 4](#step-4-user-entity-banaya) | Table ka primary key column banata hai, jiski value TypeORM khud auto-increment karke generate karta hai | [`2f75e65`](https://github.com/therishabh/nestjs-notes/commit/2f75e65) |
| **`@Column()`** | [Step 4](#step-4-user-entity-banaya) | Class property ko ek normal DB column banata hai | [`2f75e65`](https://github.com/therishabh/nestjs-notes/commit/2f75e65) |
| **Definite Assignment Assertion (`!`)** | [Step 4](#step-4-user-entity-banaya) | Property naam ke aage laga `!`, TypeScript ko batata hai ki value humne khud set nahi ki (yahan TypeORM runtime pe karega), isliye "not initialized" compile error na de | [`2f75e65`](https://github.com/therishabh/nestjs-notes/commit/2f75e65) |
| **`TypeOrmModule.forRoot()` vs `forFeature()`** | [Step 4](#step-4-user-entity-banaya) | `forRoot()` poori app ke liye DB connection + global entity list define karta hai; `forFeature([Entity])` sirf us module ko us entity ka repository (DB query karne wala object) inject karne layak banata hai | [`2f75e65`](https://github.com/therishabh/nestjs-notes/commit/2f75e65) |
| **DTO (`CreateUserDto`)** | [Step 6](#step-6-signup-endpoint--validation-setup) | Ek plain class jo request body ka expected shape define karti hai, aur `class-validator` decorators ke through validation rules bhi carry karti hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`class-validator` decorators (`@IsEmail`, `@IsString`)** | [Step 6](#step-6-signup-endpoint--validation-setup) | DTO ki har property pe lagte hain, aur batate hain ki us field ki value kis format/type me honi chahiye | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`ValidationPipe`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Incoming request body ko DTO ke validation rules ke against automatically check karta hai — fail hone par controller tak pahunche bina hi `400` return kar deta hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`useGlobalPipes()`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Ek pipe ko poori application ke har route pe apply karta hai, har controller me alag se lagane ki zaroorat nahi rehti | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`whitelist: true`** | [Step 6](#step-6-signup-endpoint--validation-setup) | DTO me define na kiye gaye extra request body fields ko silently strip/remove kar deta hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`@InjectRepository(Entity)`** | [Step 6](#step-6-signup-endpoint--validation-setup) | Constructor parameter pe lagta hai, Nest ko batata hai ki us entity ka `Repository` yaha inject karo (`forFeature()` se available hua provider) | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`repo.create()` vs `repo.save()`** | [Step 6](#step-6-signup-endpoint--validation-setup) | `create()` sirf ek in-memory entity instance banata hai (DB me kuch nahi hota); `save()` asal me DB me insert/update query chalata hai aur Promise return karta hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **Floating Promise** | [Step 6](#step-6-signup-endpoint--validation-setup) | Jab ek async function ka returned Promise na `await` kiya jaye, na `return` kiya jaye, na `.catch()` laga ho — ESLint isse warning deta hai kyunki reject hone par error silently gum ho sakta hai; fix `return`, `await`, ya jaan-bujh kar `void` operator lagana hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **JSON.parse strictness** | [Step 6](#step-6-signup-endpoint--validation-setup) | Raw HTTP body ko JSON banane ke liye keys **double-quotes** me hona zaroori hai (JS object literal syntax jaise unquoted keys yaha invalid hain) — warna `ValidationPipe` tak pahunchne se pehle hi body-parser 400 de deta hai | [`f506f59`](https://github.com/therishabh/nestjs-notes/commit/f506f59) |
| **`findOneBy()`/`findOne` vs `find()`** | [Step 7](#step-7-find-update-remove-methods-add-kiye) | `findOneBy`/`findOne` ek single record (ya `null`) return karta hai; `find` hamesha ek **array** return karta hai, chahe 0, 1, ya multiple matches mile | [`90fa166`](https://github.com/therishabh/nestjs-notes/commit/90fa166) |
| **`Partial<Entity>` (TS utility type)** | [Step 7](#step-7-find-update-remove-methods-add-kiye) | Kisi bhi type ke saare properties ko **optional** bana deta hai — `update()` jaise methods me use hota hai jaha caller sirf wahi fields de jo change karni hain | [`90fa166`](https://github.com/therishabh/nestjs-notes/commit/90fa166) |
| **`Object.assign(target, source)`** | [Step 7](#step-7-find-update-remove-methods-add-kiye) | `source` object ki properties `target` object pe copy/overwrite kar deta hai (aur `target` ko hi return karta hai) — partial updates apply karne ka common JS pattern | [`90fa166`](https://github.com/therishabh/nestjs-notes/commit/90fa166) |
| **`repo.remove(entity)` vs `repo.delete(criteria)`** | [Step 7](#step-7-find-update-remove-methods-add-kiye) | `remove()` ko poora loaded entity chahiye, lifecycle hooks trigger karta hai, 2 DB calls lagte hain (SELECT + DELETE); `delete()` sirf id/criteria se seedha DELETE chalata hai (1 DB call), hooks trigger nahi karta, `DeleteResult` return karta hai entity ke bajaye | [`90fa166`](https://github.com/therishabh/nestjs-notes/commit/90fa166) |
| **Entity Lifecycle Hooks (`@AfterInsert`, `@AfterUpdate`, `@AfterRemove`)** | [Step 8](#step-8-entity-lifecycle-hooks-add-kiye) | TypeORM khud call karta hai jab respective DB operation entity instance ke through complete ho — `save()`/`remove()` inhe trigger karte hain, `delete()`/`update(id, ...)` jaisi query-level shortcuts nahi karti | [`90fa166`](https://github.com/therishabh/nestjs-notes/commit/90fa166) |
| **`@Param('name')`** | [Step 9](#step-9-full-crud-rest-endpoints-banaye) | URL path ke dynamic segment (e.g. `/auth/:id`) ki value extract karta hai — value hamesha **string** hoti hai, number chahiye ho to manually convert karna padta hai | [`09a8d88`](https://github.com/therishabh/nestjs-notes/commit/09a8d88) |
| **`@Query('name')`** | [Step 9](#step-9-full-crud-rest-endpoints-banaye) | URL ke query string se value nikalta hai (e.g. `?email=x` se `x`) | [`09a8d88`](https://github.com/therishabh/nestjs-notes/commit/09a8d88) |
| **`PUT` vs `PATCH`** | [Step 9](#step-9-full-crud-rest-endpoints-banaye) | REST convention: `PUT` poora resource replace karta hai (saare fields expected), `PATCH` sirf diye gaye fields partially update karta hai | [`09a8d88`](https://github.com/therishabh/nestjs-notes/commit/09a8d88) |
| **`NotFoundException`** | [Step 9](#step-9-full-crud-rest-endpoints-banaye) | Nest ka built-in exception class jo throw hote hi automatically `404` status code ke saath structured error response bhej deta hai — plain `Error` throw karne se Nest default `500` bhej deta, jo galat status hota | [`09a8d88`](https://github.com/therishabh/nestjs-notes/commit/09a8d88) |
| **`Like()` (TypeORM find operator)** | [Step 10](#step-10-email-contains-search-like) | `where` clause ki condition ko equality ke bajaye SQL `LIKE` pattern me convert karta hai — `%value%` se substring/"contains" search milta hai | [`09a8d88`](https://github.com/therishabh/nestjs-notes/commit/09a8d88) |
| **Interceptor** | [Step 11](#step-11-response-serialization-with-interceptor) | Controller handler ke pehle/baad chalne wali class jo request/response ko modify kar sakti hai — request lifecycle: Middleware → Guard → Interceptor(pre) → Pipe → Handler → Interceptor(post) → Exception Filter | [`e07edb1`](https://github.com/therishabh/nestjs-notes/commit/e07edb1) |
| **`@UseInterceptors()`** | [Step 11](#step-11-response-serialization-with-interceptor) | Ek interceptor ko method-level (ek route), class-level (poora controller), ya globally (`app.useGlobalInterceptors()`) attach karta hai | [`e07edb1`](https://github.com/therishabh/nestjs-notes/commit/e07edb1) |
| **`class-transformer` (`@Expose()`, `plainToClass()`)** | [Step 11](#step-11-response-serialization-with-interceptor) | `@Expose()` ek field ko "whitelist" karta hai; `plainToClass(Dto, obj, { excludeExtraneousValues: true })` sirf `@Expose()` wale fields rakh kar plain object ko us DTO shape me convert kar deta hai — response serialization/sensitive-field-hiding ke liye use hota hai | [`e07edb1`](https://github.com/therishabh/nestjs-notes/commit/e07edb1) |
| **Decorator Factory** | [Step 12](#step-12-reusable-serialize-decorator-banaya) | Ek function jo khud ek decorator return karta hai (e.g. `Serialize(dto)` → `UseInterceptors(new SerializeInterceptor(dto))`) — isse decorator ko parameter (config) diya ja sakta hai, `@Column()`/`@IsEmail()` jaise built-in decorators bhi isi pattern se bane hote hain | [`c6812c9`](https://github.com/therishabh/nestjs-notes/commit/c6812c9) |
| **Constructor Property Shorthand (`private dto: any`)** | [Step 12](#step-12-reusable-serialize-decorator-banaya) | Constructor parameter pe `private`/`public`/`readonly` laga dene se TypeScript automatically ek class property bhi bana deta hai aur assign kar deta hai — `this.dto = dto;` alag se likhne ki zaroorat nahi padti | [`c6812c9`](https://github.com/therishabh/nestjs-notes/commit/c6812c9) |
| **`AuthService` (separate service for signup workflow)** | [Step 13](#step-13-authservice--password-hashing) | Business workflow (duplicate-check + hashing) ko `UsersService` (plain DB CRUD) se alag rakha — Single Responsibility Principle | [`057e8ec`](https://github.com/therishabh/nestjs-notes/commit/057e8ec) |
| **`promisify()`** | [Step 13](#step-13-authservice--password-hashing) | Node ke `util` module ka function jo ek callback-style function ko Promise-returning function me convert kar deta hai | [`057e8ec`](https://github.com/therishabh/nestjs-notes/commit/057e8ec) |
| **Salt (password hashing)** | [Step 13](#step-13-authservice--password-hashing) | Har user ke liye generate hone wala ek random unique string, jo hash se pehle password ke saath mix hota hai — same password wale users ka bhi final hash alag banata hai, rainbow-table attacks se bachata hai | [`057e8ec`](https://github.com/therishabh/nestjs-notes/commit/057e8ec) |
| **`scrypt` (key derivation function)** | [Step 13](#step-13-authservice--password-hashing) | Jaan-bujh kar slow/memory-intensive banaya gaya hashing algorithm (bcrypt/argon2 jaisa) — brute-force attacks ko expensive banata hai; fast hash functions (MD5/SHA-256) password hashing ke liye unsafe hote hain | [`057e8ec`](https://github.com/therishabh/nestjs-notes/commit/057e8ec) |
| **`BadRequestException`** | [Step 13](#step-13-authservice--password-hashing) | Nest ka built-in exception jo `400` status ke saath structured error deta hai — client-side galti (yaha: duplicate email) ke liye use hota hai | [`057e8ec`](https://github.com/therishabh/nestjs-notes/commit/057e8ec) |
| **`bcrypt.hash(pw, saltRounds)`** | [Step 14](#step-14-bcrypt-se-password-hashing-learning-demo) | Salt generate + hashing dono ek call me karta hai, aur ek self-describing string return karta hai (`$2b$10$...`) jisme algorithm version, cost, salt, hash sab embedded hote hain | [`3ae85d5`](https://github.com/therishabh/nestjs-notes/commit/3ae85d5) |
| **`bcrypt.compare(pw, hash)`** | [Step 14](#step-14-bcrypt-se-password-hashing-learning-demo) | Stored hash se salt/cost khud nikaal kar plain password ko dobara hash karta hai aur constant-time (timing-attack-safe) compare karta hai | [`3ae85d5`](https://github.com/therishabh/nestjs-notes/commit/3ae85d5) |
| **Salt Rounds / Cost Factor** | [Step 14](#step-14-bcrypt-se-password-hashing-learning-demo) | Batata hai kitne hashing rounds chalenge (`2^saltRounds`) — jitna zyada utna slow/secure; 10-12 industry-standard hai | [`3ae85d5`](https://github.com/therishabh/nestjs-notes/commit/3ae85d5) |

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

**Q: `repo.remove(entity)` aur `repo.delete(criteria)` me kya farak hai — kab kya use karoge?**
Dono record delete karte hain but different tareeke se:
- **`remove(entity)`** — ek **poora loaded entity object** leta hai (pehle DB se fetch karna padta hai, e.g. `findOne()` se), 2 DB calls lagte hain (SELECT + DELETE), aur TypeORM lifecycle hooks (`@BeforeRemove()`, `@AfterRemove()`) trigger karta hai. Delete ke baad passed object ka `id` `undefined` ho jaata hai.
- **`delete(criteria)`** — sirf `id` ya kisi bhi where-condition se seedha delete karta hai, entity load karne ki zaroorat nahi, sirf **1 DB call**, isliye zyada efficient. Lifecycle hooks trigger nahi karta (kyunki entity instance exist hi nahi karta). Return value `DeleteResult` (`{ affected: number }`) hota hai, poora entity nahi.

**Kab kya:** agar delete se pehle "record exist karta hai ya nahi" explicitly check karna hai (readable error dena hai), ya lifecycle hooks chalne zaroori hain, to `remove()` use karo — entity to load ho hi rahi hai us case me. Agar sirf fast bulk-delete karna hai aur existence-check ki fikar nahi (ya `affected` count se hi kaam chal jaata hai), to `delete()` zyada efficient hai kyunki ek extra SELECT query bachti hai. Isi project ke `UsersService.remove()` me `remove()` isliye use hua kyunki "user not found" case explicitly handle karna tha.

### Validation & DTOs

**Q: DTO (Data Transfer Object) kya hota hai aur kyun use karte hain?**
DTO ek plain class hai jo define karti hai ki ek request/response me data ka **shape** kya hona chahiye. Isse (1) TypeScript type-safety milti hai controller me, aur (2) `class-validator` decorators laga kar us shape ko **runtime pe bhi validate** kar sakte hain (TypeScript types sirf compile-time pe check hote hain, runtime pe koi bhi JSON aa sakta hai — DTO+ValidationPipe ye gap fill karte hain).

**Q: `ValidationPipe` ka `whitelist: true` kya karta hai, aur `forbidNonWhitelisted` se kaise alag hai?**
`whitelist: true` DTO me define na kiye extra fields ko **silently strip** kar deta hai. `forbidNonWhitelisted: true` (agar saath me lagaya jaaye) unhi extra fields ko strip karne ke bajaye **400 error throw** kar deta hai. Dono alag-alag trade-off dete hain — chup-chaap ignore karna vs explicitly reject karna.

**Q: Pipe kya hota hai NestJS me?**
Pipe ek class hai jo request handler (controller method) chalne se **pehle** input data ko transform ya validate karti hai. `ValidationPipe` inbuilt example hai — Nest ke request lifecycle me ye order hota hai: **Middleware → Guard → Interceptor (pre) → Pipe → Controller Handler → Interceptor (post) → Exception Filter (agar error aaya)**.

### Interceptors & Serialization

**Q: Interceptor kya hota hai, aur Pipe se kaise alag hai?**
Pipe sirf **request ke aane pe, handler chalne se pehle** kaam karta hai (transform/validate input). Interceptor iske ulat/extra hai — ye **response ke jaane se pehle** (aur chahe to handler chalne se pehle bhi) kaam kar sakta hai, kyunki isse `next.handle()` ka poora control milta hai — controller ka return value ek `Observable` ke roop me milta hai jise `.pipe(map(...))` se modify kiya ja sakta hai.

**Q: Password jaisi sensitive field ko API response se kaise hide karoge?**
Sabse common tareeka: ek **response DTO** banao jisme sirf safe fields ho (`@Expose()` decorator ke saath), aur ek **Interceptor** lagao jo controller ke return value ko `class-transformer` ke `plainToClass(Dto, data, { excludeExtraneousValues: true })` se us DTO shape me convert kar de — koi bhi field jo DTO me `@Expose()` nahi hai (jaise `password`), automatically drop ho jaati hai. (Alternative approach: entity column pe `@Column({ select: false })` lagana, jisse wo column query se hi nahi aata — lekin fir explicitly login jaisi jagah usse `.addSelect()` karna padta.)

**Q: `@UseInterceptors()` method-level, class-level, aur global — inme farak kya hai?**
- **Method-level** (`@UseInterceptors()` ek specific route handler pe) — sirf us ek route ka response affect hota hai.
- **Class-level** (`@UseInterceptors()` poore `@Controller()` class pe) — us controller ke saare routes affect hote hain.
- **Global** (`app.useGlobalInterceptors()` `main.ts` me, jaise `ValidationPipe` global lagaya tha) — poori application ke saare routes affect hote hain.

Is project me `GET /auth/:id` aur `GET /auth` (list/search) pe **method-level** use kiya hai — `create`, `update`, `remove` abhi bhi raw entity return karte hain (jaan-bujh kar chhoda gaya gap, taaki class-level/global approach interview me discuss ho sake).

**Q: Ek hardcoded interceptor (sirf ek fixed DTO ke liye) ko reusable kaise banaoge?**
Do cheezein karni padti hain: (1) Interceptor ke **constructor me DTO class ko parameter banao** (`constructor(private dto: any) {}`), aur hardcoded class reference ki jagah `this.dto` use karo `plainToClass()` me. (2) Ek **decorator factory** function banao (e.g. `function Serialize(dto: any) { return UseInterceptors(new SerializeInterceptor(dto)); }`) jo caller ko chhota syntax de (`@Serialize(UserDto)` vs `@UseInterceptors(new SerializeInterceptor(UserDto))`). Isi project me [Step 12](#step-12-reusable-serialize-decorator-banaya) me yehi refactor kiya gaya — pehle interceptor hardcoded `UserDto` pe tha, ab kisi bhi DTO ke saath reuse ho sakta hai.

**Q: Agar `intercept()` me `this.dto` use karne ke bajaye galti se hardcoded class reference reh jaaye, to kya problem hogi?**
Constructor to DTO accept karega aur type-check bhi pass ho jayega (kyunki `dto` ka type abhi `any` hai), lekin **runtime pe koi effect nahi hoga** — `Serialize(ReportDto)` likhne par bhi hamesha `UserDto` hi apply hota rahega. Ye TypeScript ke `any` type ka ek classic risk hai: `any` compiler ko silent kar deta hai, isliye ye class ki bug compile-time pe pakdi nahi jaati, sirf runtime behavior galat hone se pata chalti hai — isi project me ye exact bug mila tha aur fix kiya gaya.

### JavaScript / TypeScript Fundamentals

**Q: Promise ke bina `await`/`return`/`.catch()` ke chhod dena kyun bura hai ("floating promise")?**
Agar us Promise ke andar error/rejection aaya (jaise DB insert fail hua), to wo error **silently swallow** ho jaata hai — na kahi log hota hai, na caller ko pata chalta hai. Fix: ya to `await` karo (result chahiye), ya `return` karo (upar propagate karna hai), ya explicitly `void` operator se ignore karo (jaan-bujh kar fire-and-forget), ya `.catch()` laga kar error handle karo.

**Q: Definite assignment assertion (`!`) TypeScript me kya karta hai, aur `?` se kaise alag hai?**
`!` (e.g. `id!: number`) compiler ko bolta hai "ye property zaroor assign hogi (runtime pe), compile-time check mat karo" — property ka type non-nullable rehta hai. `?` (e.g. `id?: number`) property ko **optional** banata hai — uska type automatically `number | undefined` ho jaata hai, aur usse access karne se pehle check karna padta hai. TypeORM entities me `!` isliye use hota hai kyunki ORM khud (constructor ke bahar) properties populate karta hai.

### Authentication & Security

**Q: Password ko hash kyun karte hain, sirf encrypt kyun nahi?**
Encryption **reversible** hota hai (sahi key se decrypt karke original wapas mil jaata hai) — agar attacker key bhi chura le to sab passwords wapas mil jaate. Hashing **one-way** hai (practically irreversible) — hash se original password wapas nikalna infeasible hota hai. Login ke time password verify karne ke liye original chahiye hi nahi hota — bas naya input hash karke stored hash se compare kar lete hain.

**Q: Salt kya hota hai, aur iske bina hashing kyun risky hai?**
Salt ek random, per-user unique string hai jo hash banane se pehle password ke saath mix ki jaati hai. Agar salt na ho, to do users jinka password same hai (e.g. "123456"), unka stored hash bhi same hoga — attacker ek baar "123456" ka hash pre-compute kar ke (**rainbow table**) usse match karne wale saare users ka password ek saath crack kar sakta hai. Salt se har user ka final hash unique ban jaata hai, chahe unka plain password same ho.

**Q: `scrypt`/`bcrypt` jaise algorithms MD5/SHA-256 se password hashing ke liye better kyun hain?**
MD5/SHA-256 **fast** hone ke liye design kiye gaye hain (checksums/integrity ke liye) — yehi cheez password hashing ke liye **bura** hai, kyunki attacker bhi utni hi fast speed se brute-force try kar sakta hai (modern GPU se billions/second). `scrypt`/`bcrypt`/`argon2` jaan-bujh kar **slow aur memory-intensive** design kiye gaye hain, taaki ek single guess try karna bhi expensive ho — isse brute-force attack practically infeasible ho jaata hai.

**Q: Hand-rolled `crypto.scrypt` (Step 13) ke bajaye `bcrypt`/`argon2` library (Step 14) use karna better kyun hai?**
Concept level pe dono sahi hain (dono slow hashing + salt use karte hain), lekin library use karna practically safer hai kyunki: (1) salt generation, embedding, aur verification ka **error-prone manual code** khud nahi likhna padta (ek chhoti si galti — salt length, delimiter mismatch — security hole ban sakti hai), (2) output format **self-describing** hota hai (`bcrypt` ka `$2b$10$...` string me algorithm version + cost + salt sab embedded hain), isliye cost factor badalne pe purane hashes bhi bina extra migration-tracking ke verify hote rehte hain, aur (3) library **battle-tested** hoti hai (millions of production apps me use ho chuki, edge cases already handle kiye gaye). Industry me `bcrypt` sabse common hai, aur `argon2` (Password Hashing Competition 2015 winner) abhi OWASP ki top recommendation hai.

**Q: `bcrypt.compare()` internally kaam kaise karta hai, jab humne ise salt separately nahi diya?**
`bcrypt.hash()` ka output string (`$2b$10$<salt><hash>`) me salt already embedded hota hai. `bcrypt.compare(plainPassword, storedHash)` call karte hi bcrypt khud us `storedHash` string ko parse karke salt aur cost factor nikal leta hai, `plainPassword` ko usi salt+cost se dobara hash karta hai, aur phir dono hashes ko **constant-time** compare karta hai (taaki timing-attack se pata na chale ki comparison kitni jaldi fail hui — jo indirectly password ke sahi characters reveal kar sakta hai).

### Dependency Management

**Q: Agar kisi library ka type error/runtime error samajh na aaye to sabse pehle kya check karoge?**
**Installed version compatible hai ya nahi.** Isi project me [Step 3](#step-3-typeorm--sqlite-setup-kiya) me `typeorm@1.1.1` install ho gaya tha jabki `@nestjs/typeorm@12` ko `typeorm@0.3.x` chahiye tha — error TypeScript ka tha (`type: 'sqlite'` assignable nahi), lekin root cause `package.json` ka version mismatch tha, code me kuch galat nahi tha.

### Aage Explore Karne Layak Topics (is project me abhi cover nahi hue)

Interview me aksar in per bhi pucha jaata hai — abhi is project me implement nahi kiye, lekin concept jaanna zaroori hai:

- **Guards** — route access control (e.g. `AuthGuard` — logged-in user hi access kar sake).
- **Exception Filters** — errors ko custom format me catch/handle karna (`@Catch()`).
- **Middleware** — Express-level, route handler se bhi pehle chalta hai (e.g. logging, cookie parsing).
- **Custom Decorators** (`@CurrentUser()` jaisa) — repetitive logic ko ek decorator me wrap karna.
- **Password Hashing** — abhi `password` plain text store ho raha hai, real app me `bcrypt`/`argon2` se hash hona chahiye — is project ka ek known gap hai jo aage fix hoga.
