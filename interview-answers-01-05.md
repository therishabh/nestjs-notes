# Interview Answers — Questions 1 to 5

Source: Top Priority list in `INTERVIEW-PREP.md`. Each question below has:
1. A detailed **English answer** (with code/examples where relevant)
2. A detailed **Hinglish answer** (samajhne ke liye, saath me likely **cross-questions** jo interviewer pooch sakta hai, unke answers ke saath)

---

## Q1. Explain the Node.js event loop phases in detail (timers, poll, check, close callbacks, microtasks vs macrotasks)

**Topic:** Node.js Core — Event Loop & Concurrency Model

### English Answer

Node.js runs your JavaScript on a **single thread**, but it can still handle thousands of concurrent connections because I/O work is delegated to the underlying C++ layer (**libuv**), and the JS thread only runs the **event loop** — picking up completed callbacks and running them one at a time.

The event loop has **6 phases**, executed in a fixed cyclical order on every "tick" of the loop:

1. **Timers** — executes callbacks scheduled by `setTimeout()` and `setInterval()` whose delay has elapsed.
2. **Pending callbacks** — executes I/O callbacks deferred to the next loop iteration (e.g., some TCP error callbacks).
3. **Idle, prepare** — internal use only, not relevant to application code.
4. **Poll** — retrieves new I/O events; executes I/O-related callbacks (almost all callbacks except timers, `setImmediate`, and close callbacks). If there's nothing else to do, it may block here waiting for new I/O.
5. **Check** — executes `setImmediate()` callbacks. This phase runs right after the poll phase.
6. **Close callbacks** — executes close event callbacks, e.g. `socket.on('close', ...)`.

After **each phase**, and actually after **every single callback**, Node drains two special queues before moving on:

- **`process.nextTick()` queue** — highest priority, runs before anything else, even before Promise microtasks.
- **Microtask queue** (Promise `.then`/`.catch`/`.finally`, `queueMicrotask`) — runs after the `nextTick` queue is empty.

So the real order per "step" is: `nextTick queue` → `microtask queue` → move to next phase/callback.

**Code Example:**

```js
console.log('1: start');

setTimeout(() => console.log('2: setTimeout'), 0);

setImmediate(() => console.log('3: setImmediate'));

process.nextTick(() => console.log('4: nextTick'));

Promise.resolve().then(() => console.log('5: promise'));

console.log('6: end');
```

**Output:**
```
1: start
6: end
4: nextTick
5: promise
2: setTimeout      // or 3: setImmediate — order can flip, explained below
3: setImmediate
```

Why `nextTick` and `promise` always run before `setTimeout`/`setImmediate`: synchronous code finishes first (call stack empties), then microtasks (`nextTick` + Promise) always drain **before the event loop moves into the next phase**.

