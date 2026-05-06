# SPK Gizi Balita - Backend API

Backend for **Sistem Pendukung Keputusan Penentuan Status Gizi Balita Menggunakan Metode Fuzzy Mamdani**.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (managed with Sequelize ORM)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Development**: nodemon, dotenv

## 📁 Project Structure

```text
backend/
├── src/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Request handlers
│   ├── models/         # Sequelize models
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middlewares (auth, etc.)
│   ├── utils/          # Helper functions (Fuzzy Mamdani logic)
│   └── server.js       # Entry point
├── .env                # Environment variables (private)
├── .env.example        # Environment variables template
├── database.sqlite     # Local database file
└── package.json        # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Note: Update the `JWT_SECRET` in `.env` for security.*

3. Run the server:
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

The server will be running at `http://localhost:5000`.

## 🔑 Key Features

- **Authentication**: Secure login with JWT.
- **Data Management**: CRUD operations for Toddler (Balita) and Examination records.
- **Fuzzy Engine**: Implementation of Fuzzy Mamdani for nutrition status classification.
- **Reporting**: API endpoints for generating statistical data.

## 📝 API Documentation

*(Brief overview of main endpoints)*

- `POST /api/auth/login`: Authenticate user.
- `GET /api/balita`: Get all toddlers.
- `POST /api/pemeriksaan`: Submit new examination data (triggers fuzzy calculation).
- `GET /api/pemeriksaan/stats`: Get nutrition statistics.
