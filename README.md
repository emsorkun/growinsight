# GrowInsight - Food Delivery Analytics Dashboard

A comprehensive food delivery analytics dashboard for UAE markets, tracking performance across Talabat, Deliveroo, Careem, Noon, and Keeta delivery platforms.

## Features

- **Multi-Channel Analytics**: Track performance across all major UAE food delivery platforms
- **Real-time Insights**: Interactive charts and visualizations powered by Recharts
- **Area Level Analysis**: Market share breakdown by geographical areas
- **Cuisine Level Analysis**: Performance metrics by cuisine categories
- **Missing Brands Analysis**: Identify brands available on Talabat but not on Careem
- **Data Upload**: Import CSV files to update analytics data

## Tech Stack

- **Frontend**: Next.js 16 with React 19 and TypeScript
- **UI Framework**: Tailwind CSS v4 with shadcn/ui components
- **Charts**: Recharts for data visualization
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Next.js API Routes
- **Database**: BigQuery integration
- **Authentication**: JWT-based authentication
- **Testing**: Vitest with React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- BigQuery credentials (for production data)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Test Credentials

- **Username**: `test`
- **Password**: `password`

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard layout group
│   │   ├── dashboard/      # Main dashboard
│   │   ├── area-level/     # Area analysis
│   │   ├── cuisine-level/  # Cuisine analysis
│   │   ├── missing-brands/ # Missing brands
│   │   └── upload/         # Data upload
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── areas/          # Areas data
│   │   ├── cuisines/       # Cuisines data
│   │   ├── dashboard/      # Dashboard data
│   │   └── missing-brands/ # Missing brands data
│   └── login/              # Login page
├── components/
│   ├── charts/             # Chart components
│   ├── layout/             # Layout components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utility functions
│   ├── auth.ts             # Authentication utilities
│   ├── bigquery.ts         # BigQuery integration
│   ├── data-utils.ts       # Data processing utilities
│   └── utils.ts            # General utilities
├── store/                  # Zustand stores
│   ├── auth-store.ts       # Authentication state
│   └── filter-store.ts     # Filter state
├── types/                  # TypeScript types
└── __tests__/              # Test files
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Data
- `GET /api/dashboard` - Dashboard summary data
- `GET /api/areas` - Area market share data
- `GET /api/cuisines` - Cuisine market share data
- `GET /api/missing-brands` - Missing brands data

## Docker Deployment

```bash
# Build Docker image
docker build -t growinsight .

# Run with Docker Compose
docker-compose up -d
```

## Environment Variables

Create a `.env.local` file with:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./your-credentials.json
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_NAME=GrowInsight
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Brand Colors

- **Talabat**: #F97316 (Orange)
- **Deliveroo**: #06B6D4 (Cyan)
- **Careem**: #10B981 (Green)
- **Noon**: #FDE047 (Yellow)
- **Keeta**: #6B7280 (Gray)

## License

Private - All rights reserved