Why the order between `setTimeout(fn, 0)` and `setImmediate()` is **not guaranteed** at the top level: it depends on how fast the process reaches the **timers phase** vs the **check phase** — this is a timing race influenced by system performance. However, **inside an I/O callback** (e.g., inside `fs.readFile`'s callback), `setImmediate()` is **always** guaranteed to run before `setTimeout(fn, 0)`, because after an I/O callback, the loop naturally proceeds to the **check** phase before wrapping around to **timers** again.

```js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate')); // always fires first here
});
```

**A dangerous gotcha — starving the event loop:**

```js
function recursive() {
  process.nextTick(recursive); // this NEVER lets I/O phases run — infinite starvation
}
recursive();
```

Because `nextTick` queue is fully drained before the loop can proceed to any phase, a recursive `nextTick` call will block all I/O forever (this is why Node added a warning/guard historically, and why `setImmediate` is often the safer choice when you need "run after current operation, but don't starve I/O").

---

### Hinglish Answer (Detailed)

Node.js single thread pe JavaScript chalata hai, lekin phir bhi hazaaron concurrent connections handle kar leta hai kyunki heavy I/O kaam (file read, network, DNS, etc.) ko **libuv** (C++ library) ko de deta hai. JS thread ka kaam sirf itna hai ki jab koi kaam complete ho jaye to uska callback event loop utha ke chala de.

Event loop **6 phases** me chalta hai, ek fixed cycle me baar baar:

1. **Timers** — `setTimeout` / `setInterval` ke callbacks jinka time pura ho chuka hai.
2. **Pending callbacks** — kuch system-level callbacks jo agle loop tak deferred hote hain.
3. **Idle, prepare** — internal Node use, humein iske baare me sochne ki zarurat nahi.
4. **Poll** — yahan naye I/O events aate hain aur unke callbacks yahin chalte hain (file read complete, DB response aaya, etc). Agar kuch pending nahi hai to yeh phase wait bhi kar sakta hai.
5. **Check** — `setImmediate()` ke callbacks yahan chalte hain, poll ke turant baad.
6. **Close callbacks** — jaise `socket.on('close')`.

Ab yeh samajhna sabse zaroori hai: **har ek phase ke baad, balki har ek callback ke baad**, Node do special queues ko empty karta hai:

- **`process.nextTick()` queue** — sabse high priority, sabse pehle chalti hai.
- **Microtask queue** (Promises ka `.then`) — `nextTick` ke baad chalti hai.

Yani order hai: `nextTick` → `Promise microtask` → phir loop agle phase me jayega.

**Code se samjho:**

```js
console.log('1: start');
setTimeout(() => console.log('2: setTimeout'), 0);
setImmediate(() => console.log('3: setImmediate'));
process.nextTick(() => console.log('4: nextTick'));
Promise.resolve().then(() => console.log('5: promise'));
console.log('6: end');
```

Output hoga: `start`, `end`, `nextTick`, `promise`, फिर `setTimeout`/`setImmediate` (in dono ka order fix nahi hai top-level pe).

`nextTick` aur `promise` hamesha `setTimeout`/`setImmediate` se pehle isliye chalte hain kyunki poora synchronous code khatam hone ke baad, microtasks (nextTick + promise) hamesha turant drain ho jaate hain — event loop agle phase me jaane se pehle.

Lekin `setTimeout(fn, 0)` aur `setImmediate()` ka order top-level code me **guarantee nahi hai** — yeh depend karta hai ki process kितni jaldi "timers phase" me pahunchta hai vs "check phase" me, jo system performance pe depend karta hai.

Lekin agar yeh dono kisi **I/O callback ke andar** likhe hain (jaise `fs.readFile` ke callback ke andar), to `setImmediate()` **hamesha** `setTimeout(fn, 0)` se pehle chalega — kyunki I/O callback poll phase me chalta hai, aur uske turant baad check phase aata hai, timers phase nahi.

**Ek dangerous gotcha jo interviewer aksar puchta hai:**

```js
function recursive() {
  process.nextTick(recursive); // yeh event loop ko hamesha ke liye rok dega
}
recursive();
```

Kyunki `nextTick` queue poori khaali honi chahiye tabhi loop agle phase me ja sakta hai, ek recursive `nextTick` call I/O ko hamesha ke liye block kar dega. Isliye production code me `nextTick` ka recursive use avoid karna chahiye, uski jagah `setImmediate` use karo agar bar-bar chalana ho.

### Possible Cross-Questions (Interviewer follow-ups) — Hinglish

1. **Q: `process.nextTick` aur `Promise.resolve().then()` dono microtask hain, to inme priority kaun jeetta hai?**
   **A:** `process.nextTick` queue hamesha pehle poori drain hoti hai, uske baad Promise microtask queue chalti hai. Agar `nextTick` ke andar naya `nextTick` add kiya jaye, wo bhi usi cycle me chal jayega Promise se pehle.

2. **Q: `setTimeout(fn, 0)` ka matlab kya "0 ms baad turant chalega"?**
   **A:** Nahi. `0` ka matlab hai minimum delay jitni jaldi ho sake, lekin yeh guarantee nahi karta immediate execution — yeh timers phase me tab hi chalega jab current synchronous code aur saare microtasks khatam ho chuke honge, aur event loop timers phase tak pahunch jayega. Node internally minimum ~1ms clamp bhi lagata hai.

3. **Q: Agar main ek CPU-heavy synchronous loop (jaise `for` loop me 10 crore iterations) chala du, to event loop ka kya hoga?**
   **A:** Poora event loop block ho jayega us duration ke liye — koi bhi naya request, timer, ya I/O callback process nahi hoga jab tak yeh synchronous code khatam na ho. Iska solution hai kaam ko chunks me todna (`setImmediate` se break karna) ya `worker_threads` use karna taaki CPU-heavy kaam alag thread pe chale.

4. **Q: Poll phase kab "wait" karta hai aur kab nahi?**
   **A:** Agar poll queue me koi pending callback nahi hai aur koi `setImmediate()` schedule nahi hai, to poll phase thodi der wait karega naye I/O events ke liye (jitna time timers phase tak pahunchne me lagega). Lekin agar `setImmediate()` schedule hai, to poll phase turant check phase ko control de dega.

---

## Q2. How does Node.js handle concurrency with a single thread? What is libuv's role?

**Topic:** Node.js Core — Concurrency Model & libuv

### English Answer

Node.js's JavaScript execution is single-threaded — there's one call stack, and only one line of your JS code runs at any given instant. Yet Node can serve thousands of concurrent connections. This works because of a clear separation of responsibilities:

1. **V8** — executes your JavaScript (compiles and runs it).
2. **libuv** — a C library that provides the **event loop** and handles all asynchronous, OS-level operations. This is where the real concurrency magic happens.

libuv gives Node two different strategies for concurrency, depending on the type of operation:

**a) Network I/O (sockets, HTTP requests, TCP/UDP)** — handled through the operating system's native async I/O mechanisms: `epoll` on Linux, `kqueue` on macOS, `IOCP` on Windows. These are **non-blocking by nature at the OS level** — no extra thread is needed. The OS notifies libuv when a socket has data ready, and libuv hands that off to the event loop's poll phase.

**b) Blocking/filesystem-style operations** — things like `fs.readFile`, `dns.lookup` (not `dns.resolve`, which is different), `crypto.pbkdf2`, and `zlib` compression **don't have OS-level async APIs** on all platforms, so libuv offloads them to a **thread pool** (default size: 4 threads, configurable up to 128 via `UV_THREADPOOL_SIZE`). These threads run in the background, and when done, they queue the callback to run on the main JS thread.

