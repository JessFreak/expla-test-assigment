# Real-Time Chat Application

A full-stack real-time messaging workspace built with Angular and NestJS, featuring interactive bot handlers.

---

## Tech Stack

* **Frontend:** Angular 18+, TypeScript, SCSS
* **Backend:** NestJS, Socket.IO, TypeScript
* **Monorepo / Shared:** Nx, `@shared/types` shared library

---

## Monorepo Structure

```text
├── apps/
│   ├── client/          # Angular single-page chat application
│   └── server/          # NestJS WebSockets gateway and chat service
└── libs/
    └── shared/          # Shared data contracts, enums, and utility logic
```

### Module Descriptions

* **Client (`apps/client`):** Angular SPA with responsive layout, Angular Signals state management, and real-time chat sync.
* **Server (`apps/server`):** NestJS backend with WebSocket gateway, automated bot handlers (`Echo`, `Reverse`, `Spam`, `Ignore`), and server-side preview sorting.
* **Shared Library (`libs/shared`):** Common data contracts, enums, and pure utility functions (`filter.utils`, `random.utils`) shared across the monorepo via `@shared` alias.

---

## Getting Started

### Prerequisites

* **Node.js**
* **npm**
* **nx**

### Installation

1. Clone the repository:
```bash
git clone <https://github.com/JessFreak/expla-test-assigment.git>
cd expla-test-assigment
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

Run both client and server simultaneously:

```bash
npm run dev
```

Open your browser at `http://localhost:4200`.
