# Prisma & PostgreSQL Setup Guide

This guide explains how we have configured Prisma to connect with our PostgreSQL database. We are using **Prisma 7**, which introduces Driver Adapters (like `@prisma/adapter-pg`) for optimized database connections.

If someone new is setting up the project, or if you are setting this up from scratch, follow these steps.

## 1. Environment Variables

First, you need a PostgreSQL connection string. Prisma looks for a variable called `DATABASE_URL` in your `.env` file.

Create a `.env` file in the `backend` directory (if it doesn't exist) and add your connection string:

```env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/my_database_name"
```

## 2. Dependencies Setup

We use the native `pg` driver alongside Prisma for the best performance and compatibility. If setting up from scratch, these are the dependencies we installed:

```bash
# Install the core Prisma CLI and database driver
npm install prisma pg @prisma/adapter-pg

# Install the Prisma Client
npm install @prisma/client
```

## 3. The Prisma Schema (`prisma/schema.prisma`)

The `schema.prisma` file is the heart of your database configuration. It tells Prisma two things:
1. What database you are connecting to.
2. Where to save the generated TypeScript code.

Here is how our configuration looks at the top of `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  // We generate the client directly into our src folder for easier imports
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql" // Tells Prisma we are using Postgres
}
```

*Below this block is where we define all our tables (Models), such as `User`, `Category`, `Product`, etc.*

## 4. Generating the Client and Syncing Database

Once your `.env` is set and your schema is ready, you need to sync it with your database. 

Run this command in the terminal (inside the `backend` folder):
```bash
npx prisma migrate dev --name init
```
This single command does the magic:
- It connects to your PostgreSQL database.
- It creates the tables based on your schema.
- It automatically runs `npx prisma generate`, which builds all the TypeScript types and saves them to `src/generated/prisma`.

## 5. Connecting to the Database in Code

Because we are using Prisma 7 with a custom output directory, we do not initialize Prisma the "old way". Instead, we use the `@prisma/adapter-pg` driver. 

Here is exactly how we establish the connection in our server or controllers:

```typescript
// 1. Load environment variables
import "dotenv/config";

// 2. Import the Driver Adapter
import { PrismaPg } from "@prisma/adapter-pg";

// 3. Import the Prisma Client from our CUSTOM generated folder
import { PrismaClient } from "./generated/prisma"; 
// Note: In controllers, the path might be "../generated/prisma/client.js"

// 4. Initialize the Driver Adapter with your DATABASE_URL
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// 5. Connect Prisma using the adapter!
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### Why do we use `@prisma/adapter-pg`?
In modern Prisma versions, using a driver adapter allows Prisma to leverage the mature, battle-tested `pg` connection pool under the hood. It makes the connection more stable, reduces memory usage, and makes it easier to deploy to edge environments if needed later.

## Quick Cheat Sheet for Everyday Use

- **Changed the schema?** Run `npx prisma migrate dev --name your_change_name`
- **Need to view your data?** Run `npx prisma studio` to open a local admin dashboard.
- **Wiped your node_modules?** Run `npx prisma generate` to rebuild the TypeScript client.