**Code Example — thread pool size and contention:**

```js
// Must be set BEFORE any thread-pool-consuming call, ideally at the very top of the entry file
process.env.UV_THREADPOOL_SIZE = 8;

const crypto = require('crypto');

console.time('pbkdf2 batch');
for (let i = 0; i < 8; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
    console.log(`task ${i} done at`, Date.now());
  });
}
```

If you queue more `pbkdf2` calls than the thread pool size, the extras will **wait in a queue** until a thread frees up — this is a common real-world performance bottleneck people miss (e.g., bcrypt/scrypt password hashing under load).

**Key interview point:** "single-threaded" refers only to **your JavaScript execution**. The Node.js *process* itself is multi-threaded under the hood (V8's garbage collector also uses helper threads, plus the libuv thread pool).

---

### Hinglish Answer (Detailed)

Node.js ki JavaScript execution single-threaded hai — matlab ek time pe sirf ek hi call stack chal raha hota hai, ek hi line of code execute ho rahi hoti hai. Phir bhi Node hazaaron concurrent connections handle kar leta hai. Isko samajhne ke liye do cheezein alag karni padegi:

1. **V8** — sirf JavaScript ko execute karta hai.
2. **libuv** — ek C library jo event loop deta hai aur saari async, OS-level operations handle karti hai. Yahi asli concurrency ka jaadu hai.

libuv do tarike se concurrency deta hai:

**a) Network I/O (sockets, HTTP)** — yeh OS ke apne async mechanisms use karta hai: Linux pe `epoll`, macOS pe `kqueue`, Windows pe `IOCP`. Yeh **naturally non-blocking** hote hain OS level pe hi — ismein koi extra thread ki zarurat nahi padti. Jab socket pe data aata hai, OS libuv ko batata hai, aur libuv event loop ke poll phase me callback bhej deta hai.

**b) File system jaisi operations** — `fs.readFile`, `dns.lookup`, `crypto.pbkdf2`, `zlib` compression — inke liye saare OS pe async API available nahi hai, isliye libuv inko ek **thread pool** ko de deta hai (default 4 threads, `UV_THREADPOOL_SIZE` se 128 tak badha sakte ho). Yeh threads background me kaam karte hain, aur khatam hone pe apna callback main JS thread ko de dete hain.

**Code example samjho:**

```js
process.env.UV_THREADPOOL_SIZE = 8; // yeh sabse pehle set karna zaroori hai, kisi bhi thread-pool call se pehle

const crypto = require('crypto');
for (let i = 0; i < 8; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
    console.log(`task ${i} done`);
  });
}
```

Agar tum thread pool size se zyada `pbkdf2` calls ek saath chalao, to extra calls **queue me wait karengi** jab tak koi thread free na ho. Yeh real production me ek common performance bottleneck hai — jaise bcrypt/scrypt password hashing agar bahut load me chal rahi ho to poori app slow ho sakti hai, kyunki thread pool bhar jaata hai.

**Sabse important interview point:** "single-threaded" sirf tumhare **JavaScript code** ke liye sach hai. Node.js ka poora process andar se multi-threaded hai (libuv ka thread pool, V8 ka garbage collector helper threads).

### Possible Cross-Questions (Interviewer follow-ups) — Hinglish

1. **Q: Kya `dns.lookup()` bhi thread pool use karta hai? Aur `dns.resolve()` ka kya?**
   **A:** Haan, `dns.lookup()` OS ke `getaddrinfo` call ko use karta hai jo libuv thread pool se hota hai. Lekin `dns.resolve()` family (`resolve4`, `resolveMx`, etc.) direct network request bhejti hai c-ares library se, thread pool use nahi karti — yeh farak interviewers kabhi kabhi pooch lete hain.

2. **Q: Agar main `UV_THREADPOOL_SIZE` ko runtime me code ke beech me set karu to kya hoga?**
   **A:** Kaam nahi karega — yeh environment variable process start hone se pehle, ya kam se kam pehli thread-pool-consuming call se pehle set hona chahiye, kyunki libuv thread pool ek baar create hone ke baad size fix ho jaati hai.

3. **Q: Agar main CPU-bound kaam (bahut heavy calculation) karu, to kya wo thread pool me chala sakta hoon?**
   **A:** libuv ka thread pool sirf uske built-in async APIs (fs, dns.lookup, crypto, zlib) ke liye hai, apna custom CPU-heavy JS function usme daalne ka seedha tareeka nahi hai. Uske liye `worker_threads` module use karna sahi approach hai — wahan tum apna khud ka JS code alag thread me chala sakte ho.

4. **Q: Network I/O concurrency ke liye thread pool kyun nahi use hota?**
   **A:** Kyunki modern OS pehle se hi bahut efficient non-blocking socket APIs dete hain (epoll/kqueue/IOCP) jo hazaaron connections ko ek hi thread se monitor kar sakte hain bina blocking ke — to alag se thread lagane ki zarurat hi nahi, aur thread lagana ulta overhead badhata (context switching, memory per thread).

---

## Q3. Explain NestJS's request lifecycle: Middleware → Guards → Interceptors (pre) → Pipes → Handler → Interceptors (post) → Exception Filters

