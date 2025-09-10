# Uniblox E-commerce API Server

A comprehensive e-commerce backend API built with Node.js, Express, and TypeScript. Features include user authentication, shopping cart management, order processing with automatic nth order discounts, coupon system, and detailed admin analytics.

## 📁 Project Structure

```
server/
├── src/
│   ├── middleware/         # Authentication, validation, error handling
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── routes/            # API route handlers
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── cart.ts
│   │   ├── coupons.ts
│   │   ├── orders.ts
│   │   └── products.ts
│   ├── store/             # In-memory data store
│   │   └── DataStore.ts
│   ├── test/              # Test files
│   │   ├── auth.test.ts
│   │   ├── orders.test.ts
│   │   └── setup.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts           # Main application entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration** (Optional)

   ```bash
   # Create .env file for production
   echo "JWT_SECRET=your-super-secret-jwt-key-change-in-production" > .env
   echo "NODE_ENV=production" >> .env
   echo "PORT=3000" >> .env
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Start the server**

   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm start
   ```

6. **Run tests**

   ```bash
   # Run all tests
   npm test

   # Run tests with coverage
   npm run test:coverage

   # Run tests in watch mode
   npm run test:watch
   ```