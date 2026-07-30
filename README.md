# rn-boilerplate

Production-ready React Native architecture boilerplate — Clean Architecture, MVVM, TypeScript (strict), Zustand, and GitHub Actions CI/CD. No Redux, no Hilt/DI frameworks — just plain TypeScript and a manual dependency container.

![React Native](https://img.shields.io/badge/React%20Native-0.86.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Zustand](https://img.shields.io/badge/State-Zustand-443E38)
![License](https://img.shields.io/badge/license-MIT-green)
[![RN CI](https://github.com/aks5686/rn-boilerplate/actions/workflows/rn.yml/badge.svg)](https://github.com/aks5686/rn-boilerplate/actions/workflows/rn.yml)

## Getting Started

### 1. Create a repo from this template

Click [**Use this template**](https://github.com/aks5686/rn-boilerplate/generate) to create a new repository under your account with a clean git history (no link back to this template repo).

### 2. Clone it locally

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 3. Commit before renaming

`setup.sh` renames files and folders throughout the project, so start from a clean working tree — commit or stash any local changes first. This also gives you a clear diff to review after renaming, and an easy point to revert to if something looks off.

### 4. Run the setup script

The app ships as `Boilerplate` / `com.aks.boilerplate`. Rename every occurrence — package.json, app.json, Android (`applicationId`, package folders, manifest, strings.xml) and iOS (Xcode project, scheme, bundle ID, `Info.plist`, `AppDelegate`) — with:

```bash
./setup.sh YourAppName
```

### 5. Run the app

iOS — installs npm deps, installs Ruby/CocoaPods gems, runs pod install, then launches the iOS app
```bash
npm run ios
```

Android — installs npm deps, then launches the Android app
```bash
npm run android
```

### Available scripts

| Script | What it does |
| --- | --- |
| `npm run ios` | `npm install`, then `bundle install`, then `pod install`, then builds and runs the iOS app |
| `npm run android` | `npm install`, then builds and runs the Android app |
| `npm start` | Starts the Metro bundler |
| `npm run clean` | Removes `node_modules`, `ios/Pods`, `ios/Podfile.lock`, `android/.gradle`, and stale Metro caches in `/tmp` — use when builds get into a bad state |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Runs `tsc --noEmit` |
| `npm test` | Runs the Jest test suite |

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