**Topic:** NestJS Architecture — Request Lifecycle

### English Answer

Every incoming HTTP request in NestJS passes through a well-defined pipeline of building blocks, in this exact order:

```
Request
  → Middleware (global, then module-level, in registration order)
  → Guards (global → controller-level → route-level)
  → Interceptors — "before" logic (global → controller-level → route-level)
  → Pipes (global → controller-level → route-level → param-level)
  → Route Handler (your controller method)
  → Interceptors — "after" logic (in reverse order, wrapping the response)
  → Exception Filters (only if an exception was thrown anywhere in the above chain)
  → Response
```

**Why this order matters:**

- **Middleware** runs first, at the Express/Fastify layer. It has access only to `req`, `res`, `next()` — it does **not** know which NestJS controller/handler will eventually handle the request, so it can't use Nest's `ExecutionContext` or `Reflector` metadata easily.
- **Guards** run next, inside Nest's context. Their only job is to decide **yes/no** — `canActivate()` returns `true`/`false` (or throws). This is the right place for **authentication/authorization** checks, because guards can read route metadata (e.g., `@Roles('admin')`) via `Reflector`.
- **Interceptors (before)** run after guards pass. They wrap around the handler using RxJS, so they can run logic **both before and after** the handler executes (e.g., logging start/end time, transforming responses, caching).
- **Pipes** run right before the handler is invoked — they validate and transform arguments (`@Body()`, `@Param()`, `@Query()`).
- **Handler** is your actual controller method.
- **Interceptors (after)** run on the way out, e.g., `ClassSerializerInterceptor` to strip out `@Exclude()` fields, or wrapping the response in a standard envelope.
- **Exception Filters** catch any exception thrown anywhere in the pipeline (guard, pipe, handler, or interceptor) and shape the final error response. If no exception occurs, filters never run.

**Code Example demonstrating order:**

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('1. Middleware');
    next();
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    console.log('2. Guard');
    return true; // if false, request stops HERE — nothing below runs
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('3. Interceptor - before handler');
    return next.handle().pipe(
      tap(() => console.log('6. Interceptor - after handler')),
    );
  }
}

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: any) {
    console.log('4. Pipe');
    return parseInt(value, 10);
  }
}

@Controller('orders')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class OrdersController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    console.log('5. Handler');
    return { id };
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log('7. Exception Filter (only if something threw)');
    // build response...
  }
}
```

**Console output for a successful request:**
```
1. Middleware
2. Guard
3. Interceptor - before handler
4. Pipe
5. Handler
6. Interceptor - after handler
```

If `AuthGuard.canActivate()` returns `false`, the request short-circuits with a `403 Forbidden` right after step 2 — steps 3-6 never run, but the response still flows through an Exception Filter because Nest internally throws a `ForbiddenException` when a guard denies access.

---

### Hinglish Answer (Detailed)

NestJS me har incoming request ek fixed pipeline se guzarta hai, bilkul is order me:

```
Request
  → Middleware (global, phir module-level, jis order me register hue)
  → Guards (global → controller → route)
  → Interceptors ka "before" part (global → controller → route)
  → Pipes (global → controller → route → param)
  → Handler (tumhara controller method)
  → Interceptors ka "after" part (reverse order me, response ko wrap karte hue)
  → Exception Filters (sirf tab chalenge agar kahin exception throw hua ho)
  → Response
