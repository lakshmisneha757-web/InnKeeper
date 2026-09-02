# 🏨 InnKeeper

**InnKeeper** is a modern, full-stack **Motel & Hotel Management Application** designed to simplify room bookings, customer management, front-desk operations, and administrative tasks.

---

## 🚀 Features

* 🔐 **Authentication & Authorization**
  Secure JWT-based authentication for admins and staff.

* 🛏️ **Room & Inventory Management**
  Track room availability, pricing, and maintenance status.

* 📅 **Reservations & Booking**
  Manage reservations, check-ins, check-outs, and guest details.

* 📊 **Dashboard & Analytics**
  Monitor occupancy, reservations, and operational insights.

---

## 🛠️ Tech Stack

### Frontend

| Technology            | Purpose                  |
| --------------------- | ------------------------ |
| React                 | Frontend framework       |
| Vite                  | Development & build tool |
| Tailwind CSS          | Styling                  |
| Radix UI              | UI components            |
| React Router / Wouter | Routing                  |
| TanStack React Query  | Server-state management  |
| Zustand               | Client-state management  |

### Backend

| Technology | Purpose             |
| ---------- | ------------------- |
| Node.js    | Runtime environment |
| Express.js | Backend framework   |
| Prisma ORM | Database ORM        |
| PostgreSQL | Database            |
| JWT        | Authentication      |
| bcryptjs   | Password hashing    |

---

## 📁 Repository Structure

```text
InnKeeper/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

> **Note:** `.env` files and `node_modules` are intentionally excluded from the repository for security and performance reasons.

---

# 🔧 Getting Started

Follow the steps below to run InnKeeper locally.

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/InnKeeper.git
cd InnKeeper
```

---

## 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

### Create Backend Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/innkeeper_db?schema=public"
JWT_SECRET="your_secret_key"
```

> ⚠️ Do not commit the `.env` file to GitHub.

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Run Database Migrations

```bash
npm run prisma:migrate
```

### Start the Backend Server

```bash
npm run dev
```

The backend server will run on:

```text
http://localhost:5000
```

---

# 3. Frontend Setup

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

### Create Frontend Environment Variables

Create a `.env` file inside the `frontend` folder.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> ⚠️ Do not commit the `.env` file to GitHub.

### Start the Frontend

```bash
npm run dev
```

The frontend will be available at the URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

# 📜 Scripts Reference

## Backend

Run these commands from the `backend/` directory.

| Command                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Starts the backend server with hot reload    |
| `npm run start`           | Starts the backend server in production mode |
| `npm run prisma:generate` | Generates the Prisma client                  |
| `npm run prisma:migrate`  | Runs database migrations                     |

## Frontend

Run these commands from the `frontend/` directory.

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Starts the Vite development server    |
| `npm run build`   | Builds the application for production |
| `npm run preview` | Previews the production build locally |

---

# 🔐 Environment Variables

The project uses environment variables for configuration and sensitive information.

### Backend `.env`

```env
PORT=5000
DATABASE_URL="your_postgresql_database_url"
JWT_SECRET="your_jwt_secret"
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Never commit actual passwords, database credentials, JWT secrets, or API keys to GitHub.**

---

# 🗄️ Database

InnKeeper uses:

* **PostgreSQL** as the database
* **Prisma ORM** for database management

After configuring the PostgreSQL database, run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

from the `backend/` directory.

---

# ▶️ Running the Complete Application

You need **two terminals**.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the frontend URL provided by Vite in your browser.

---

# 🔒 Git & Security

The following files and folders should **not** be committed to GitHub:

```text
node_modules/
.env
.env.*
dist/
build/
```

Make sure they are included in your `.gitignore` file.

---

# 👨‍💻 Project

**InnKeeper — Motel & Hotel Management System**

Built using **React, Vite, Node.js, Express.js, Prisma, and PostgreSQL**.
