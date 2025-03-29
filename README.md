# Chinese Olympic - Authentication System

This is the authentication system for the Chinese Olympic project. It includes email verification, login, and password reset functionality.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_neon_database_url

# JWT
JWT_SECRET=your_jwt_secret_at_least_32_chars_long

# Email (SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SENDER_EMAIL=your_sender_email

# Payment (UKassa)
UKASSA_API_KEY=your_ukassa_api_key
UKASSA_SHOP_ID=your_ukassa_shop_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Initialize the database:

```bash
npx drizzle-kit push:pg
```

4. Run the development server:

```bash
npm run dev
```

## Docker Setup

1. Make sure you have Docker and Docker Compose installed.

2. Create a `.env` file with all the required environment variables.

3. Build and run the containers:

```bash
docker-compose up -d
```

## Features

- User registration with email verification
- Login with email and password
- Password reset functionality
- Protected routes with middleware
- JWT-based authentication
- Secure password hashing
- Email notifications for verification and password reset

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon PostgreSQL
- SMTP for email
- Jose for JWT
- bcrypt for password hashing

## Environment Variables

- `DATABASE_URL`: Your Neon PostgreSQL database URL
- `JWT_SECRET`: A secure secret key for JWT token generation (at least 32 characters)
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP server username
- `SMTP_PASSWORD`: SMTP server password
- `SENDER_EMAIL`: Email address for sending notifications
- `UKASSA_API_KEY`: YooKassa payment API key
- `UKASSA_SHOP_ID`: YooKassa shop ID
- `NEXT_PUBLIC_APP_URL`: The public URL of your application

## Development

The project uses Next.js App Router and follows a feature-based directory structure:

```
src/
  ├── app/
  │   ├── api/
  │   │   └── auth/
  │   │       ├── login/
  │   │       ├── register/
  │   │       ├── verify-email/
  │   │       ├── forgot-password/
  │   │       └── reset-password/
  │   ├── login/
  │   ├── register/
  │   ├── verify-email/
  │   ├── forgot-password/
  │   └── reset-password/
  ├── components/
  │   └── auth/
  │       └── AuthForm.tsx
  └── lib/
      ├── db/
      │   ├── index.ts
      │   └── schema.ts
      └── auth/
          └── utils.ts
```