```

**Yeh order kyun important hai:**

- **Middleware** sabse pehle chalta hai, Express/Fastify layer pe. Isko sirf `req`, `res`, `next()` milta hai — isse pata nahi hota ki final me konsa controller handler request handle karega, isliye yeh Nest ka `ExecutionContext` ya `Reflector` metadata use nahi kar sakta.
- **Guards** uske baad chalte hain, Nest ke context ke andar. Inka kaam sirf ek decision lena hai — `canActivate()` `true`/`false` return karta hai. Yahi sahi jagah hai **authentication/authorization** check karne ke liye, kyunki guards route pe laga hua metadata padh sakte hain (jaise `@Roles('admin')`) `Reflector` ke through.
- **Interceptors (before part)** guards pass hone ke baad chalte hain. Yeh RxJS use karke handler ko "wrap" karte hain, isliye yeh handler ke **pehle aur baad dono** me kuch kar sakte hain (jaise start/end time log karna, response transform karna, caching).
- **Pipes** handler call hone se thik pehle chalte hain — yeh arguments (`@Body()`, `@Param()`, `@Query()`) validate/transform karte hain.
- **Handler** tumhara asli controller method hai.
- **Interceptors (after part)** response wapas jaate waqt chalte hain — jaise `ClassSerializerInterceptor` jo `@Exclude()` wale fields hata deta hai response se.
- **Exception Filters** pipeline me kahin bhi throw hua exception pakadte hain (guard, pipe, handler, ya interceptor) aur final error response banate hain. Agar koi exception nahi aaya to filters kabhi nahi chalenge.

**Code example upar English section me diya hua hai** — us console output ko dekho: `Middleware → Guard → Interceptor(before) → Pipe → Handler → Interceptor(after)`. Agar Guard `false` return kare to sab kuch wahin ruk jayega aur seedha `403 Forbidden` Exception Filter se hoke response ban jayega.

### Possible Cross-Questions (Interviewer follow-ups) — Hinglish

1. **Q: Guard aur Middleware dono to request ko rok sakte hain, to inme use karne ka farak kya hai?**
   **A:** Middleware ko yeh nahi pata hota ki request kaunsa controller/handler tak jayega — usse route ka metadata (`@Roles()`, `@SetMetadata()`) padhna mushkil hai. Guard ko `ExecutionContext` milta hai jisse wo `context.getHandler()` aur `context.getClass()` ke through `Reflector` se custom decorators padh sakta hai — isliye role-based ya permission-based checks hamesha Guard me karte hain, generic logging/CORS/body-parsing jaisa kaam Middleware me.

2. **Q: Agar Guard `false` return kare to kya Interceptor ka "before" part chalega?**
   **A:** Nahi. Guard fail hote hi Nest request ko `ForbiddenException` ke saath seedha Exception Filter tak bhej deta hai — Interceptor ka code (before ya after, dono) skip ho jaata hai kyunki Interceptor sirf tabhi wrap karta hai jab handler tak request pahunchti hai.

3. **Q: Multiple Exception Filters ho (global, controller-level, method-level), to kaunsa chalega?**
   **A:** Nest sabse **closest scope** wala filter choose karta hai — pehle method-level, phir controller-level, phir global. Agar koi specific `@Catch(SpecificException)` match nahi karta to us filter ko skip karke agla dekha jaata hai (agar `@Catch()` bina argument ke ho to wo sab exceptions pakad lega).

4. **Q: Interceptor ke "after" part me error throw ho jaye handler ke andar, to kya after wala code (jaise `tap()`) chalega?**
   **A:** Nahi, agar handler ke andar exception throw hota hai, to RxJS ka `Observable` error emit karta hai, aur `tap()` (jo sirf success case handle karta hai) skip ho jaata hai — us case me exception seedha Exception Filter tak chala jaata hai. Agar tumhe error case bhi interceptor me handle karna hai to `catchError()` operator use karna padega.

---

## Q4. How does Dependency Injection work in NestJS? Explain providers, scopes (DEFAULT, REQUEST, TRANSIENT)

**Topic:** NestJS Architecture — Dependency Injection & Provider Scopes

### English Answer

NestJS has a built-in **IoC (Inversion of Control) container**. Instead of a class creating its own dependencies (`new SomeService()`), it simply declares what it needs in its constructor, and Nest's container resolves and injects the right instance automatically.

**How resolution actually works under the hood:**

1. When you write `@Injectable()` on a class, and TypeScript compiles it with `emitDecoratorMetadata: true`, TypeScript emits metadata (`design:paramtypes`) listing the constructor parameter types.
2. `reflect-metadata` library reads that metadata at runtime.
3. Nest's container uses this metadata (plus any explicit `@Inject(TOKEN)` decorators for non-class tokens) to know exactly what to instantiate and pass into the constructor.
4. Every provider gets registered against a **token** — by default the class itself is the token, but you can use custom string/symbol tokens with custom providers.

**Custom providers — 4 main styles:**

```typescript
@Module({
  providers: [
    // 1. useClass — bind a token to a class (or swap implementations)
    { provide: 'CACHE_SERVICE', useClass: RedisCacheService },

    // 2. useValue — bind a token to a plain value/object (great for constants/mocks)
    { provide: 'APP_CONFIG', useValue: { apiVersion: 'v1' } },

    // 3. useFactory — bind a token to a function's return value (supports async + DI)
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        return createConnection(configService.get('DB_URL'));
      },
      inject: [ConfigService],
    },

    // 4. useExisting — alias one token to another existing provider
    { provide: 'LOGGER_ALIAS', useExisting: LoggerService },
  ],
})
export class AppModule {}
```

**Provider Scopes:**

| Scope | Behavior | When to use |
|---|---|---|
| `Scope.DEFAULT` (Singleton) | One instance created at app bootstrap, shared across the entire application lifetime and all requests | Default choice — stateless services, DB clients, repositories |
| `Scope.REQUEST` | A new instance is created **for every incoming request** | When you need per-request state, e.g., current authenticated user, tenant context |
| `Scope.TRANSIENT` | A new instance is created **every time it's injected** (each consumer gets its own instance, even within the same request) | Rarely needed — useful for stateful helper objects that shouldn't be shared at all |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getCurrentUserId(): string {
    return (this.request as any).user?.id;
  }
}
```

**Important gotcha:** Injection scope **bubbles up**. If `OrdersService` (a singleton by default) injects `RequestContextService` (which is `REQUEST`-scoped), then `OrdersService` itself is forced to become request-scoped too — meaning a new `OrdersService` instance is created per request, which can hurt performance if `OrdersService` is used heavily across the app. This is why request-scoped providers should be used sparingly, and often `AsyncLocalStorage` (native Node.js API) is preferred as a lighter-weight alternative to pass per-request context without forcing the whole DI subtree to become request-scoped.

---

### Hinglish Answer (Detailed)

