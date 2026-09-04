# InnKeeper 🏨

InnKeeper is a comprehensive Motel & Hotel Management Application designed to streamline front desk operations, booking management, customer records, and administrative workflows.

---

## 🏗 Project Architecture

This project is structured as a full-stack monorepo:

- **`backend/`**: Node.js & Express API server powered by Prisma ORM and PostgreSQL.
- **`frontend/`**: React application built with Vite, Tailwind CSS, Lucide Icons, and modern UI components.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + Radix UI
- **Routing:** React Router / Wouter
- **State Management & Data Fetching:** TanStack Query (React Query), Zustand

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database ORM:** Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL instance running locally or hosted

---

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd InnKeeper
```

### 2. Backend Setup
Navigate to the `backend` directory, install dependencies, and setup environment variables:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/innkeeper_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
```

Run database migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

---

## 📜 Available Scripts

### Backend (`backend/`)
- `npm run dev`: Starts the backend server in development mode using `nodemon`.
- `npm run start`: Runs the production server.
- `npm run prisma:generate`: Generates Prisma Client artifacts.
- `npm run prisma:migrate`: Applies database migrations.
- `npm run prisma:seed`: Seeds initial data into the database.

### Frontend (`frontend/`)
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the project for production.
- `npm run preview`: Previews the production build locally.

---

## 🛡 License

This project is proprietary and confidential.
