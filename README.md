# Travel CRM - AI-Powered Booking Management

A modern, full-stack CRM designed for travel agencies. This application streamlines the booking process with automated travel information extraction and a robust data hierarchy.

## 🚀 Key Features

- **AI-Powered Extraction**: Automatically extracts destination cities, travel dates, and traveler counts from natural language requirements.
- **Smart Data Hierarchy**: Prioritizes manual input (Primary Flight Details) while falling back to AI-extracted data for a seamless UI.
- **Auto-Status Management**: Automatically promotes bookings to "Booked" status when traveler details and payments are finalized.
- **B2B & B2C Workflows**: Specialized handling for agent-led (B2B) and direct (B2C) bookings.
- **Dynamic Dashboard**: Real-time tracking of recent bookings, lead conversions, and agent performance.

## 🛠 Tech Stack

### Backend
- **Core**: Node.js & Express (TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **NLP Libraries**: `chrono-node` (Date detection), `compromise` (Place/Entity detection)
- **Authentication**: JWT & bcryptjs

### Frontend
- **Framework**: React 18 (TypeScript) with Vite
- **State Management**: TanStack Query (React Query)
- **Table System**: TanStack Table
- **Styling**: Tailwind CSS & Modern Glassmorphism UI
- **Forms**: React Hook Form + Zod

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   cd travel-crm-backend && npm install
   cd ../frontend && npm install
   ```

2. **Backend Configuration**
   - Create a `.env` file in `travel-crm-backend/` based on `.env.example`.
   - Set your `MONGODB_URI` and `JWT_SECRET`.

3. **Seeding (Optional)**
   ```bash
   cd travel-crm-backend
   npm run seed
   ```

4. **Run Development Mode**
   From the root directory:
   ```bash
   npm run dev
   ```

## 📖 Documentation for Developers

For a deep dive into the architecture, AI extraction logic, and data hierarchy, please refer to the [DEVELOPER_DOCS.md](DEVELOPER_DOCS.md).

## 🤝 Contributing
Please ensure you maintain the HSL color palette and modern UI aesthetics when adding new components. All backend routes must be protected with the `protect` middleware.
