# Backend Interview Preparation Guide
### Node.js · Express.js · NestJS — Senior / Lead / Full-Stack Engineer

Prepared for a candidate with 12+ years in web development, 6+ years professional full-stack experience, primary backend stack Node.js/Express/NestJS.

Legend: 🔥🔥🔥 Very Important &nbsp;|&nbsp; 🔥🔥 Important &nbsp;|&nbsp; 🔥 Good to Know

---

## Table of Contents

1. [Top Priority — Prepare These First](#1-top-priority--prepare-these-first)
2. [Node.js Core](#2-nodejs-core)
   - [Intermediate](#21-nodejs-intermediate)
   - [Advanced](#22-nodejs-advanced)
   - [Senior / Architect](#23-nodejs-senior--architect)
3. [Express.js](#3-expressjs)
   - [Intermediate](#31-express-intermediate)
   - [Advanced](#32-express-advanced)
4. [NestJS](#4-nestjs)
   - [Beginner / Intermediate](#41-nestjs-beginner--intermediate)
   - [Dependency Injection](#42-dependency-injection)
   - [Middleware, Guards, Interceptors, Pipes, Filters](#43-middleware-guards-interceptors-pipes-filters)
   - [Advanced NestJS](#44-advanced-nestjs)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Database & Transactions](#6-database--transactions)
7. [Caching, Redis, Queues & Messaging](#7-caching-redis-queues--messaging)
8. [REST API Design](#8-rest-api-design)
9. [Performance & Scalability](#9-performance--scalability)
10. [Security](#10-security)
11. [Error Handling & Logging](#11-error-handling--logging)
12. [Testing & Debugging](#12-testing--debugging)
13. [Microservices & Distributed Systems](#13-microservices--distributed-systems)
14. [System Design Questions](#14-system-design-questions)
15. [Real-World Scenario Questions](#15-real-world-scenario-questions)
16. [Senior/Lead/Architect-Only Questions](#16-seniorleadarchitect-only-questions)
17. [Final Interview Preparation Priority](#17-final-interview-preparation-priority)

---

## 1. Top Priority — Prepare These First

These come up in almost every senior/lead backend interview. If time is short, master these before anything else.

| # | Question | Priority |
|---|----------|----------|
| 1 | Explain the Node.js event loop phases in detail (timers, poll, check, close callbacks, microtasks vs macrotasks) | 🔥🔥🔥 |
| 2 | How does Node.js handle concurrency with a single thread? What is libuv's role? | 🔥🔥🔥 |
| 3 | Explain NestJS's request lifecycle: Middleware → Guards → Interceptors (pre) → Pipes → Handler → Interceptors (post) → Exception Filters | 🔥🔥🔥 |
| 4 | How does Dependency Injection work in NestJS? Explain providers, scopes (`DEFAULT`, `REQUEST`, `TRANSIENT`) | 🔥🔥🔥 |
| 5 | Design a scalable REST API for a real-world system (e.g., e-commerce order system) | 🔥🔥🔥 |
| 6 | Explain JWT-based authentication flow, refresh tokens, and how to handle token revocation | 🔥🔥🔥 |
| 7 | How would you handle database transactions in NestJS with TypeORM/Prisma? | 🔥🔥🔥 |
| 8 | How do you scale a Node.js application horizontally? What are the challenges (sticky sessions, shared state, pub/sub)? | 🔥🔥🔥 |
| 9 | Explain the difference between Guards, Interceptors, Pipes, and Middleware in NestJS — when to use each | 🔥🔥🔥 |
| 10 | How would you design and secure a multi-tenant / role-based access control (RBAC) system? | 🔥🔥🔥 |
| 11 | How do you handle errors globally in NestJS (Exception Filters) and in Express (error-handling middleware)? | 🔥🔥🔥 |
| 12 | Explain caching strategies with Redis (cache-aside, write-through, TTL invalidation, cache stampede) | 🔥🔥🔥 |
| 13 | How do message queues (RabbitMQ/Kafka) fit into a microservices architecture? When would you choose one over the other? | 🔥🔥🔥 |
| 14 | How do you prevent common security vulnerabilities (SQL injection, XSS, CSRF, mass assignment) in a Node/NestJS app? | 🔥🔥🔥 |
| 15 | Walk through a production incident you debugged (memory leak, event loop blocking, connection pool exhaustion) | 🔥🔥🔥 |

---

## 2. Node.js Core

### 2.1 Node.js Intermediate

| Question | Priority |
|---|---|
| What is the event loop and how does it differ from the browser's event loop? | 🔥🔥🔥 |
| Explain the difference between `process.nextTick()`, `setImmediate()`, and `setTimeout(fn, 0)` | 🔥🔥🔥 |
| What are Streams in Node.js? Explain Readable, Writable, Duplex, and Transform streams | 🔥🔥 |
| How does backpressure work in streams and why does it matter? | 🔥🔥 |
| Difference between `require` (CommonJS) and `import` (ESM) — interop issues you've hit | 🔥🔥 |
| What is the Buffer class and when would you use it? | 🔥 |
| How do you handle file uploads efficiently (streaming vs buffering to memory)? | 🔥🔥 |
| Explain `EventEmitter` and how NestJS/Node use the observer pattern internally | 🔥🔥 |
| What is middleware chaining and how does `next()` work under the hood? | 🔥🔥 |
| How does Node.js manage the module cache, and what problems can that cause (singleton state, circular deps)? | 🔥 |

### 2.2 Node.js Advanced

| Question | Priority |
|---|---|
| Explain libuv's thread pool — which operations use it (fs, dns.lookup, crypto) vs. which use OS-level async (network I/O) | 🔥🔥🔥 |
| How would you debug a memory leak in a long-running Node.js process? (heap snapshots, `--inspect`, `clinic.js`) | 🔥🔥🔥 |
| How do you detect and fix an event-loop-blocking operation in production? | 🔥🔥🔥 |
| Explain Worker Threads vs Child Processes vs Cluster module — when to use each | 🔥🔥🔥 |
| What is the difference between CPU-bound and I/O-bound workloads, and how does that affect Node.js architecture decisions? | 🔥🔥🔥 |
| How does V8 garbage collection work (generational GC, major/minor GC) and how can it cause latency spikes? | 🔥🔥 |
| Explain async/await error handling pitfalls (unhandled promise rejections, swallowed errors in `.forEach`) | 🔥🔥🔥 |
| How do you implement graceful shutdown (SIGTERM handling, draining connections, closing DB pools)? | 🔥🔥🔥 |
| What are the differences between `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any`, and when to use each in a batch API scenario? | 🔥🔥 |
| How would you profile a slow Node.js API endpoint end-to-end (flame graphs, APM tools)? | 🔥🔥 |

### 2.3 Node.js Senior / Architect

| Question | Priority |
|---|---|
| How would you architect a Node.js service to handle 10k+ concurrent WebSocket connections? | 🔥🔥🔥 |
| Design a rate limiter for a Node.js API (token bucket vs sliding window, distributed rate limiting with Redis) | 🔥🔥🔥 |
| How do you decide between a monolith, modular monolith, and microservices for a Node.js backend? | 🔥🔥🔥 |
| What strategies do you use to keep a Node.js process CPU from being saturated by a single heavy computation? | 🔥🔥 |
| How would you implement zero-downtime deployments for a Node.js service (PM2/K8s rolling updates, health checks)? | 🔥🔥 |
| Explain how you would design a job scheduler / cron system that scales across multiple instances without duplicate execution | 🔥🔥🔥 |

---

## 3. Express.js

### 3.1 Express Intermediate

| Question | Priority |
|---|---|
| Explain Express middleware architecture and the request/response cycle | 🔥🔥🔥 |
| Difference between application-level, router-level, and error-handling middleware | 🔥🔥 |
| How do you structure a large Express application (routers, controllers, services, repositories)? | 🔥🔥🔥 |
| How do you validate request payloads in Express (Joi, express-validator, Zod)? | 🔥🔥 |
| How does Express handle async errors, and why do you need a wrapper (or Express 5's native support)? | 🔥🔥🔥 |
| What's the purpose of `app.use()` ordering, and how can misordering cause bugs? | 🔥🔥 |

### 3.2 Express Advanced

| Question | Priority |
|---|---|
| How would you implement centralized error handling with custom error classes in Express? | 🔥🔥🔥 |
| How do you secure an Express app in production (Helmet, CORS, rate limiting, sanitization)? | 🔥🔥🔥 |
| How would you migrate a large Express monolith to NestJS incrementally? | 🔥🔥 |
| Compare Express vs Fastify vs NestJS — trade-offs in performance, structure, and DI | 🔥🔥🔥 |
| How do you implement API versioning in Express? | 🔥 |
| How would you add distributed tracing (OpenTelemetry) to an Express app? | 🔥🔥 |

---

## 4. NestJS

### 4.1 NestJS Beginner / Intermediate

| Question | Priority |
|---|---|
| What problem does NestJS solve compared to plain Express? | 🔥🔥🔥 |
| Explain Modules, Controllers, and Providers — the building blocks of a Nest app | 🔥🔥🔥 |
| What is the purpose of decorators (`@Injectable`, `@Controller`, `@Module`) and how do they work under the hood (metadata/reflection via `reflect-metadata`)? | 🔥🔥🔥 |
| How do you structure a feature module in NestJS (feature modules vs shared/core modules)? | 🔥🔥 |
| What is a DTO and why use `class-validator`/`class-transformer` with it? | 🔥🔥🔥 |
| Difference between `@Body()`, `@Param()`, `@Query()`, `@Headers()` decorators | 🔥 |
| How do you handle configuration/env variables in NestJS (`@nestjs/config`)? | 🔥🔥 |

### 4.2 Dependency Injection

| Question | Priority |
|---|---|
| Explain NestJS's IoC container and how it resolves dependencies | 🔥🔥🔥 |
| What are provider scopes: `Singleton` (default), `Request`, `Transient` — trade-offs of each (especially `REQUEST` scope's performance cost) | 🔥🔥🔥 |
| How do you use custom providers (`useClass`, `useValue`, `useFactory`, `useExisting`)? | 🔥🔥🔥 |
| How does circular dependency injection work, and how do you resolve it (`forwardRef()`)? | 🔥🔥 |
| How do you inject a provider from another module (exports/imports, dynamic modules)? | 🔥🔥 |
| What are Dynamic Modules and when would you build one (e.g., a configurable `DatabaseModule.forRoot()`)? | 🔥🔥 |
| Difference between `@Injectable()` services and `@Global()` modules — when is `@Global()` an anti-pattern? | 🔥🔥 |

### 4.3 Middleware, Guards, Interceptors, Pipes, Filters

| Question | Priority |
|---|---|
| Explain the full NestJS request lifecycle and the order in which each component executes | 🔥🔥🔥 |
| When would you use Middleware vs a Guard vs an Interceptor for the same-looking problem (e.g., auth)? | 🔥🔥🔥 |
| How do Guards determine route access (`CanActivate`), and how do you build a custom `RolesGuard`? | 🔥🔥🔥 |
| How do Interceptors work (`NestInterceptor`, RxJS `Observable`, `next.handle()`)? Give an example (logging, response transformation, caching) | 🔥🔥🔥 |
| How do Pipes validate/transform incoming data (`ValidationPipe`, custom pipes)? | 🔥🔥🔥 |
| How do Exception Filters work, and how do you build a global filter to standardize error responses? | 🔥🔥🔥 |
| How do you apply these (guards/interceptors/pipes/filters) globally vs. per-controller vs. per-route? | 🔥🔥 |
| How would you build a `SerializeInterceptor` to control which fields are exposed in a response? | 🔥🔥 |
| How do you access the underlying Express/Fastify request/response inside a Nest middleware or guard? | 🔥 |

### 4.4 Advanced NestJS

| Question | Priority |
|---|---|
| How does NestJS support multiple transport layers (HTTP, WebSockets, gRPC, microservices)? | 🔥🔥🔥 |
| How would you implement a NestJS microservice using TCP/Redis/Kafka transporters? | 🔥🔥🔥 |
| How do you implement request-scoped context (e.g., current user, tenant ID) across a request using `REQUEST` scope or `AsyncLocalStorage`? | 🔥🔥🔥 |
| How do you use `AsyncLocalStorage` for correlation IDs / request tracing in NestJS? | 🔥🔥 |
| How do you implement caching at the interceptor level in NestJS (`CacheInterceptor`, custom TTL per route)? | 🔥🔥 |
| How would you set up CQRS with `@nestjs/cqrs` (Commands, Queries, Events, Sagas)? | 🔥🔥 |
| How do you write custom decorators (param decorators like `@CurrentUser()`, or method decorators)? | 🔥🔥 |
| How do you handle file uploads in NestJS (`@nestjs/platform-express`, `Multer`, streaming to S3)? | 🔥 |
| How do you implement GraphQL in NestJS (code-first vs schema-first, resolvers, guards on resolvers)? | 🔥🔥 |
| How would you set up a health check endpoint using `@nestjs/terminus` (DB, Redis, disk, memory checks)? | 🔥🔥 |
| How do you implement API versioning and Swagger/OpenAPI documentation in NestJS? | 🔥🔥 |
| How do you unit test a Guard/Interceptor/Pipe in isolation, and how do you test a full module with `Test.createTestingModule`? | 🔥🔥🔥 |

---

## 5. Authentication & Authorization

| Question | Priority |
|---|---|
| Explain the JWT authentication flow end-to-end (login → access token → refresh token → logout) | 🔥🔥🔥 |
| Access token vs refresh token — why separate them, where to store each (httpOnly cookie vs localStorage), and the security trade-offs | 🔥🔥🔥 |
| How do you implement refresh token rotation and detect token reuse/theft? | 🔥🔥🔥 |
| How do you revoke a JWT before its expiry (blacklist in Redis, short-lived tokens + refresh, versioning)? | 🔥🔥🔥 |
| Explain Passport.js integration in NestJS (`AuthGuard`, strategies: `local`, `jwt`, `oauth2`) | 🔥🔥🔥 |
| How do you implement Role-Based Access Control (RBAC) vs Attribute-Based Access Control (ABAC)? | 🔥🔥🔥 |
| How do you implement OAuth2/OpenID Connect login (Google/GitHub) in NestJS? | 🔥🔥 |
| How do you securely hash passwords — bcrypt vs scrypt vs argon2, salt rounds, timing attacks? | 🔥🔥🔥 |
| How would you implement multi-factor authentication (MFA/TOTP)? | 🔥 |
| How do you implement session-based auth vs token-based auth, and when would you choose each? | 🔥🔥 |
| How do you secure service-to-service authentication in a microservices architecture (mTLS, API keys, service tokens)? | 🔥🔥🔥 |
| How do you implement fine-grained permission checks (e.g., "user can only edit their own resource") beyond simple roles? | 🔥🔥 |

---

## 6. Database & Transactions

| Question | Priority |
|---|---|
| How do you manage database transactions in TypeORM/Prisma (`QueryRunner`, `$transaction`)? | 🔥🔥🔥 |
| Explain ACID properties and how they map to real transaction scenarios (e.g., money transfer between accounts) | 🔥🔥🔥 |
| What are database isolation levels (Read Uncommitted → Serializable), and what problems does each solve (dirty reads, phantom reads)? | 🔥🔥🔥 |
| How do you handle optimistic vs pessimistic locking, and when would you use each? | 🔥🔥🔥 |
| N+1 query problem — how does it happen with ORMs, and how do you solve it (eager loading, `DataLoader`, joins)? | 🔥🔥🔥 |
| How do you design and manage database migrations safely in production (zero-downtime migrations)? | 🔥🔥🔥 |
| SQL vs NoSQL — how do you decide which to use for a given feature? | 🔥🔥 |
| How do you implement soft deletes, and what are the trade-offs vs hard deletes? | 🔥 |
| How do you handle database connection pooling, and what happens when a pool is exhausted? | 🔥🔥🔥 |
| How would you design a schema for a multi-tenant SaaS application (shared DB with tenant_id, schema-per-tenant, DB-per-tenant)? | 🔥🔥🔥 |
| How do you implement database sharding and replication, and how does your app route reads/writes accordingly? | 🔥🔥 |
| How do you keep data consistent across two services that each own their own database (Saga pattern, outbox pattern)? | 🔥🔥🔥 |
| Explain the Repository pattern and Unit of Work pattern as used with TypeORM/NestJS | 🔥🔥 |

---

## 7. Caching, Redis, Queues & Messaging

| Question | Priority |
|---|---|
| Explain cache-aside, write-through, and write-behind caching strategies | 🔥🔥🔥 |
| How do you handle cache invalidation on updates (and the classic "two hard things in CS" problem)? | 🔥🔥🔥 |
| What is cache stampede/thundering herd, and how do you prevent it (locks, request coalescing, jittered TTLs)? | 🔥🔥🔥 |
| How do you use Redis beyond caching — pub/sub, distributed locks (`Redlock`), rate limiting, session store? | 🔥🔥🔥 |
| How do you implement a distributed lock correctly with Redis? | 🔥🔥 |
| When would you use RabbitMQ vs Kafka vs Redis Streams vs AWS SQS/SNS? | 🔥🔥🔥 |
| Explain Kafka concepts: topics, partitions, consumer groups, offsets, at-least-once vs exactly-once delivery | 🔥🔥🔥 |
| How do you ensure message idempotency when a consumer might process the same message twice? | 🔥🔥🔥 |
| How do you handle a poison message / dead-letter queue (DLQ)? | 🔥🔥🔥 |
| How would you implement background job processing in NestJS (Bull/BullMQ with Redis)? | 🔥🔥🔥 |
| How do you handle job retries with exponential backoff and avoid duplicate side effects? | 🔥🔥 |
| How do you scale consumers horizontally while preserving message ordering guarantees where needed? | 🔥🔥 |
| Explain the outbox pattern for reliably publishing events after a DB transaction commits | 🔥🔥🔥 |

---

## 8. REST API Design

| Question | Priority |
|---|---|
| What makes an API RESTful vs. "REST-ish"? Explain HATEOAS and whether it's practical | 🔥 |
| How do you design pagination for large collections (offset vs cursor-based)? | 🔥🔥🔥 |
| How do you handle API versioning (URI, header, media-type versioning) and deprecate old versions gracefully? | 🔥🔥🔥 |
| How do you design idempotent APIs (idempotency keys for POST/payment endpoints)? | 🔥🔥🔥 |
| What HTTP status codes do you use for various error conditions, and why does it matter? | 🔥🔥 |
| How do you design a consistent error response schema across an API? | 🔥🔥🔥 |
| REST vs GraphQL vs gRPC — how do you choose for a given use case? | 🔥🔥🔥 |
| How do you handle partial updates (`PATCH` vs `PUT`) and their semantics? | 🔥 |
| How do you design bulk operations (batch create/update) efficiently and safely? | 🔥🔥 |
| How do you document and contract-test an API (OpenAPI/Swagger, Pact for consumer-driven contracts)? | 🔥🔥 |

---

## 9. Performance & Scalability

| Question | Priority |
|---|---|
| How do you identify a performance bottleneck in a production Node.js/NestJS API? | 🔥🔥🔥 |
| Vertical vs horizontal scaling — trade-offs, and when horizontal scaling introduces new problems (shared state, sticky sessions) | 🔥🔥🔥 |
| How do you implement load balancing across multiple Node.js instances (Nginx, K8s Service, sticky sessions for WebSockets)? | 🔥🔥🔥 |
| How do you reduce response latency (compression, connection keep-alive, HTTP/2, payload trimming)? | 🔥🔥 |
| How do you use the `cluster` module or PM2 cluster mode to utilize multiple CPU cores? | 🔥🔥🔥 |
| How do you implement rate limiting and throttling in NestJS (`@nestjs/throttler`)? | 🔥🔥🔥 |
| How would you design a system to handle a sudden 10x traffic spike (auto-scaling, circuit breakers, queue-based load leveling)? | 🔥🔥🔥 |
| What is a circuit breaker pattern, and when/why would you add one between services? | 🔥🔥🔥 |
| How do you profile and reduce memory usage in a Node.js service running in a container with limited memory? | 🔥🔥 |
| How do you use CDN and edge caching to reduce backend load? | 🔥 |
| How do you benchmark and load-test an API (k6, Artillery, autocannon) before a launch? | 🔥🔥 |

---

## 10. Security

| Question | Priority |
|---|---|
| How do you prevent SQL/NoSQL injection in an ORM-based app (parameterized queries, avoiding raw string interpolation)? | 🔥🔥🔥 |
| How do you prevent XSS in an API-driven app (output encoding, CSP headers)? | 🔥🔥 |
| How do you prevent CSRF, and does it apply to token-based (stateless) APIs? | 🔥🔥 |
| What is mass assignment, and how do DTOs + `class-validator`'s whitelist option prevent it? | 🔥🔥🔥 |
| How do you securely manage secrets/env variables (Vault, AWS Secrets Manager, never in git)? | 🔥🔥🔥 |
| How do you implement security headers (Helmet: CSP, HSTS, X-Frame-Options)? | 🔥🔥 |
| How do you protect against brute-force login attempts (rate limiting, account lockout, CAPTCHA)? | 🔥🔥🔥 |
| How do you handle CORS correctly in a production NestJS app without over-permissive `*` origins? | 🔥🔥🔥 |
| How do you prevent sensitive data (passwords, tokens) from leaking into logs or API responses (`@Exclude()` from `class-transformer`)? | 🔥🔥🔥 |
| What is a supply-chain risk with npm dependencies, and how do you mitigate it (lockfiles, `npm audit`, Dependabot, minimal deps)? | 🔥🔥 |
| How do you implement audit logging for sensitive operations? | 🔥 |
| How do you securely handle file uploads (validate MIME type/size, scan for malware, avoid path traversal)? | 🔥🔥 |

---

## 11. Error Handling & Logging

| Question | Priority |
|---|---|
| How do you design a global exception filter in NestJS to return consistent error shapes? | 🔥🔥🔥 |
| Difference between operational errors (expected, e.g., validation failure) and programmer errors (bugs) — how should handling differ? | 🔥🔥🔥 |
| How do you avoid leaking stack traces/internal details to API clients while still logging them internally? | 🔥🔥🔥 |
| How do you implement structured logging (JSON logs with correlation/request IDs) using Winston/Pino? | 🔥🔥🔥 |
| How do you correlate logs across microservices for a single request (trace IDs, `AsyncLocalStorage`, OpenTelemetry)? | 🔥🔥🔥 |
| How do you set up centralized log aggregation and alerting (ELK/Loki/Datadog, alert thresholds)? | 🔥🔥 |
| How do you handle unhandled promise rejections and uncaught exceptions at the process level without crashing silently? | 🔥🔥 |
| How do you differentiate retryable vs non-retryable errors when calling downstream services? | 🔥🔥 |

---

## 12. Testing & Debugging

| Question | Priority |
|---|---|
| How do you structure unit tests vs integration tests vs e2e tests in a NestJS project? | 🔥🔥🔥 |
| How do you mock a provider/dependency using NestJS's `Test.createTestingModule` and `overrideProvider`? | 🔥🔥🔥 |
| How do you test a Guard, Pipe, or Interceptor in isolation? | 🔥🔥 |
| How do you test code that talks to a database — real test DB, testcontainers, or in-memory/mocked repository? | 🔥🔥🔥 |
| How do you write contract tests between microservices/consumers and producers? | 🔥🔥 |
| How do you approach debugging a production issue you can't reproduce locally (logs, APM traces, feature flags to isolate)? | 🔥🔥🔥 |
| How do you use `node --inspect` and Chrome DevTools to debug a running Node.js process? | 🔥 |
| What is your strategy for test coverage — do you aim for a percentage, or focus on critical paths? | 🔥🔥 |
| How do you test async code and timers reliably (fake timers, avoiding flaky tests)? | 🔥🔥 |

---

## 13. Microservices & Distributed Systems

| Question | Priority |
|---|---|
| How do you decide service boundaries when breaking a monolith into microservices (Domain-Driven Design, bounded contexts)? | 🔥🔥🔥 |
| How do services discover each other (service discovery, API gateway, service mesh)? | 🔥🔥🔥 |
| How do you handle distributed transactions across microservices (Saga pattern — choreography vs orchestration)? | 🔥🔥🔥 |
| Explain eventual consistency and how you communicate it to a frontend/product team | 🔥🔥🔥 |
| How do you implement an API Gateway pattern (routing, auth, rate limiting at the edge)? | 🔥🔥🔥 |
| What is the CAP theorem, and how does it influence your database/service choices? | 🔥🔥🔥 |
| How do you handle versioning and backward compatibility of events/message schemas between services? | 🔥🔥 |
| How do you implement retries with exponential backoff and jitter when calling a downstream service? | 🔥🔥🔥 |
| How do you prevent cascading failures (circuit breaker, bulkhead pattern, timeouts)? | 🔥🔥🔥 |
| How do you handle distributed tracing across services (OpenTelemetry, Jaeger/Zipkin)? | 🔥🔥 |
| How do you deploy and manage many microservices (containerization, Kubernetes, CI/CD pipelines)? | 🔥🔥 |
| How do you approach schema/contract evolution for a Kafka topic consumed by multiple teams? | 🔥🔥 |

---

## 14. System Design Questions

Common in senior/lead-level rounds — expect to whiteboard one of these.

| Question | Priority |
|---|---|
| Design a URL shortener (with analytics, custom aliases, expiry) | 🔥🔥🔥 |
| Design a rate limiter as a shared service usable by multiple APIs | 🔥🔥🔥 |
| Design a notification system (email/SMS/push) with retries and delivery tracking | 🔥🔥🔥 |
| Design a real-time chat application (WebSockets, message persistence, delivery/read receipts, scaling with Redis pub/sub) | 🔥🔥🔥 |
| Design an e-commerce order processing system (inventory reservation, payment, saga for rollback) | 🔥🔥🔥 |
| Design a file upload/processing pipeline (pre-signed URLs, virus scanning, thumbnail generation via queue) | 🔥🔥 |
| Design a distributed job scheduler (like cron) that doesn't double-execute across instances | 🔥🔥🔥 |
| Design an API for a multi-tenant SaaS platform including tenant isolation | 🔥🔥🔥 |
| Design a payment processing system with idempotency and reconciliation | 🔥🔥🔥 |
| Design a news feed / activity feed system (fan-out on write vs fan-out on read) | 🔥🔥 |
| Design an audit-log/event-sourcing system for compliance-heavy data | 🔥🔥 |
| Design a search feature backed by Elasticsearch integrated with a NestJS backend | 🔥 |

---

## 15. Real-World Scenario Questions

Behavioral-technical hybrids — interviewers use these to probe production experience.

| Question | Priority |
|---|---|
| "Our API's p99 latency suddenly spiked 5x in production — walk me through your investigation." | 🔥🔥🔥 |
| "A background job is silently failing and duplicating charges to customers — how do you find and fix the root cause?" | 🔥🔥🔥 |
| "The Node.js process keeps restarting due to OOM in Kubernetes — how do you diagnose and fix it?" | 🔥🔥🔥 |
| "Two microservices' databases have drifted out of sync after a partial failure — how do you reconcile and prevent recurrence?" | 🔥🔥🔥 |
| "You need to add a new required field to an API used by multiple mobile app versions in production — how do you roll this out safely?" | 🔥🔥🔥 |
| "A third-party payment API is intermittently timing out — how do you make your integration resilient?" | 🔥🔥🔥 |
| "You inherit a legacy Express monolith with no tests and it needs a critical security patch — what's your approach?" | 🔥🔥 |
| "Your Kafka consumer group is falling behind (growing lag) — how do you diagnose and remediate?" | 🔥🔥🔥 |
| "A junior engineer wants to add a new external API call inside a hot request path — how do you coach them and what would you do instead?" | 🔥🔥 |
| "How would you migrate a live production database schema with zero downtime?" | 🔥🔥🔥 |
| "You're asked to reduce cloud infra costs by 30% for a Node.js backend without hurting reliability — what levers do you pull?" | 🔥🔥 |
| "How do you handle a situation where two services disagree on the source of truth for the same entity?" | 🔥🔥 |

---

## 16. Senior/Lead/Architect-Only Questions

These probe leadership, trade-off reasoning, and system-level ownership — expected at Staff/Lead/Architect level.

| Question | Priority |
|---|---|
| How do you evaluate and introduce a new technology (e.g., moving from REST to gRPC, or Express to NestJS) into an existing team/codebase? | 🔥🔥🔥 |
| How do you balance technical debt against feature delivery pressure as a lead? | 🔥🔥🔥 |
| How do you design for multi-region deployment and disaster recovery (RTO/RPO)? | 🔥🔥 |
| How do you approach an architecture review or design doc for a new service — what sections/considerations do you insist on? | 🔥🔥🔥 |
| How do you mentor engineers on writing testable, maintainable NestJS code (SOLID principles applied to modules/providers)? | 🔥🔥 |
| How do you decide "build vs. buy" for infrastructure pieces (e.g., build your own queue vs. use SQS)? | 🔥🔥 |
| How do you drive an incident postmortem process (blameless postmortems, action items, follow-through)? | 🔥🔥🔥 |
| How do you set and enforce API/service SLAs across teams? | 🔥🔥 |
| How do you approach capacity planning for an upcoming high-traffic event (e.g., a sale/launch)? | 🔥🔥 |
| How do you structure a codebase/monorepo for multiple NestJS microservices with shared libraries (Nx, Turborepo)? | 🔥🔥 |
| How do you make the call between a modular monolith and full microservices for a mid-size team (avoiding premature distributed-systems complexity)? | 🔥🔥🔥 |
| How do you ensure security and compliance (SOC2/GDPR) are built into the architecture rather than bolted on? | 🔥🔥 |

---

## 17. Final Interview Preparation Priority

If you only have limited time before the interview, focus in this order:

### Must master (🔥🔥🔥 core, ~2-3 days)
1. Node.js event loop, libuv, async patterns, worker threads/cluster
2. NestJS request lifecycle: Middleware → Guards → Interceptors → Pipes → Filters, and DI/provider scopes
3. JWT auth flow end-to-end + refresh token rotation + RBAC
4. Database transactions, isolation levels, N+1 problem, locking
5. Caching strategies with Redis + cache invalidation/stampede
6. Message queues (Kafka/RabbitMQ) + idempotency + DLQ
7. One or two system design problems fully whiteboarded (e.g., rate limiter, order system, chat app)
8. Security basics: mass assignment, injection prevention, secrets management, CORS
9. Be ready with 2-3 real production incident stories (STAR format: situation, root cause, fix, prevention)

### Should know well (🔥🔥, ~1-2 days)
10. Microservices patterns: Saga, outbox, circuit breaker, API gateway
11. Testing strategy in NestJS (unit/integration/e2e, mocking providers)
12. Performance/scalability: horizontal scaling, load balancing, profiling
13. Structured logging, distributed tracing, correlation IDs
14. REST API design: pagination, versioning, idempotency, error schema

### Good to have (🔥, if time permits)
15. GraphQL/gRPC trade-offs, CQRS, event sourcing
16. Multi-region/DR architecture, capacity planning
17. Monorepo tooling (Nx/Turborepo) for microservices

### Interview-day tips
- For system design questions, **always clarify requirements and scale first** (traffic, data size, consistency needs) before jumping into a solution.
- For "explain X" questions, structure your answer as: **definition → why it matters → a concrete example from your own experience → trade-offs**.
- For scenario questions, use **STAR** (Situation, Task, Action, Result) and always mention what you'd do differently or how you prevented recurrence.
- Since you're senior/lead-track, expect interviewers to probe **trade-off reasoning** more than syntax — practice saying "it depends on X, Y, Z" and then committing to a recommendation.
