# SPK Gizi Balita - Frontend

Frontend for **Sistem Pendukung Keputusan Penentuan Status Gizi Balita Menggunakan Metode Fuzzy Mamdani**.

## 🎨 Design & Tech Stack

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Networking**: Axios
- **Routing**: React Router Dom 7

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page layouts (Dashboard, Balita, etc.)
│   ├── layouts/        # Layout wrappers (Sidebar, Navbar)
│   ├── assets/         # Static assets (images, fonts)
│   ├── services/       # API integration
│   └── App.jsx         # Main application component
├── public/             # Static public assets
├── .env                # Environment variables (private)
├── .env.example        # Environment variables template
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
   *Note: Ensure `VITE_API_URL` points to your running backend.*

3. Run the application:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

## ✨ Features

- **Responsive Dashboard**: Overview of nutrition status statistics.
- **Management System**: Easy interface to manage toddler data and examination records.
- **Fuzzy Status**: Real-time display of nutrition classification results.
- **Visual Analytics**: Interactive charts for monitoring growth trends.
- **Modern UI**: Clean and intuitive interface built with Tailwind CSS.
