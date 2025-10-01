# Vietnam Lounge - Monorepo

Welcome to the Vietnam Lounge project! This is a monorepo containing the web application and its backend services.

## Packages

This monorepo is managed with `pnpm` workspaces and includes the following packages:

- **`apps/web`**: A React-based front-end application for users to discover spots, engage in the community, and plan their trips. For more details, see the [web app's README](./apps/web/README.md).

- **`firebase/functions`**: A set of Cloud Functions that power the backend API, handle background tasks, and manage business logic. For more details, see the [functions README](./firebase/functions/README.md).

## Getting Started

1. **Install Dependencies**: From the root of the project, run:
   ```bash
   pnpm install
   ```

2. **Run Development Servers**:
   - To start the web application (front-end):
     ```bash
     pnpm --filter web dev
     ```
   - To start the Firebase emulators (for local backend development):
     ```bash
     pnpm --filter functions emulators
     ```

## Infrastructure

The project's infrastructure is managed as code. For more information, please refer to the [infrastructure README](./infra/README.md).

## Scripts

This project includes various utility scripts for tasks like database seeding and data migration. For more details, see the [scripts README](./scripts/README.md).
