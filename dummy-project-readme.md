# drpt-bo-backend

Ye **Dreamport platform ka Back-Office API** hai — matlab admin/HR/staff jo kaam karte hain (jaise candidates ka profile manage karna, contracts, payments, attendance, etc.) uska poora backend yahi handle karta hai.

Agar aap NestJS me naye hain, ye README aapko step-by-step samjhayega ki is project me **kya-kya use hua hai** aur **kaise kaam karta hai**.

---

## 1. Ye project bana kis mein hai? (Tech Stack)

| Technology | Kya kaam karta hai | Simple explanation |
|---|---|---|
| **NestJS** | Backend framework | Ye poore backend ka structure/skeleton hai. Jaise React frontend ke liye hota hai, waise NestJS backend ke liye — controllers, services, modules sab isi ke concepts hain. |
| **Fastify** | HTTP server | Express jaisa hi ek server hai jo requests handle karta hai, bas fast hota hai. (Isme thoda Express bhi mix kiya gaya hai Sentry aur file-upload ke liye) |
| **TypeScript** | Programming language | JavaScript + Types. Isse code likhte waqt hi galtiyaan pakad me aa jaati hain. |
| **Prisma** | ORM (Database tool) | Database (MySQL) se baat karne ka tarika. Aapko raw SQL likhne ki zarurat nahi, Prisma khud query bana deta hai. |
| **MySQL** | Database | Jahan saara data (profiles, contracts, users, etc.) store hota hai. |
| **Redis + Bull** | Caching & Background Jobs | Redis ek fast in-memory store hai (caching ke liye). Bull uske upar bana hua queue system hai jo background me time-lene-wale kaam (jaise email bhejna, cron jobs) karta hai bina user ko wait karaye. |
| **Elasticsearch** | Search engine | Jab bahut saare profiles/candidates ko fast search/filter karna ho (jaise Google search jaisa), tab Elasticsearch use hota hai. |
| **Sentry** | Error tracking | Jab production me koi bada error (crash) aata hai, Sentry usse automatically capture karke report bhej deta hai, taaki developers ko pata chale. |
| **Unleash** | Feature Flags | Naye features ko on/off karne ka tarika bina naya code deploy kiye. Jaise "is feature ko sirf kuch users ke liye enable karo" wagera. |
| **Swagger** | API Documentation | Saare API endpoints ki auto-generated documentation, jisse browser me dekh sakte ho ki kaunse APIs available hain (sirf dev/stage environment me chalta hai). |
| **JWT + Passport** | Authentication | Login/auth handle karne ka tarika — token based login system. |
| **MinIO** | File storage | Images/documents/files ko store karne ke liye (S3 jaisa cloud storage, but self-hosted bhi ho sakta hai). |
| **Jest** | Testing | Code ke unit tests likhne aur chalane ke liye. |
| **ESLint + Prettier** | Code quality | Code ko consistent aur clean format me rakhne ke liye (auto-formatting + linting rules). |
| **Husky** | Git hooks | Commit karne se pehle automatically lint/format check chala deta hai. |

---

## 2. Project ka structure (Folder Layout)

NestJS me har feature apne "module" me organize hota hai. Is project me `src/` folder ke andar har feature ka apna folder hai, jaise:

```
src/
 ├── profile/        → Candidate/employee profile se related sab kuch
 ├── contract/        → Contracts (signing flow, status, etc.)
 ├── contractor/       → Contractor se related logic
 ├── attendance/       → Attendance management
 ├── payoneer/         → Payoneer payment integration
 ├── papaya/           → Papaya payment integration
 ├── auth/             → Login/authentication
 ├── es/               → Elasticsearch se related code
 ├── cron/             → Background scheduled jobs (Bull queue)
 ├── prisma/           → Database schema aur connection
 ├── common/           → Sab modules me use hone wala shared/common code
 ├── constants.ts      → Saare constants, enums, status codes ek jagah
 └── main.ts           → App yahin se start (boot) hota hai
```

Har feature-folder (module) ke andar generally ye files hoti hain:

