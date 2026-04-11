# Vertex Banking Aggregator

Vertex is an enterprise-grade, FAANG-architected full-stack financial application that serves as a highly scalable Banking Aggregator. It empowers users to securely link their physical bank accounts via Plaid, instantly track expenses via interactive analytics, and securely fund operations internally utilizing Stripe.

![Vertex Banner](https://via.placeholder.com/1200x400?text=Vertex+Banking+Aggregator)

## 🚀 Key Features

*   **Plaid Integration:** Securely aggregates and syncs real-world transaction data, pulling metrics from hundreds of US banks.
*   **Stripe Secured Funding:** Deposits are strictly transacted via PCI-compliant Stripe PaymentElements with ACID-compliant double-entry logic handling the backend state.
*   **Enterprise Caching:** Implements an `ioredis` layer using **Cache-Aside** topology, gracefully falling back vertically through recursive db misses, with event-triggered namespace cache invalidation (`user:{id}:transactions`).
*   **Secure Authentication:** Zero-trust architecture guarded by bcrypt password hashing and rigorous JWT verification middleware.
*   **Production-Ready Containerization:** Completely decoupled architecture. Both frontend, backend, caching, and databases possess independent Docker abstractions managed smoothly via Docker Compose.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client)
*   **Framework:** React 18 / Vite 6
*   **Styling & Components:** Tailwind CSS, Radix UI primitives, shadcn/ui abstractions.
*   **External APIs:** `@stripe/stripe-js`, `lucide-react` forms.

### Backend (API Engine)
*   **Runtime:** Node.js 18
*   **Framework:** Express.js 
*   **Datastore Pipeline:** PostgreSQL (primary datastore) + Redis (high-read cache).
*   **Crucial Middleware:** Transactional Idempotency validation wrapper, raw exception capturing.

---

## 🐳 Quick Start: Docker Setup (Ideal Path)

This project has been meticulously optimized for immediate local execution requiring zero local environment dependencies other than Docker Desktop.

### 1. Environment Configurations
Clone the repository and ensure you possess `.env` files in both layers matching the schema requirements.
**`backend/.env`** Requirements:
```bash
JWT_SECRET=your_secret_key
PLAID_CLIENT_ID=your_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```
*(Backend also natively maps `postgres` and `redis` networks automatically via docker-compose)*

### 2. Up Spin
In the absolute root of the workspace, run the orchestration command:
```bash
docker-compose up --build -d
```
Docker will construct optimized Alpine Linux images for the React application, Node server, Postgres state, and Redis engine. 

*(Note: The Backend Dockerfile is programmed to automatically run Postgres Schema Migrations immediately before server ignition!)*

### 3. Open Application
Navigate to [http://localhost:5173](http://localhost:5173). The API is actively listening on port 3000 mapped identically. 

## 📓 API Topography

| Method | Endpoint | Trigger / Use-case |
| :--- | :--- | :--- |
| `POST` | `/auth/signup` | Registers UUID and bcrypt hash inside Postgres |
| `POST` | `/plaid/create-link-token` | Negotiates secure handshake payload with Plaid Servers |
| `POST` | `/plaid/exchange-public-token`| Transforms sandbox item token into enduring Access Token |
| `POST` | `/transfers/create-payment-intent` | Secures an Idempotent Stripe sequence anticipating a deposit |
| `POST` | `/transfers/confirm` | ACID verification wrapper closing Stripe and validating DB State |

---
**Maintained by Aviral Kaushal**