NestJS ke andar ek **IoC (Inversion of Control) container** built-in hai. Matlab, koi class apni dependency khud `new SomeService()` karke nahi banati — bas constructor me bata deti hai ki usse kya chahiye, aur Nest ka container sahi instance khud resolve karke inject kar deta hai.

**Yeh resolution kaise kaam karta hai andar se:**

1. Jab tum `@Injectable()` decorator lagate ho kisi class pe, aur TypeScript `emitDecoratorMetadata: true` ke saath compile karta hai, to TypeScript automatically metadata generate kar deta hai (`design:paramtypes`) jisme constructor ke parameters ke types list hote hain.
2. `reflect-metadata` library runtime pe yeh metadata padhti hai.
3. Nest ka container is metadata (aur agar `@Inject(TOKEN)` explicitly likha ho to us token) ki madad se decide karta hai ki kya instantiate karna hai aur constructor me kya pass karna hai.
4. Har provider ek **token** ke against register hota hai — default me class khud hi token hoti hai, lekin custom string/symbol tokens bhi use kar sakte ho custom providers ke saath.

**Custom Providers ke 4 main types:**

```typescript
@Module({
  providers: [
    // 1. useClass — token ko ek class se bind karo (implementation swap karne ke liye)
    { provide: 'CACHE_SERVICE', useClass: RedisCacheService },

    // 2. useValue — token ko simple value/object se bind karo (constants ya mocks ke liye badhiya)
    { provide: 'APP_CONFIG', useValue: { apiVersion: 'v1' } },

    // 3. useFactory — token ko ek function ke return value se bind karo (async + DI dono support karta hai)
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        return createConnection(configService.get('DB_URL'));
      },
      inject: [ConfigService],
    },

    // 4. useExisting — ek token ko doosre existing provider ka alias bana do
    { provide: 'LOGGER_ALIAS', useExisting: LoggerService },
  ],
})
export class AppModule {}
```

**Provider Scopes:**

| Scope | Kya karta hai | Kab use karo |
|---|---|---|
| `Scope.DEFAULT` (Singleton) | App start hote hi ek hi instance banta hai, poori application life me aur sabhi requests me share hota hai | Default choice — stateless services, DB clients, repositories |
| `Scope.REQUEST` | Har incoming request ke liye naya instance banta hai | Jab per-request state chahiye ho, jaise current logged-in user ya tenant context |
| `Scope.TRANSIENT` | Har jagah inject hone pe naya instance banta hai (ek hi request ke andar bhi alag-alag consumers ko alag instance milta hai) | Kam use hota hai — sirf tab jab har jagah bilkul fresh, non-shared instance chahiye ho |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getCurrentUserId(): string {
    return (this.request as any).user?.id;
  }
}
```

**Sabse important gotcha jo interview me pucha jaata hai:** Injection scope **upar ki taraf bubble** karta hai. Agar `OrdersService` (jo default me singleton hai) `RequestContextService` (jo `REQUEST`-scoped hai) ko inject karta hai, to `OrdersService` khud bhi majboori me request-scoped ban jaata hai — matlab har request pe `OrdersService` ka naya instance banega, jo performance ko nuksan pahuncha sakta hai agar `OrdersService` app me bahut jagah use ho raha ho. Isi wajah se request-scoped providers ka use bahut soch samajh ke, kam se kam karna chahiye — aksar `AsyncLocalStorage` (Node.js ka native API) ek lighter alternative ke roop me use kiya jaata hai per-request context pass karne ke liye, bina poore DI subtree ko request-scoped banaye.

### Possible Cross-Questions (Interviewer follow-ups) — Hinglish

1. **Q: Agar `emitDecoratorMetadata` `false` ho ya `reflect-metadata` import na kiya ho to kya DI kaam karega?**
   **A:** Nahi, TypeScript constructor parameter types ka metadata generate hi nahi karega, aur Nest ko pata nahi chalega ki kya inject karna hai (especially class-based tokens ke liye). Isiliye `reflect-metadata` ko app ke entry point pe (`main.ts`) sabse pehle import karna zaroori hota hai, aur `tsconfig.json` me `emitDecoratorMetadata: true` set hona chahiye.

2. **Q: `useValue` aur `useFactory` me kab kya use karoge?**
   **A:** `useValue` tab jab value simple static hai (constant object, ya testing me ek mock object inject karna hai). `useFactory` tab jab value banane ke liye kuch logic chahiye ho — jaise async DB connection banana, ya kisi doosre provider (jaise `ConfigService`) ke value pe depend karta ho.

3. **Q: `Scope.TRANSIENT` aur `Scope.REQUEST` me practical farak kya hai?**
   **A:** `REQUEST` scope me ek hi request ke andar sab jagah **same instance** share hota hai (agar multiple services usi request-scoped provider ko inject karein, sabko same instance milega us request ke liye). `TRANSIENT` me har injection point ko **bilkul naya, alag instance** milta hai, chahe request wahi ho.

4. **Q: `REQUEST` scope ka performance cost avoid karne ka koi tarika hai?**
   **A:** Haan — Node.js ka native `AsyncLocalStorage` use karke per-request data store kar sakte ho bina Nest ke DI scope system ko involve kiye. Isse poora DI subtree request-scoped banne se bach jaata hai, aur sirf ek jagah (middleware ya interceptor) `AsyncLocalStorage.run()` call karke context set karna hota hai, jo baad me kisi bhi singleton service se access ho sakta hai.

---

## Q5. Design a scalable REST API for a real-world system (e.g., e-commerce order system)

**Topic:** System Design + REST API Design — E-Commerce Order System

### English Answer

**Step 1 — Clarify requirements (always do this first in an interview):**

*Functional:*
- Customer can place an order (multiple items, quantities)
- Order must reserve inventory, charge payment, and confirm — or roll back cleanly on failure
- Customer can view order status/history
- Customer can cancel an order (before it ships)

*Non-functional:*
- High availability, must handle traffic spikes (e.g., flash sales)
- Strong consistency for inventory/payment, eventual consistency acceptable for order history views
- Idempotent order creation (client retries shouldn't create duplicate orders)
- Auditable (every state change traceable)

**Step 2 — High-level architecture:**

```
Client
  → API Gateway (auth, rate limiting, routing)
  → Order Service (owns Order data, orchestrates the flow)
        → Inventory Service (reserve/release stock)
        → Payment Service (charge/refund)
        → Notification Service (async, via message queue)
  → Order DB (own database per service — Database-per-Service pattern)
