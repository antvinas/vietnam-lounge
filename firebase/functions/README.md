# Firebase Functions

This directory contains the source code for all Cloud Functions deployed to Firebase. The functions are written in TypeScript and organized by their trigger type and domain.

## Directory Structure

- `src/`
  - `api/`: Express-based API endpoints. Each file typically represents a REST resource (e.g., `spots.ts`, `users.ts`).
  - `triggers/`: Background functions triggered by events (e.g., `auth.ts` for user creation, `firestore.ts` for database changes).
  - `services/`: Shared business logic and integrations with external services (e.g., `BadWords.service.ts`).
  - `middlewares/`: Express middleware for tasks like authentication (`requireAuth.ts`) and authorization (`requireAdmin.ts`).
  - `utils/`: Utility functions, such as logging (`logger.ts`) and type definitions (`types.ts`).
  - `index.ts`: The main entry point that exports all the functions for deployment.

## Deployment

To deploy the functions, use the Firebase CLI from the root of the `firebase` directory.

```bash
cd firebase
firebase deploy --only functions
```

Ensure you have the necessary environment variables and configuration set up before deployment.
