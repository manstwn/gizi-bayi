# Sistem Pendukung Keputusan (SPK) Gizi Balita

Sistem Pendukung Keputusan Penentuan Status Gizi Balita Menggunakan Metode **Fuzzy Mamdani** di Posyandu Sari Kemuning.

A full-stack web application designed to help Posyandu volunteers monitor and classify toddler nutrition status based on Weight, Height, and Age.

---

## 📁 Repository Structure

This is a monorepo containing both the frontend and backend of the system:

- **[frontend/](./frontend)**: React 19 + Vite + Tailwind CSS 4
- **[backend/](./backend)**: Node.js + Express + SQLite (Sequelize)
- **[PRD.md](./PRD.md)**: Product Requirements Document (Full project documentation)
- **[BACKEND-API-DOCS.md](./BACKEND-API-DOCS.md)**: Detailed API specification

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Quick Setup (Fresh Clone)

#### Backend Setup:
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

#### Frontend Setup:
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

---

## 🧪 Fuzzy Mamdani Logic

The system uses three input variables:
1. **Berat Badan (BB)**: Berat badan balita dalam kilogram.
2. **Tinggi Badan (TB)**: Tinggi badan balita dalam centimeter.
3. **Umur**: Umur balita dalam bulan.

**Output Categories:**
- Gizi Buruk
- Gizi Kurang
- Gizi Baik
- Gizi Lebih

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **Recharts** for nutrition trend visualization
- **Axios** for API requests

### Backend
- **Express.js** as the web server
- **Sequelize ORM** with **SQLite**
- **JWT** & **bcryptjs** for secure authentication
- **Fuzzy Inference System** (Custom Mamdani Implementation)

---

## 👥 Contributors
- **Posyandu Sari Kemuning Team**

## 📄 License
This project is for academic/research purposes (Skripsi).
