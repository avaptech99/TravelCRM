# External Integrations

This document detail the external services, APIs, and cross-system integrations used in the Travel CRM.

## 🗄️ Database: MongoDB
The application uses **MongoDB** as its primary data store, managed via the **Mongoose** ODM.
- **Connection**: Configured in `travel-crm-backend/src/config/db.ts` (or equivalent).
- **Models**: Defines schemas for `Booking`, `User`, `Customer`, etc.

## 📡 Messaging: Socket.io
Real-time communication is handled through **Socket.io**.
- **Real-time Updates**: Notifying the frontend of status changes, new bookings, or payment recordings without page refreshes.
- **Server Implementation**: `travel-crm-backend/src/socket.ts`.

## 🤖 AI Travel Information Extraction
A specialized utility parses natural language travel requirements into structured data.
- **Core Libraries**: `chrono-node` (dates), `compromise` (locations/nouns).
- **Entry Points**: Triggered during booking creation or requirement updates in `bookingController.ts`.

## 🌐 WordPress Integration
The system includes PHP bridge scripts for integrating with WordPress-based lead or data sources.
- **Files**: `wordpress_integration_all data.php`, `wordpress_integration_v5.php`.
- **Flow**: These scripts likely facilitate the push/pull of booking data between the CRM and a WordPress site.

## 🔐 Authentication Layer
Stateless authentication is implemented using **JWT**.
- **Provider**: Internal custom implementation using `jsonwebtoken`.
- **Strategy**: Bearer token pattern for securing API endpoints.
