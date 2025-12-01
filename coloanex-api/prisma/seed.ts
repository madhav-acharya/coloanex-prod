import 'dotenv/config';
import { ROLES, PERMISSIONS } from '../src/common/constants/seeds.constants';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  console.log('🌱 Starting database seeding...');

  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
  const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE;
  const SUPER_ADMIN_FULL_NAME =
    process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin';

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD || !SUPER_ADMIN_PHONE) {
    throw new Error(
      'SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD and SUPER_ADMIN_PHONE must be set',
    );
  }

  console.log('📝 Creating roles...');
  const createdRoles = await Promise.all(
    ROLES.map((roleName) =>
      prisma.role.upsert({
        where: {
          name: roleName,
        },
        update: {},
        create: {
          name: roleName,
          isSystem: true,
          tenantId: null,
        },
      }),
    ),
  );
  console.log(`✅ Created ${createdRoles.length} roles`);

  console.log('🔐 Creating permissions...');
  console.log(`📋 Total permissions to create: ${PERMISSIONS.length}`);

  const createdPermissions = await Promise.all(
    PERMISSIONS.map((permissionName) =>
      prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          isSystem: true,
          description: `Permission to ${permissionName.toLowerCase()}`,
          tenantId: null,
        },
      }),
    ),
  );
  console.log(`✅ Created ${createdPermissions.length} permissions`);

  console.log('👤 Creating Super Admin user...');
  const hashedPassword = await argon2.hash(SUPER_ADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 2,
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      phone: SUPER_ADMIN_PHONE,
      fullName: SUPER_ADMIN_FULL_NAME,
    },
    create: {
      fullName: SUPER_ADMIN_FULL_NAME,
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      password: hashedPassword,
      isActive: true,
      isEmailVerified: false,
      isBanned: false,
    },
  });

  console.log(`✅ Super Admin user: ${superAdminUser.email}`);

  console.log('🔗 Assigning permissions to Super Admin role & user...');
  const superAdminRole = createdRoles.find(
    (role) => role.name === 'Super Admin',
  );

  if (!superAdminRole) {
    throw new Error('Super Admin role not found in created roles');
  }

  await Promise.all(
    createdPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  await Promise.all(
    createdPermissions.map((permission) =>
      prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: superAdminUser.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: superAdminUser.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  console.log('✅ Assigned all permissions to Super Admin role and user');

  console.log('\n📊 Summary:');
  console.log(`- ${createdRoles.length} roles created`);
  console.log(`- ${createdPermissions.length} permissions created`);
  console.log(`- 1 Super Admin user created/updated`);
  console.log(`- Role-permission relationships established`);
  console.log(`- User-role and user-permission relationships created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