- **`xyz.module.ts`** → Ye module ko NestJS ke saath "wire"/connect karta hai (batata hai kya-kya is module ka part hai).
- **`xyz.controller.ts`** → Yahan API endpoints define hote hain (jaise `GET /profile`, `POST /profile`). Ye sirf request lekar service ko forward karta hai, khud koi heavy logic nahi karta.
- **`xyz.service.ts`** → Yahan asli **business logic** hoti hai — jo bhi kaam actually karna hai wo yahin likha jata hai.
- **`xyz.dto.ts`** → DTO = Data Transfer Object. Ye define karta hai ki request/response me data kaisa dikhna chahiye (validation ke saath).
- **`xyz.consumer.ts`** → Agar module me background jobs (queue) hain, to unko process karne wala code.
- **`xyz.prisma`** → Is feature ke database tables/models ka schema.
- **`interfaces/`** → TypeScript interfaces (types define karne ke liye).

---

## 3. App kaise start/boot hota hai?

1. `src/main.ts` — Yahan se app start hota hai. Fastify server banta hai, Sentry initialize hota hai, Unleash feature flags load hote hain.
2. `src/app.module.ts` — Ye root module hai jo baaki saare modules ko import karke jodta hai.
3. Sab API routes ke aage `/api` prefix lagta hai (except `/metrics`, jo Prometheus monitoring ke liye hai).

---

## 4. Kuch important concepts (jo baar-baar dikhenge)

### Modules, Controllers, Services (NestJS ka core idea)
Simple flow samjho:
```
Request aati hai → Controller usse pakadta hai → Controller Service ko call karta hai → Service business logic karke result deta hai → Controller response bhej deta hai
```

### Prisma (Database)
- Har module apna `.prisma` file rakhta hai (jaise `profile.prisma`).
- Command `npm run generate:models` chalane par sab `.prisma` files ek `prisma/schema.prisma` file me combine ho jaati hain, phir Prisma Client generate hota hai.
- **Important:** `prisma/schema.prisma` ko kabhi directly edit nahi karna — hamesha uski fragment file (`<feature>.prisma`) edit karo.

### Logging
Errors/info log karne ke liye `LoggerService` use hota hai:
- `logIt()` → normal info log
- `logErr()` → chhoti-mooti (non-500) errors
- `logError()` → badi (500-level) errors, jo Sentry me bhi chali jaati hain production me

### Authentication & Roles
- `@UseGuards(JwtAuthGuard)` → check karta hai user login hai ya nahi (valid JWT token hai ya nahi).
- `@RoleAuth(['role'])` → check karta hai us role ko ye action karne ki permission hai ya nahi.

### Background Jobs (Bull Queue)
Kuch kaam turant nahi, background me hone chahiye (jaise scheduled reminders, EMC sync, wagera) — unke liye Bull queue use hota hai. Ye queues `src/cron/` module me manage hote hain.

### Feature Flags (Unleash)
Naye feature ko dheere-dheere rollout karna ho (sabko ek saath nahi dena) to `FeatureFlagService.isEnabled('flag-name')` use karke check karte hain flag ON hai ya OFF.

### Redis Caching
`RedisCacheService` se data cache kiya jata hai taaki baar-baar database query na maarni pade — performance better rehta hai.

### Elasticsearch (Search)
Profile/candidate search fast karne ke liye Elasticsearch ka `drpt` naam ka index use hota hai. `EsService` isko manage karta hai.

---

## 5. Setup kaise karein (Local Development)

```bash
npm install                    # saari dependencies install karo
cp .env.sample .env            # environment variables ki file banao
docker-compose up              # Database, Redis aur baaki services start karo (Docker se)
npm run start:dev              # Development server chalu karo (code change hote hi auto-reload hoga)
```

App start hone ke baad Swagger documentation (`/api` ke docs) dev/stage environment me dekh sakte ho.

---

## 6. Useful Commands

```bash
npm run build              # Production ke liye build banata hai
npm test                   # Saare unit tests chalata hai
npm run test:cov           # Test coverage report ke saath
npm run test:e2e           # End-to-end tests
npm run lint               # Code ko lint + auto-fix karta hai

# Single test file/case chalane ke liye
npx jest src/profile/profile.service.spec.ts
npx jest --testNamePattern="should reject user"
```

### Database (Prisma) commands
```bash
npm run generate:models              # .prisma files ko combine + Prisma client generate
npm run migration:deploy             # Pending migrations DB par apply karo
npm run migration:create --name=add_field   # Naya migration banao (schema change hone par)
```

---

## 7. Kuch important rules jo yaad rakhne hain

1. `prisma/schema.prisma` file directly edit mat karo — uski fragment file edit karo.
2. Migrations banane ke baad generated SQL zaroor review karo, aur purane migration files kabhi mat modify karo.
3. Environment variables ko `process.env` se directly access mat karo, hamesha `ConfigService.get(CONSTANT_NAME)` use karo.
4. Status changes (jaise application status update) aksar background jobs, Elasticsearch update ya EMC sync trigger karte hain — inhe accidentally remove mat karo.

