# Project Overview

This is a Next.js application that serves as a Monitoring and Evaluation (M&E) platform for an organization. It provides a dashboard to visualize project data, manage projects, and handle user authentication. The application uses a Postgres database (managed by Supabase) for data storage and interacts with it through a data repository layer.

**Main Technologies:**

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Database:** Postgres (Supabase)
*   **Styling:** Tailwind CSS
*   **Authentication:** Cookie-based session authentication

**Architecture:**

The application follows a standard Next.js project structure.

*   `src/app`: Contains the main application pages and API routes.
*   `src/lib`: Contains the core application logic, including database interaction (`db.ts`, `dashboard-repository.ts`) and authentication (`auth-server.ts`).
*   `src/ui`: Contains reusable UI components.
*   `supabase`: Contains database migrations and seed data.

# Building and Running

**1. Database Setup:**

*   Install the Supabase CLI.
*   Link the project to your Supabase project: `supabase link --project-ref <your-project-ref>`
*   Push the database migrations: `supabase db push`

**2. Local Development:**

*   Install dependencies: `npm install`
*   Run the development server: `npm run dev`
*   The application will be available at `http://localhost:3000`.

**3. Building for Production:**

*   Run the build command: `npm run build`

**4. Testing:**

*   There are no explicit test scripts defined in `package.json`.

# Development Conventions

*   The project uses TypeScript for static typing.
*   ESLint is used for linting, with the configuration in `eslint.config.mjs`.
*   The code follows standard React and Next.js conventions.
*   Database queries are centralized in the `dashboard-repository.ts` file.
*   Authentication is handled in the `auth-server.ts` file.
