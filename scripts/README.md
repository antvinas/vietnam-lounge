# Scripts

This directory contains various scripts for automating tasks, managing data, and other operational needs.

## Subdirectories

- **/seed**: Contains scripts for seeding the database with initial data.
- **/tools**: Contains utility scripts for various maintenance tasks.

## Usage

These scripts are managed as `pnpm` scripts within the `functions` workspace. To run them, use the `--filter` flag to target the `functions` package.

**Seed Scripts:**

- To seed the database with initial spot data:
  ```bash
  pnpm --filter functions seed:spots
  ```

- To seed the database with community board categories:
  ```bash
  pnpm --filter functions seed:boards
  ```

**Tool Scripts:**

- To migrate or update slugs for content:
  ```bash
  pnpm --filter functions tool:migrate-slugs
  ```

Make sure you are in the root of the monorepo when running these commands.