---

## 8. Module padhne ka sequence (Easy → Hard)

Poora `src/` ek saath padhna mushkil hai. Neeche modules ko **size, business-logic complexity aur external-integration ke hisaab se** easy-to-hard order me group kiya gaya hai — isi order me padhoge to concepts step-by-step build honge.

### Stage 1 — NestJS basics samajhne ke liye (chhote, simple modules)
Ye modules chhote hain aur ek clean/basic module kaisa dikhta hai (controller + service + dto) ye samjhane ke liye best hain.
- `exception`, `http`, `interceptor` — sabse chhote, sirf ek concept dikhate hain
- `logger` — `LoggerService` kaise banaya/use kiya jata hai
- `prisma` — DB connection kaise setup hota hai
- `retry`, `swagger` — chhote utility-type modules
- `contractor`, `edulevel`, `experience`, `experience-domain`, `skill` — simple CRUD-type modules (yahi se "controller → service → dto" ka flow sabse saaf samajh aayega)

### Stage 2 — Thoda real-world flavor (auth, guards, common patterns)
- `auth` — Login/JWT/Guards kaise kaam karte hain (bahut important stage — isse Guards/Decorators clear honge)
- `category`, `medium`, `registration`, `system-link`, `document`, `speed-test`, `excep-msg` — simple modules, thoda aur business logic
- `reattempt`, `advertiser`, `attendance`, `prometheus`, `trustpilot` — thoda aur real-world flow

### Stage 3 — Cross-cutting/shared modules (in-depth samajhna zaroori hai, kyunki har jagah use hote hain)
- `common` — poore project me shared logic (MinIO clients, helper services, etc.)
- `feature-flag` — Unleash flags kaise check hote hain
- `redis-cache` — Caching pattern (`@type-cacheable` decorators)
- `util` — Date/time aur helper functions

### Stage 4 — Background jobs aur external services (medium complexity)
- `cron` — Bull queues, jobs kaise schedule/process hote hain
- `message-bus`, `gmail`, `hrm`, `hrmec`, `sap`, `sage`, `notification`, `news`, `feedback`, `reject-reason`, `language`, `advisor-action` — external services ke saath integration ka basic pattern
- `dashboard`, `position`, `warning`, `user-application`, `setting` — medium business-logic modules

### Stage 5 — Search aur data-heavy modules
- `es` (Elasticsearch) — search index kaise banta/update hota hai
- `json` — data transformation heavy module
- `reminder` — scheduled reminders (cron + business logic mix)

### Stage 6 — Payment integrations (in dono ko saath me padhna, kyunki mutually exclusive hain)
- `payoneer`
- `papaya`

### Stage 7 — Sabse complex modules (bade, deeply-integrated, sabse zyada business rules)
Ye sabse aakhri me padho — inme sabse zyada lines of code, sabse zyada dependencies aur sabse zyada real business rules hain.
- `geo` — Geo-related complex logic
- `assessment`, `training` — Bade modules, kaafi business flow
- `itm` — Complex, `payoneer` ke saath circular dependency bhi hai (`forwardRef`)
- `emc` — Sabse bada external-integration module (EMC sync)
- `contract` — Bahut complex module (multi-step contract signing flow — `CONTRACT_SUB_STATUS`)
- `profile` — **Sabse bada aur sabse important module** (poore project ka core hai — applicant/freelancer lifecycle, status transitions, sabse zyada files/lines)

> Note: `script/` folder alag hai — ye one-time migration scripts hain (`?dev=<n>` query param se gated), inhe learning ke liye padhna zaroori nahi hai.

**Suggested approach:** Har stage me 1-2 module chuno, unka controller → service → dto → prisma padho, phir Swagger me uske APIs try karo. Stage 1-3 clear ho jaaye to Stage 4-7 apne aap easy lagne lagenge kyunki wahi patterns repeat hote hain, bas business logic zyada hoti hai.

---

## 9. Ek line me summary

Ye ek **NestJS + Fastify** based backend hai jisme **MySQL (via Prisma)** database hai, **Redis/Bull** se background jobs chalte hain, **Elasticsearch** se fast search hota hai, **Sentry** se errors track hote hain, aur **Unleash** se features control kiye jaate hain — sab milkar Dreamport platform ka back-office (admin side) system chalate hain.
