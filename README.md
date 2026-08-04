# MathBuddy 🧮

MathBuddy is a professional full-stack web application designed for managing private tutoring and academic preparation services. It acts as a comprehensive platform for Administrators, Teachers, and Students, handling everything from complex scheduling and matchmaking to financial tracking, hour packages, and academic progress.

Built with a **Modular Monolithic** architecture in a `pnpm` workspace, MathBuddy enforces explicit business rules for scheduling, payments, roles, and academic records to ensure transactional consistency and real-time reliability.

---

## ✨ System Modules & Features

### 1. Identity & Role-Based Access
- **Authentication**: Stateless, secure JWT-based authentication stored in http-only cookies.
- **Roles**: Strict segregation between `ADMIN`, `TEACHER`, and `STUDENT`.
- **Role Guards**: Backend endpoints and frontend routes are strictly protected by role-based guards, preventing unauthorized access or data exposure (IDOR protection).

### 2. Core Scheduling & Matchmaking Engine
- **Availability Management**: Interactive calendars allow Teachers and Students to set their weekly availability. Includes smart replication tools to roll over availability to future weeks/months.
- **Automated Matchmaking**: When a student requests a class, the system cross-references Student and Teacher availability, ensuring teachers are explicitly authorized to teach the requested course before proposing matches.
- **Advanced Schedule Editing (Admins & Teachers)**:
  - **Admins** can freely drag, modify, or add new blocks using an interactive calendar, dynamically adding or refunding hours.
  - **Teachers** can safely edit their students' schedules. Strict constraints ensure they cannot delete schedules or change the total hour package (they must fully reassign 100% of the hours).
- **Conflict Prevention**: Strict backend validation prevents double-booking, timezone mismatches, and overlapping classes.

### 3. Financial Ledger & Hour Packages
- **Exact Minute Precision**: Hour packages are tracked in exact minutes (integer) instead of floating-point values to ensure financial accuracy.
- **Manual Payments**: Admins can register and verify student payments, automatically generating the corresponding hour packages.
- **Transactional Consistency**: Class creation safely consumes hours. Deleting or reducing schedules processes automatic `REFUND` transactions back to the student's balance.

### 4. Real-Time Communications
- **Global Chat (`/messages`)**: Full-page modern chat interface built natively using WebSockets (`socket.io`).
- **Role-Based Directories**: Safe, restricted directories where students can only chat with their assigned teachers/admins. Admins have global access.
- **Real-Time Notifications**: Automated system notifications appear instantly via WebSockets when schedules are edited, requested, or deleted.

### 5. Academic Catalog
- **Hierarchy**: Configurable academic hierarchy (`Program -> Course -> Topic`).
- **Teacher Assignment**: Admins explicitly authorize which teachers can teach which courses, ensuring quality control.

---

## 👥 How to Use the Modules (Role Workflows)

### 👑 Administrator Workflow
1. **Catalog Setup**: Go to *Academic Programs* and create Programs (e.g., "SAT Prep") and Courses (e.g., "SAT Math").
2. **User Management**: Register new Teachers and Students.
3. **Course Assignment**: Go to a Teacher's profile and assign them to specific courses they are qualified to teach.
4. **Payments & Packages**: When a student pays, go to their profile and register a manual payment to add hours to their balance.
5. **Schedule Management**: Go to the *Schedule* tab to view global requests, resolve conflicts, create manual classes, or audit *Teacher Edited* schedules.

### 🎓 Teacher Workflow
1. **Availability**: Navigate to *Schedule* and set your weekly availability blocks. Use the "Replicate" button to easily copy your schedule to future weeks.
2. **Review Classes**: View your upcoming scheduled sessions.
3. **Edit Schedules**: Click on a student's session to edit it. You can move blocks around within the package limits, but you must assign all hours before saving.
4. **Class Links**: Add Zoom/Google Meet links to your upcoming classes so students can join.
5. **Chat**: Use the *Messages* tab to communicate with your assigned students or admins.

### 🧑‍🎓 Student Workflow
1. **Availability**: Set the times you are available to take classes.
2. **Request Classes**: Use your available hour balance to request classes for specific courses. The system will match you with available teachers.
3. **Join Classes**: View your dashboard for upcoming sessions and click the provided meeting links to join your class.
4. **Chat**: Contact your assigned teachers directly for academic help.

---

## 🛠️ Technology Stack

Built as a **modular monolith** within a `pnpm` workspace monorepo.

**Frontend (`apps/web`)**
- Next.js (App Router)
- React & TypeScript
- Tailwind CSS & shadcn/ui
- Base UI Components
- Recharts (Data Visualization)
- React Hook Form & Zod
- Zustand (Client State)

**Backend (`apps/api`)**
- NestJS
- TypeScript
- REST API architecture & WebSockets
- JWT Authentication

**Database (`packages/database`)**
- PostgreSQL
- Prisma ORM

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- `pnpm` (v9+)
- Docker & Docker Compose (for the local database)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/MathBuddy.git
   cd MathBuddy
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the local database**
   ```bash
   docker-compose up -d postgres
   ```

4. **Initialize the database & seed data**
   ```bash
   pnpm --filter database exec prisma db push
   pnpm --filter database exec tsx src/seed.ts
   ```
   *This creates the default users and catalog for testing.*

5. **Start the development servers**
   ```bash
   pnpm dev
   ```
   *This command starts both the NestJS backend on `:3001` and the Next.js frontend on `:3000` concurrently.*

### 🔑 Test Accounts
The `seed.ts` script generates the following test accounts (Password for all: `Admin123!`):
- **Admin**: `admin@mathbuddy.com`
- **Teacher**: `teacher@mathbuddy.com`
- **Student**: `student@mathbuddy.com`

---

## 📁 Repository Structure

```
MathBuddy/
├── apps/
│   ├── web/                # Next.js Frontend App
│   └── api/                # NestJS Backend API
├── packages/
│   ├── database/           # Prisma schema, migrations, and seeds
│   ├── contracts/          # Shared DTOs and types (Zod/TypeScript)
│   ├── config/             # Shared ESLint/TypeScript configs
│   └── ui/                 # (Optional) Shared UI components
├── docker-compose.yml      # Local development database
├── docker-compose.prod.yml # Production deployment stack
└── DEPLOYMENT.md           # Production deployment guide
```

---

## 🔐 Security Considerations
- **IDOR Protection**: All endpoints verify that the `req.user.sub` matches the requested resource unless the user is an `ADMIN`.
- **Headers**: The API uses `helmet` for HTTP security headers and strictly configures CORS to the frontend domain.
- **Data Sanitization**: Sensitive fields like passwords and refresh tokens are excluded from Prisma responses via DTOs.
- **Transactions**: Financial and hour-related operations are strictly enclosed within Prisma Transactions (`$transaction`) to prevent race conditions.
- **Environment**: Production deployments must override all default secrets in `.env`.

---

## 📜 License
This project is proprietary and confidential. Unauthorized copying of files in this repository, via any medium, is strictly prohibited.
