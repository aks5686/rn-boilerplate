# rn-boilerplate

![React Native](https://img.shields.io/badge/React%20Native-0.86.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![iOS & Android](https://img.shields.io/badge/platform-iOS%20%26%20Android-lightgrey)
![Node](https://img.shields.io/badge/Node-22%2B-339933?logo=node.js)
![License](https://img.shields.io/badge/license-MIT-green)
[![RN CI](https://github.com/aks5686/rn-boilerplate/actions/workflows/rn.yml/badge.svg)](https://github.com/aks5686/rn-boilerplate/actions/workflows/rn.yml)

Production-ready React Native boilerplate with Clean Architecture, MVVM, TypeScript, async/await and GitHub Actions CI/CD.

## Getting Started

1. Click [**Use this template**](https://github.com/aks5686/rn-boilerplate/generate) on GitHub.
2. Clone your repo locally:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```
3. Run:
   ```bash
   ./setup.sh YourAppName
   ```
4. Run the app:
   ```bash
   npm run ios
   ```
   ```bash
   npm run android
   ```

## Available Scripts

| Script | What it does |
| --- | --- |
| `npm run ios` | Installs dependencies, runs `pod install`, launches the iOS app |
| `npm run android` | Installs dependencies, launches the Android app |
| `npm run clean` | Removes `node_modules`, `Pods`, `Podfile.lock`, and Metro/Gradle caches |
| `npm run start` | Starts the Metro bundler only |

## Architecture

This boilerplate follows **Clean Architecture** with an **MVVM** presentation layer, organized as vertical feature slices under `src/features`. Dependencies always point inward — the UI depends on the domain, never the reverse.

```
┌─────────────────────────────────────────────┐
│  Presentation  (Screens + ViewModels)        │  React components, Zustand stores
├─────────────────────────────────────────────┤
│  Domain        (UseCases + Protocols)        │  Business rules, validation, pure TS
├─────────────────────────────────────────────┤
│  Data          (Repositories)                │  API DTOs ↔ domain models, persistence
├─────────────────────────────────────────────┤
│  Core          (Network, Storage, Utils)     │  Cross-cutting infrastructure
└─────────────────────────────────────────────┘
```

- **Presentation** — Screens (`.tsx`) are dumb views. Each screen reads state from and dispatches intents to a **ViewModel**, which is a [Zustand](https://github.com/pmndrs/zustand) store. No business logic lives in components.
- **Domain** — `UseCase` classes implement a `Protocol` (interface) and hold all business rules (validation, orchestration). They depend only on repository interfaces, never on Axios or Keychain directly, which keeps them trivially unit-testable.
- **Data** — `Repository` classes talk to the network layer and secure storage, and translate wire-format DTOs into domain models.
- **Core** — Shared infrastructure: the Axios-based `NetworkClient` (interceptors, retries, typed errors), `SecureStorage` (Keychain-backed token storage), and dependency-free array/string extension utilities.
- **DI** — `src/di/AppModule.ts` is a hand-written, lazily-instantiated singleton container. There is no reflection-based DI framework (no Hilt, no InversifyJS) — the dependency graph is small and static enough that explicit wiring is easier to read and debug, and it makes swapping in test doubles (`AppModule.override(...)`) trivial.
- **State management** — [Zustand](https://github.com/pmndrs/zustand) only. No Redux, no Context-based global state.

## Folder Structure

```
.
├── android/                       # Native Android project
├── ios/                           # Native iOS project
├── setup.sh                       # Renames the project (Boilerplate -> YourAppName)
├── src/
│   ├── core/
│   │   ├── network/
│   │   │   ├── NetworkClient.ts   # Axios client: auth header injection, 401 refresh flow, retries
│   │   │   └── ApiError.ts        # Typed error hierarchy for all network failures
│   │   ├── storage/
│   │   │   └── SecureStorage.ts   # react-native-keychain wrapper for tokens
│   │   └── extensions/
│   │       ├── arrayExtensions.ts # unique, chunk, groupBy, sortBy, partition, ...
│   │       └── stringExtensions.ts# isValidEmail, slugify, toCamelCase, ...
│   ├── di/
│   │   └── AppModule.ts           # Manual DI container (lazy singletons)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── domain/             # AuthUseCaseProtocol, AuthUseCase
│   │   │   ├── data/                # AuthRepository, MockAuthRepository
│   │   │   └── presentation/        # LoginViewModel (Zustand), LoginScreen (View)
│   │   └── home/
│   │       └── presentation/        # HomeScreen (View)
│   ├── designSystem/
│   │   ├── colors.ts               # Color tokens
│   │   ├── typography.ts           # Type scale tokens
│   │   └── spacing.ts              # Spacing / radius / layout tokens
│   └── navigation/
│       └── AppNavigator.tsx        # React Navigation root stack
├── App.tsx
└── package.json
```

Add new features under `src/features/<feature>/{domain,data,presentation}`, following the same pattern as `auth`.

## Usage Guide

### Adding a new feature

1. **Domain** — define a `Protocol` interface and models in `domain/`, then an implementing `UseCase` class holding validation/business rules.
2. **Data** — implement a `Repository` that satisfies the use case's dependencies, mapping API DTOs to domain models.
3. **DI** — register lazy getters for the repository and use case in `src/di/AppModule.ts`.
4. **Presentation** — create a Zustand store (`XyzViewModel.ts`) that calls `AppModule.xyzUseCase`, and a screen component that only reads/dispatches to that store.
5. **Navigation** — register the screen in `src/navigation/AppNavigator.tsx`.

### Networking

All API calls should go through `AppModule.networkClient` (or a repository that wraps it). It already handles:

- Attaching the access token from `SecureStorage`
- Retrying idempotent (`GET`/`HEAD`) requests on transient/5xx failures with exponential backoff
- A single in-flight token refresh on `401`, queuing nothing else — failed refresh triggers `onUnauthorized`
- Normalizing every failure into an `ApiError` with a `type`, `statusCode`, and `isRetryable` flag

### Testing

```bash
npm test        # Jest unit tests
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
```

`AppModule.override({...})` lets you inject fakes for `networkClient`, `authRepository`, or `authUseCase` in tests; call `AppModule.reset()` in `afterEach`.

## CI/CD

`.github/workflows/rn.yml` runs on every push/PR to `main` with three parallel jobs: **lint** (ESLint), **typecheck** (`tsc --noEmit`), and **test** (Jest with coverage).

## License

[MIT](./LICENSE)