```

Order creation is a classic **distributed transaction** problem — the "Saga pattern" (orchestration style) is the standard solution:

1. Order Service creates an order in `PENDING` state.
2. Order Service calls Inventory Service to **reserve** stock (not deduct yet).
3. On success, Order Service calls Payment Service to **charge**.
4. On success, Order Service marks the order `CONFIRMED` and publishes an `OrderConfirmed` event (consumed asynchronously by Notification Service, Analytics, etc.).
5. If **any step fails**, Order Service runs **compensating actions** in reverse: release the inventory reservation, refund the payment if it had gone through, mark the order `FAILED`.

**Step 3 — REST API design:**

```
POST   /orders                body: { items: [...] }, header: Idempotency-Key
GET    /orders/:id
GET    /orders?userId=&status=&page=&limit=
POST   /orders/:id/cancel
```

**Idempotency implementation (critical for payment-adjacent APIs):**

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createOrder(
  @Headers('Idempotency-Key') idempotencyKey: string,
  @Body() dto: CreateOrderDto,
  @CurrentUser() user: User,
) {
  if (!idempotencyKey) {
    throw new BadRequestException('Idempotency-Key header is required');
  }

  const cached = await this.redis.get(`idem:order:${idempotencyKey}`);
  if (cached) {
    return JSON.parse(cached); // client retried — return the same result, don't reprocess
  }

  const order = await this.orderService.createOrder(user.id, dto);

  await this.redis.set(
    `idem:order:${idempotencyKey}`,
    JSON.stringify(order),
    'EX',
    60 * 60 * 24, // 24h TTL is enough for retry windows
  );

  return order;
}
```

**Step 4 — Scalability considerations:**

- **Stateless Order Service instances** behind a load balancer → scale horizontally.
- **Product catalog data cached in Redis** (read-heavy, changes infrequently) to reduce DB load.
- **Order processing offloaded to a queue** (e.g., RabbitMQ/Kafka) so the API can respond fast (`202 Accepted` + order ID) while the Saga runs asynchronously in the background for high-traffic events like flash sales.
- **Rate limiting** at the API Gateway to protect against abuse/bot checkout attempts.
- **Database sharding by `userId` or region** if the order volume outgrows a single DB instance.
- **Read replicas** for order-history/reporting queries so they don't compete with write traffic on the primary.

**Step 5 — Error handling/consistency:**

- Use an **outbox table** in the Order DB: write the `OrderConfirmed` event to the same DB transaction as the order status update, then a separate relay process publishes it to Kafka/RabbitMQ. This guarantees the event is never lost even if the message broker is briefly unavailable (avoids the classic "dual write" problem).

---

### Hinglish Answer (Detailed)

**Step 1 — Sabse pehle requirements clarify karo (interview me yeh sabse pehla step hona chahiye):**

*Functional:*
- Customer order place kar sake (multiple items, quantities)
- Order banate waqt inventory reserve ho, payment charge ho, aur confirm ho — ya fail hone pe sab kuch cleanly rollback ho
- Customer apna order status/history dekh sake
- Customer order cancel kar sake (shipping se pehle)

*Non-functional:*
- High availability, traffic spikes handle kar sake (jaise flash sale)
- Inventory/payment ke liye strong consistency chahiye, order history dekhne ke liye eventual consistency chalegi
- Order creation idempotent ho (client agar retry kare to duplicate order na bane)
- Har state change auditable ho

**Step 2 — High-level architecture:**

```
Client
  → API Gateway (auth, rate limiting, routing)
  → Order Service (order data ka owner, poora flow orchestrate karta hai)
        → Inventory Service (stock reserve/release)
        → Payment Service (charge/refund)
        → Notification Service (async, message queue ke through)
  → Order DB (har service ka apna alag database — Database-per-Service pattern)
```

Order create karna ek classic **distributed transaction** problem hai — iske liye standard solution hai **Saga pattern** (orchestration style):

