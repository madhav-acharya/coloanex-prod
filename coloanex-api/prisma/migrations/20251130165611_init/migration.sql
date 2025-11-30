-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "borrower";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateEnum
CREATE TYPE "borrower"."KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "core"."ActivityEntityType" AS ENUM ('ROLE', 'PERMISSION', 'USER', 'TENANT', 'BORROWER', 'KYC_DOCUMENT');

-- CreateEnum
CREATE TYPE "core"."ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'KYC_VERIFY', 'KYC_REJECT', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "auth"."roles" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "tenant_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."permissions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "tenant_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."role_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "tenant_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "auth"."user_permissions" (
    "user_id" TEXT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id","permission_id")
);

-- CreateTable
CREATE TABLE "core"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(20),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "owner_user_id" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."activity_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "tenant_id" TEXT,
    "entityType" "core"."ActivityEntityType" NOT NULL,
    "entityId" TEXT,
    "action" "core"."ActivityAction" NOT NULL,
    "description" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrower"."borrowers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kycStatus" "borrower"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "rewardScore" DOUBLE PRECISION,
    "kycLastCheckedAt" TIMESTAMP(3),
    "primary_kyc_document_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrower"."kyc_documents" (
    "id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "type" TEXT,
    "document_number" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "full_legal_name" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "national_id" TEXT,
    "national_id_type" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "status" "borrower"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "issuing_authority" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "auth"."roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_tenant_id_key" ON "auth"."roles"("name", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "auth"."permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_tenant_id_idx" ON "auth"."permissions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "auth"."users"("phone");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "auth"."users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_isActive_idx" ON "auth"."users"("tenant_id", "isActive");

-- CreateIndex
CREATE INDEX "tenants_isActive_idx" ON "core"."tenants"("isActive");

-- CreateIndex
CREATE INDEX "tenants_isBanned_idx" ON "core"."tenants"("isBanned");

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_createdAt_idx" ON "core"."activity_logs"("tenant_id", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_actor_user_id_createdAt_idx" ON "core"."activity_logs"("actor_user_id", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "core"."activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_primary_kyc_document_id_key" ON "borrower"."borrowers"("primary_kyc_document_id");

-- CreateIndex
CREATE INDEX "borrowers_tenantId_kycStatus_idx" ON "borrower"."borrowers"("tenantId", "kycStatus");

-- CreateIndex
CREATE INDEX "borrowers_tenantId_idx" ON "borrower"."borrowers"("tenantId");

-- CreateIndex
CREATE INDEX "borrowers_user_id_idx" ON "borrower"."borrowers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_tenantId_user_id_key" ON "borrower"."borrowers"("tenantId", "user_id");

-- CreateIndex
CREATE INDEX "kyc_documents_borrower_id_status_idx" ON "borrower"."kyc_documents"("borrower_id", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "borrower"."kyc_documents"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_national_id_national_id_type_idx" ON "borrower"."kyc_documents"("national_id", "national_id_type");

-- AddForeignKey
ALTER TABLE "auth"."roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."permissions" ADD CONSTRAINT "permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."tenants" ADD CONSTRAINT "tenants_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "core"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower"."borrowers" ADD CONSTRAINT "borrowers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower"."borrowers" ADD CONSTRAINT "borrowers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower"."borrowers" ADD CONSTRAINT "borrowers_primary_kyc_document_id_fkey" FOREIGN KEY ("primary_kyc_document_id") REFERENCES "borrower"."kyc_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrower"."kyc_documents" ADD CONSTRAINT "kyc_documents_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "borrower"."borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
