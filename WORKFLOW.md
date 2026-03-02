# CoLoanex — Workflow

## Summary

CoLoanex is a loan management platform connecting borrowers and lenders through three integrated sub-projects: a React Native mobile app for borrowers, a React web dashboard for lenders and admins, and a shared NestJS REST API powering both. A borrower opens the mobile app, signs up or logs in, browses available lenders, and submits a loan request. They then upload their KYC identity documents for verification. On the other side, a lender or admin logs into the web dashboard, reviews the KYC documents and loan application, and either approves or rejects it. Once approved, the borrower receives their loan, views their repayment schedule, and makes repayments through the app — while the lender tracks all payments, fund movements, contracts, and analytics through the dashboard. The backend API handles everything in between, including authentication, loan lifecycle management, document uploads, wallets, transactions, notifications, and multi-tenant lender support.

---

## Workflow Diagram

```
BORROWER (Mobile App)                         LENDER / ADMIN (Web Dashboard)
─────────────────────                         ──────────────────────────────
Open App                                      Open Website
     │                                               │
     ├── New User → Sign Up                          ├── New User → Sign Up
     └── Existing → Log In                           └── Existing → Log In
              │                                               │
              ▼                                               ▼
        Home Screen                                     Dashboard
     (Featured Lenders)                          (Overview & Analytics)
              │                                               │
     ┌────────┴─────────┐                    ┌───────────────┼──────────────┐
     ▼                  ▼                    ▼               ▼              ▼
Browse Lenders       My Loans          Loan Requests    KYC Requests   Contracts
     │                  │              (Review &        (Verify        (Generate &
     ▼                  ▼               Approve)         Docs)          Manage)
View Lender       View Loan                │
  Details           Details               ▼
     │                                Users / Roles / Permissions
     ▼                                     │
Request a Loan  ─────── API ─────────►  Review Loan Request
     │                                     │
     ▼                                     ▼
Submit KYC Docs ─────── API ─────────►  Approve KYC
     │                                     │
     ▼                                     ▼
Loan Approved   ◄─────── API ──────────  Approve Loan
     │                                     │
     ▼                                     ▼
View Payment Schedule               Rules & Settings
     │                              (Interest Rates, Loan Rules)
     ▼
Make Repayments ─────── API ─────────►  Track Wallets & Transactions
     │
     ▼
View Contracts
     │
     ▼
View Wallet & Transactions
     │
     ▼
Activity Logs / Notifications
```
