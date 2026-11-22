# SalonBook — Frontend Client

A responsive web application for **SalonBook**, a curated salon and beauty atelier reservation platform. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Lucide Icons**.

---

## 🌟 Features

- **Editorial Studio Experience**:
  - Immersive landing page featuring studio philosophy, curated treatments, signature stylists, and client testimonials.
  - Interactive service catalog with real-time category filtering, full-text search, and multi-parameter sorting.
- **Appointment Booking & Conflict Validation**:
  - Dynamic calendar date picker and time slot selector with immediate conflict checking.
  - Transparent pricing and service duration breakdowns.
- **Dedicated Dashboards**:
  - **Customer Dashboard**: Track appointment statuses (`pending`, `confirmed`, `completed`, `cancelled`), cancel pending bookings, review transaction histories, download receipts, and update user profiles.
  - **Admin Dashboard**: Comprehensive studio management overview, salon service catalog CRUD (add, edit, activate/deactivate, delete), appointment lifecycle controls (confirm, decline, complete, reschedule), and customer account management (block/unblock users).
- **Secure Stripe Checkout**:
  - Direct integration with verified Stripe Checkout.
  - Interactive payment success receipts and payment cancellation screens with automatic cache invalidation and state synchronization.
- **Authentication**:
  - Powered by Better Auth & JWT authentication with persistent storage fallback.
  - One-click Google Social Sign-In popup with seamless handoff.
  - Role-protected routes (`/dashboard`, `/profile`).
- **Modern UI / UX**:
  - Polished editorial aesthetic with custom typography (`Cormorant Garamond`, `Plus Jakarta Sans`, `JetBrains Mono`).
  - Toast notifications, confirmation modals, loading skeletons, and accessible status badges.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Icons**: Lucide React (`lucide-react`)
- **Animation**: Motion (`motion`)
- **TypeScript**: Strict type definitions for salon business rules and API contracts.

---

## 📋 Environment Variables

Create a `.env` or `.env.local` file inside the `frontend/` directory.

| Variable Name | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Optional | Direct API origin URL used by the browser (leave empty if using Next.js proxy rewrite) |
| `BACKEND_URL` | **Yes** (in production) | Backend origin URL for Next.js server-side API proxy rewrites (e.g. `https://salonbook-api.vercel.app` or `http://127.0.0.1:5000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for Google Sign-In popup |

> **Important for Vercel Deployment**: Ensure `BACKEND_URL` points to your production backend URL (e.g., `https://<backend-app>.vercel.app`) rather than `localhost`, so API rewrites route to your live backend.

---

## 🚀 Getting Started

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Type Check
```bash
npm run lint     # TypeScript strict compilation check
npm run build    # Production build
npm run start    # Start production server
```

---

## 🔗 Repository & Live Deployment Links

- **Client Repository**: [GitHub — SalonBook](https://github.com/Kowshikkantidasbd/SalonBook)
- **Server Repository**: [GitHub — SalonBook API](https://github.com/Kowshikkantidasbd/SalonBook-api)
- **Live Frontend Application**: `https://<your-frontend-deployment>.vercel.app`
- **Live Backend API**: `https://<your-backend-deployment>.vercel.app`
