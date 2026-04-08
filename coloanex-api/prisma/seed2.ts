import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  console.log('🌱 Starting database seeding (seed2.ts)...');

  // Find Lender Role
  const lenderRole = await prisma.role.findUnique({
    where: { name: 'Lender' },
  });

  if (!lenderRole) {
    console.error('Lender role not found! Please run seed.ts first.');
    return;
  }

  // Find Borrower Role
  const borrowerRole = await prisma.role.findUnique({
    where: { name: 'Borrower' },
  });

  if (!borrowerRole) {
    console.error('Borrower role not found! Please run seed.ts first.');
    return;
  }

  const hashedPassword = await argon2.hash('password123', {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 2,
  });

  console.log('🏗️ Creating 5 tenants, lenders, and rules...');

  for (let i = 1; i <= 5; i++) {
    const tenantName = `Tenant ${i}`;
    const lenderEmail = `lender${i}@coloanex.com`;

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        address: `123 St, Suite ${i}`,
        contactEmail: `tenant${i}@coloanex.com`,
        contactPhone: `980000000${i}`,
        description: `This is a tenant ${i} for testing purposes.`,
        establishedYear: 2020 + i,
        isActive: true,
        isPubliclyVisible: true,
      },
    });

    // 2. Create User (Lender)
    const user = await prisma.user.create({
      data: {
        email: lenderEmail,
        fullName: `Lender Admin ${i}`,
        password: hashedPassword,
        phone: `981000000${i}`,
        tenantId: tenant.id,
        isActive: true,
        isEmailVerified: true,
        isBanned: false,
      },
    });

    // Link User to Tenant Owner
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { ownerUserId: user.id },
    });

    // Assign Lender Role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: lenderRole.id,
      },
    });

    // Assign Lender Permissions
    const lenderPerms = await prisma.rolePermission.findMany({
      where: { roleId: lenderRole.id },
    });
    for (const perm of lenderPerms) {
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          permissionId: perm.permissionId,
        },
      });
    }

    // 3. Create Rule
    await prisma.rule.create({
      data: {
        tenantId: tenant.id,
        name: `Standard Lending Rule ${i}`,
        description: `Standard rule for ${tenant.name}`,
        ruleType: 'STANDARD',
        interestRate: 15.0 + i, // e.g. 16, 17, 18
        loanLimits: { min: 10000, max: 500000 },
        penaltyConfig: {
          type: 'PERCENTAGE',
          value: 2.0,
          gracePeriodDays: 5,
        },
        paymentConfig: {
          allowedFrequencies: ['MONTHLY', 'QUARTERLY'],
          requiresAutoDebit: false,
        },
        isActive: true,
        isPubliclyVisible: true,
      },
    });

    // 4. Create User (Borrower)
    const borrowerUser = await prisma.user.create({
      data: {
        email: `borrower${i}@coloanex.com`,
        fullName: `Dummy Borrower ${i}`,
        password: hashedPassword,
        phone: `982000000${i}`,
        isActive: true,
        isEmailVerified: true,
        isBanned: false,
      },
    });

    // Assign Borrower Role
    await prisma.userRole.create({
      data: {
        userId: borrowerUser.id,
        roleId: borrowerRole.id,
      },
    });

    // Assign Borrower Permissions
    const borrowerPerms = await prisma.rolePermission.findMany({
      where: { roleId: borrowerRole.id },
    });
    for (const perm of borrowerPerms) {
      await prisma.userPermission.create({
        data: {
          userId: borrowerUser.id,
          permissionId: perm.permissionId,
        },
      });
    }

    // Create Borrower Profile Linked to Tenant
    await prisma.borrower.create({
      data: {
        userId: borrowerUser.id,
        tenantId: tenant.id,
        creditScore: 700 + i,
        kycStatus: "PENDING",
      },
    });

    console.log(`✅ Created ${tenantName} (Lender: ${lenderEmail}, Borrower: borrower${i}@coloanex.com)`);
  }

  console.log('🎉 Seed2 completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