1. Order Service ek order `PENDING` state me create karta hai.
2. Order Service, Inventory Service ko call karke stock **reserve** karta hai (deduct abhi nahi karta).
3. Success hone pe, Payment Service ko call karke **charge** karta hai.
4. Success hone pe, order ko `CONFIRMED` mark karta hai aur ek `OrderConfirmed` event publish karta hai (jo Notification Service, Analytics waghera asynchronously consume karte hain).
5. Agar **koi bhi step fail** ho jaye, to Order Service **compensating actions** ulte order me chalata hai: inventory reservation release karna, agar payment ho chuka tha to refund karna, order ko `FAILED` mark karna.

**Step 3 — REST API design:**

```
POST   /orders                body: { items: [...] }, header: Idempotency-Key
GET    /orders/:id
GET    /orders?userId=&status=&page=&limit=
POST   /orders/:id/cancel
```

**Idempotency implementation (payment se juda hone ki wajah se yeh sabse critical part hai):**

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async createOrder(
  @Headers('Idempotency-Key') idempotencyKey: string,
  @Body() dto: CreateOrderDto,
  @CurrentUser() user: User,
) {
  if (!idempotencyKey) {
    throw new BadRequestException('Idempotency-Key header is required');
  }

  const cached = await this.redis.get(`idem:order:${idempotencyKey}`);
  if (cached) {
    return JSON.parse(cached); // client ne retry kiya — same result do, dobara process mat karo
  }

  const order = await this.orderService.createOrder(user.id, dto);

  await this.redis.set(
    `idem:order:${idempotencyKey}`,
    JSON.stringify(order),
    'EX',
    60 * 60 * 24, // 24 ghante ka TTL retry window ke liye kaafi hai
  );

  return order;
}
```

**Step 4 — Scalability points:**

- **Order Service stateless** rakho aur load balancer ke peeche multiple instances chalao → horizontal scaling.
- **Product catalog Redis me cache** karo (read-heavy hota hai, kam change hota hai) taaki DB pe load kam ho.
- **Order processing ko queue pe daal do** (RabbitMQ/Kafka) taaki API turant respond kare (`202 Accepted` + order ID) aur Saga background me asynchronously chale — flash sale jaisi high-traffic events me yeh bahut zaroori hai.
- **API Gateway pe rate limiting** lagao taaki bot checkout attempts se bacha ja sake.
- Agar order volume ek DB se sambhal na paye to **`userId` ya region ke basis pe sharding** karo.
- **Read replicas** use karo order-history/reporting queries ke liye, taaki wo primary DB ke write traffic se compete na karein.

**Step 5 — Error handling/consistency:**

- Order DB me ek **outbox table** use karo: order status update aur `OrderConfirmed` event dono ko **ek hi DB transaction** me likho, phir ek alag "relay" process usse Kafka/RabbitMQ tak publish kare. Isse guarantee milta hai ki event kabhi lost nahi hoga, chahe message broker temporarily down ho — yeh classic "dual write problem" ko avoid karta hai.

### Possible Cross-Questions (Interviewer follow-ups) — Hinglish

1. **Q: Agar Payment Service order ban jaane ke baad down ho jaye, to kya hoga?**
   **A:** Saga orchestrator (Order Service) timeout/error dekh ke **compensating transaction** trigger karega — reserved inventory ko release karega, order ko `PAYMENT_FAILED` ya `PENDING_RETRY` mark karega, aur user ko notify karega. Agar retry logic hai to exponential backoff ke saath dobara try kiya ja sakta hai, ya order ko background job queue me daal ke baad me process kiya ja sakta hai.

2. **Q: Idempotency Key aur normal Order ID me kya farak hai?**
   **A:** Order ID server-generated hota hai successful order ke liye. Idempotency Key **client-generated** hota hai (usually UUID), aur ek hi client request (chahe network retry ki wajah se multiple baar bheji gayi ho) ko dedupe karne ke liye use hota hai — server usse cache/DB me check karta hai processing shuru karne se pehle.

3. **Q: REST synchronous hai, to phir async Saga ke saath API design kaise consistent rakhoge?**
   **A:** API `POST /orders` turant `202 Accepted` ke saath order ID return kar sakta hai (agar processing async hai), aur client `GET /orders/:id` poll kare status jaanne ke liye, ya WebSocket/SSE se real-time update le. Chhoti scale pe (jahan Saga fast hai) synchronous `201 Created` bhi return kiya ja sakta hai — yeh trade-off traffic aur latency requirement pe depend karta hai.

4. **Q: Do services (Order DB aur Inventory DB) ke beech consistency kaise maintain karoge agar dono alag databases use karte hain?**
   **A:** Traditional two-phase commit distributed systems me practical nahi hai (tight coupling, availability issues). Isliye Saga pattern use karte hain — **eventual consistency** ke saath, jahan har step apna local transaction complete karta hai aur agla step event/API call se trigger hota hai. Agar beech me fail ho to compensating actions se system ko wapas consistent state me le aate hain. Business ko yeh samjhana zaroori hai ki thodi der ke liye system "in progress" state me rahega, permanent inconsistency nahi hogi.

---

*Agla batch (Questions 6-10 ya jo bhi range bologe) baad me isi format me add kiya jayega jab request kiya jayega.*
