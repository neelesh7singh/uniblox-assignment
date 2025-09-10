# Uniblox E-commerce Platform

A modern, full-stack e-commerce platform built with React and Express, featuring a complete shopping experience with admin dashboard, order management, and real-time notifications.

## 📁 Project Structure

```
uniblox/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── admin/      # Admin-specific components
│   │   │   ├── cart/       # Shopping cart components
│   │   │   ├── common/     # Shared components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── orders/     # Order-related components
│   │   │   ├── products/   # Product components
│   │   │   └── ui/         # Base UI components
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin dashboard pages
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── cart/       # Cart page
│   │   │   ├── orders/     # Order pages
│   │   │   ├── products/   # Product pages
│   │   │   └── profile/    # User profile page
│   │   ├── store/          # Zustand state management
│   │   │   ├── admin.ts    # Admin state
│   │   │   ├── app.ts      # App-wide state
│   │   │   ├── auth.ts     # Authentication state
│   │   │   ├── cart.ts     # Cart state
│   │   │   ├── orders.ts   # Orders state
│   │   │   └── products.ts # Products state
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── dist/               # Built application
├── server/                 # Express Backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   │   ├── admin.ts    # Admin routes
│   │   │   ├── auth.ts     # Authentication routes
│   │   │   ├── cart.ts     # Cart routes
│   │   │   ├── coupons.ts  # Coupon routes
│   │   │   ├── orders.ts   # Order routes
│   │   │   └── products.ts # Product routes
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.ts     # Authentication middleware
│   │   │   ├── errorHandler.ts # Error handling
│   │   │   ├── rateLimiter.ts  # Rate limiting
│   │   │   └── validation.ts   # Input validation
│   │   ├── store/          # In-memory data store
│   │   ├── types/          # TypeScript type definitions
│   │   └── test/           # Test files
│   ├── dist/               # Compiled JavaScript
│   └── node_modules/       # Server dependencies
├── node_modules/           # Root dependencies (workspace)
├── package.json            # Root package.json (workspace config)
├── setup.sh               # Automated setup script
└── README.md              # This file
```

## 🛠️ Key Technologies & Libraries

### Frontend (Client)

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Axios** - HTTP client

### Backend (Server)

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Jest** - Testing framework
- **Supertest** - HTTP testing
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Frontend testing
- **Concurrently** - Run multiple commands

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** v16 or higher
- **npm** v8 or higher

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup.sh
```

This will:

- ✅ Check Node.js and npm versions
- ✅ Install all dependencies (root and workspace)
- ✅ Build both client and server
- ✅ Run tests (continues even if some tests fail)
- ✅ Display helpful information and next steps

### Manual Setup

1. **Install dependencies**

   ```bash
   npm install
   npm run install:all
   ```

2. **Build both projects**

   ```bash
   npm run build
   ```

3. **Start development servers**

   ```bash
   # Start both client and server
   npm run dev:all

   # Or start individually
   npm run dev:client
   npm run dev:server
   ```

## 🎯 Available Commands

### Development

```bash
npm run dev:all      # Start both client and server
npm run dev:client   # Start client development server
npm run dev:server   # Start server development server
```

### Building

```bash
npm run build        # Build both client and server
npm run build:client # Build client only
npm run build:server # Build server only
```

### Testing

```bash
npm test             # Run all tests
npm run test:client  # Run client tests
npm run test:server  # Run server tests
```

### Production

```bash
npm start            # Start production server
```

## 🌐 Development URLs

- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 👤 Demo Credentials

### Regular User

- **Email**: test@example.com
- **Password**: TestPass123

### Admin User

- **Email**: admin@uniblox.com
- **Password**: password

## 🏗️ Architecture Overview

### Frontend Architecture

- **Component-based**: Modular React components
- **State Management**: Zustand stores for different domains
- **Type Safety**: Full TypeScript integration
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Toast notifications for user feedback

### Backend Architecture

- **RESTful API**: Clean API design with Express.js
- **Middleware Pattern**: Authentication, validation, error handling
- **In-memory Store**: Simple data persistence for development
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Request validation and sanitization

## 🔧 Development Workflow

1. **Clone the repository**
2. **Run setup script**: `./setup.sh`
3. **Start development**: `npm run dev:all`
4. **Make changes**: Edit files in `client/src/` or `server/src/`
5. **Test changes**: Run `npm test` to verify functionality
6. **Build for production**: `npm run build`
