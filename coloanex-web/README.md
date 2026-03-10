# Coloanex Web

React web dashboard for the Coloanex peer-to-peer lending platform. Used by lenders (tenants) and super admins to manage loan requests, contracts, KYC, payments, users, and system configuration.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with shadcn/ui (Radix UI primitives)
- **State Management:** Redux Toolkit
- **Forms:** React Hook Form with Zod validation
- **API Client:** Axios
- **Routing:** React Router v7

## Project Structure

```
src/
├── pages/               # Route-level page components
│   ├── Dashboard.tsx    # Analytics overview
│   ├── LoanRequests.tsx # Loan application management
│   ├── Contracts.tsx    # Contract management
│   ├── KycRequests.tsx  # KYC document review
│   ├── Wallets.tsx      # Wallet management
│   ├── Users.tsx        # User administration
│   ├── Roles.tsx        # RBAC role management
│   ├── Permissions.tsx  # Permission management
│   ├── Rules.tsx        # Loan rule configuration
│   ├── Tenants.tsx      # Multi-tenant management (super admin)
│   ├── Settings.tsx     # Tenant settings
│   ├── Security.tsx     # Security settings
│   ├── Profile.tsx      # User profile
│   ├── Login.tsx        # Authentication
│   └── Signup.tsx       # Registration
├── apis/                # API client modules per domain
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── store/               # Redux store and slices
├── types/               # TypeScript type definitions
└── lib/                 # Utility libraries
```

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
```

Create a `.env` file at the root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Running

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The web dashboard runs on `http://localhost:5173` by default.

## Key Features

- **Loan Management:** Review, approve, and reject borrower loan applications
- **Contract Workflow:** Generate contracts, monitor signing status, and initiate disbursement
- **KYC Review:** Review identity documents uploaded by borrowers
- **Analytics Dashboard:** Loan portfolio overview, repayment performance, and revenue metrics
- **Rules Engine:** Configure interest rates, loan limits, and penalty structures per tenant
- **User & RBAC Management:** Manage users, assign roles, and control feature access
- **Wallet Management:** View and manage lender and borrower wallet balances
- **Multi-tenant Support:** Super admin can manage multiple lending organizations

## Verifying Blockchain Integration

From the web dashboard, lenders can view the `blockchainTxHash` on loan records and the `blockchainData` JSON on contracts. These fields confirm that the lifecycle event (creation, signing, disbursement, payment) was permanently recorded on the Hyperledger Fabric ledger and cannot be altered retroactively.

## Linting

```bash
npm run lint
```

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
