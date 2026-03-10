# Coloanex App

React Native mobile application for the Coloanex peer-to-peer lending platform, built with Expo. Supports borrowers managing loan applications, viewing contracts, making payments, and tracking repayment schedules.

## Tech Stack

- **Framework:** React Native with Expo (SDK 52)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Redux Toolkit
- **API Client:** Axios
- **UI:** Custom components with NativeWind / StyleSheet
- **File Uploads:** Cloudinary via `expo-image-picker`

## Project Structure

```
app/
├── (tabs)/              # Tab-based main navigation
├── auth/                # Login and register screens
├── loans/               # Loan application and status tracking
├── contracts/           # Contract view and digital signing
├── payment/             # Payment initiation (eSewa, Khalti)
├── payment-schedules/   # Repayment schedule view
├── repayment/           # Repayment screens
├── kyc/                 # KYC document submission
├── lenders/             # Lender/tenant discovery
├── rules/               # Loan rule listing
├── wallet/              # Wallet balance and transactions
├── profile/             # User profile management
└── activity-logs/       # Activity history

api/                     # API client modules per domain
store/                   # Redux store and slices
types/                   # TypeScript type definitions
components/              # Reusable UI components
constants/               # App-wide constants and theme
hooks/                   # Custom React hooks
utils/                   # Utility helpers (currency, uploads)
```

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS), Android Emulator, or Expo Go on a physical device

## Setup

```bash
npm install
```

Update `constants/app.ts` with your API base URL:

```ts
export const API_BASE_URL = "http://localhost:3000/api";
```

## Running

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run in browser
npm run web
```

## Key Features

- **Loan Application:** Borrowers apply for loans, track approval status, and view rejection reasons
- **Contract Management:** View contract terms, sign contracts digitally, and monitor disbursement
- **Payment Integration:** Initiate payments via eSewa and Khalti with gateway redirect handling
- **Repayment Schedule:** Detailed installment breakdown with due dates, amounts, and payment status
- **KYC Submission:** Upload and submit identity verification documents for review
- **Wallet:** View balance and full transaction history
- **Activity Logs:** Complete audit trail of all account actions

## Blockchain Transparency for Users

After a loan is created, approved, or a payment is processed, the API returns a `blockchainTxHash` or `blockchainData` field in the response. Displaying this transaction ID in the UI allows borrowers to independently verify their financial records on the immutable Hyperledger Fabric ledger, proving that lenders cannot retroactively alter loan terms or payment history.

## Linting

```bash
npm run lint
```
