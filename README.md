<div align="center">

<h1>✂️ SalonBook</h1>

<p><b>Explore salon services, book appointments and pay securely online</b></p>

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p>
  <a href="https://salonbook-mocha.vercel.app/"><b>🌐 Live Website</b></a> &nbsp;•&nbsp;
  <a href="https://salonbook-api-three.vercel.app/"><b>⚙️ Live API</b></a> &nbsp;•&nbsp;
  <a href="https://github.com/Kowshikkantidasbd/SalonBook"><b>💻 Client Repo</b></a> &nbsp;•&nbsp;
  <a href="https://github.com/Kowshikkantidasbd/SalonBook-api"><b>🗄 Server Repo</b></a>
</p>

</div>

---

## 📖 Description

SalonBook lets customers explore salon services, request appointments and pay for confirmed ones with Stripe. The salon admin manages services, appointments, customers and payments from a dashboard.

This repository is the **client** built with Next.js. The [server](https://github.com/Kowshikkantidasbd/SalonBook-api) is a separate repository.

> **Quick links:** [Features](#-important-features) · [Tech Stack](#-technology-stack) · [Pages](#-pages-and-roles) · [How It Works](#-how-it-works) · [Run Locally](#-how-to-run-locally) · [Environment](#-required-environment-variables) · [Deployment](#-deployment-vercel)

---

## ✨ Important Features

<table>
<tr>
<td width="33%" valign="top">

**🌐 Public**
- Home with banner, featured services, categories and an extra section
- Browse Services with search, category filter and price sorting
- Sign In and Sign Up (email/password and Google)
- Password: 6+ characters, one uppercase, one lowercase

</td>
<td width="33%" valign="top">

**🧑 Customer**
- Protected service details page
- Appointment form (date, time slot, message)
- My Appointments: view, cancel pending, **Pay Now** for confirmed
- Payment success and cancel pages
- Profile management

</td>
<td width="33%" valign="top">

**🛠 Admin**
- Overview statistics
- Manage services with image upload and active/inactive status
- Confirm or cancel appointments
- Block or unblock users
- View transactions

</td>
</tr>
</table>

**🎨 General:** role-based protected routes and sidebar, navbar that updates right after login/logout, footer with contact information, address, opening hours and social links, responsive layout, loading states, toast notifications and error pages (no browser `alert()`).

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Auth | Better Auth client |
| Styling | Tailwind CSS |
| Payments | Stripe Checkout (status confirmed by the server webhook) |
| Hosting | Vercel |

## 🧭 Pages and Roles

| Access | Pages |
|---|---|
| 🌍 Public | Home, Browse Services, Sign In, Sign Up |
| 🔒 Signed in | Service Details (`/services/[id]`), Dashboard |
| 🧑 Customer | Overview, My Appointments, My Profile |
| 🛠 Admin | Overview, Manage Services, Add/Update Service, Manage Appointments, Manage Users, Transactions, My Profile |

Customers cannot open admin pages and admins cannot open customer pages, even by changing the URL. The server also verifies roles on every protected API.

## 🔄 How It Works

| Step | What happens |
|:-:|---|
| 1 | Customer browses services and opens one (sign in required) |
| 2 | Customer submits an appointment request: status `pending`, payment `unpaid` |
| 3 | Admin confirms or cancels the request |
| 4 | Customer clicks **Pay Now** on a confirmed appointment and goes to Stripe Checkout |
| 5 | Stripe sends a verified webhook to the server, which marks the payment `paid` and saves the transaction |
| 6 | Customer returns to the Payment Success page |

---

## 📦 Installation

```bash
git clone https://github.com/Kowshikkantidasbd/SalonBook.git
cd SalonBook
npm install
```

## ▶️ How to Run Locally

Start the [server](https://github.com/Kowshikkantidasbd/SalonBook-api) first, then:

```bash
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:3000
```

<details>
<summary><b>Other commands</b></summary>

```bash
npm run lint
npm run build
npm start
```

</details>

## 🔐 Required Environment Variables

Names only. Never commit `.env` files or real secret values.

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Server base URL without a trailing `/` or `/api`. Local example: `http://127.0.0.1:5000`. All `/api/*` requests are proxied to it |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (public by design) |

## 🚀 Deployment (Vercel)

1. Import the repository in Vercel.
2. Add the environment variables for Production. Set `BACKEND_URL` to `https://salonbook-api-three.vercel.app`.
3. **Redeploy** after any environment variable change, because rewrites are built at build time.
4. Reload dashboard routes and check that login persists after refresh.

## 👤 Admin Access

Admin accounts cannot be created through public sign-up. Evaluation credentials are shared separately and are never stored in this repository.

---

<div align="center">
  Made with ❤️ for SalonBook
</div>