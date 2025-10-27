import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { hashPassword } from '../lib/auth/utils';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from stack.env manually
const envPath = path.resolve(process.cwd(), 'stack.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    }
  });
}

const { users } = schema;

async function createAdmin() {
  console.log('Creating admin user...');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  const db = drizzle(pool, { schema });

  try {
    const adminEmail = 'trishkinakaterina1309@gmail.com';
    const adminPassword = '123';

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingUser) {
      console.log('ℹ️ User with this email already exists');
      console.log('User details:', {
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
        emailVerified: existingUser.emailVerified,
      });

      // Update to admin if not already
      if (!existingUser.isAdmin) {
        await db
          .update(users)
          .set({
            isAdmin: true,
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));

        console.log('✅ User updated to admin successfully!');
      } else {
        console.log('✅ User is already an admin');
      }

      await pool.end();
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('✅ Admin user created successfully!');
    console.log('Admin details:', {
      id: newAdmin.id,
      email: newAdmin.email,
      isAdmin: newAdmin.isAdmin,
      emailVerified: newAdmin.emailVerified,
    });
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdmin()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
