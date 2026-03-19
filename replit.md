# BePay/BeingFi - Global Payment Solutions Platform

## Overview

This is a full-stack payment platform application providing global payment solutions, OTC (Over-The-Counter) trading systems, and merchant management capabilities. The platform is built with a React frontend and Express backend, featuring AI-powered payment API integration, multi-currency support, and comprehensive merchant/agent management systems.

Key features include:
- Global payment channel marketplace
- OTC trading and settlement management
- Merchant dashboard and order management
- Team/agent hierarchy management
- Cryptocurrency wallet integration
- Multi-language support (Chinese, English, Myanmar, and others)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode default)
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for UI animations
- **3D Graphics**: Three.js for globe visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **Authentication**: Passport.js with local strategy, scrypt password hashing
- **API Pattern**: RESTful endpoints under `/api/*` prefix

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit for schema migrations (`migrations/` directory)
- **Key Tables**: users, otc_users, merchants, admins, orders, settlements, payment_channels, crypto_wallets, crypto_transactions

### Authentication Flow
- Dual authentication systems:
  1. Standard user authentication (username/password)
  2. OTC/Merchant authentication with wallet ID + verification code option
- Token-based session management with configurable login modes (`client/src/config/login.ts`)
- Role-based access control (user, merchant, admin, agent, staff)

### API Integration Pattern
- External API calls proxied through backend to `https://test-otc-api.beingfi.com`
- Token automatically appended to requests via `apiRequest` helper
- Centralized query client configuration in `client/src/lib/queryClient.ts`

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route page components
│   │   ├── hooks/       # Custom React hooks (data fetching, auth)
│   │   ├── lib/         # Utilities and query client
│   │   └── config/      # Runtime configuration
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── auth.ts       # Authentication setup
│   ├── storage.ts    # Data access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Third-Party APIs
- **External OTC API**: `https://test-otc-api.beingfi.com` for payment processing, order management, and merchant operations
- **Stripe**: Payment processing integration (configured but optional)

### UI/Component Libraries
- **Radix UI**: Headless UI primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-built component variants
- **Lucide React**: Icon library
- **React Icons**: Additional icon sets (payment brand logos)

### Authentication & Security
- **Passport.js**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **crypto (Node.js)**: Password hashing with scrypt

### Development Tools
- **Vite**: Frontend build and dev server
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the stack
- **Drizzle Kit**: Database schema management

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key (optional, has default)
- `STRIPE_SECRET_KEY`: Stripe API key (optional)