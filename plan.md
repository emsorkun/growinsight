# CURSOR PROMPT: Build GrowInsight - Food Delivery Analytics Dashboard

## PROJECT OVERVIEW

Create a comprehensive food delivery analytics dashboard called "GrowInsight" that provides detailed insights into multi-platform food delivery performance across UAE markets. The app should track and analyze data from Talabat, Deliveroo, Careem, Noon, and Keeta delivery platforms.

## TECH STACK

- Frontend: React with TypeScript
- UI Framework: Tailwind CSS with shadcn/ui components
- Charts: Recharts for data visualization
- State Management: Zustand or Context API
- Routing: React Router v6
- Backend: Node.js with Express
- Database: PostgreSQL or MongoDB
- Authentication: JWT-based auth
- File Upload: Multer for CSV processing
- Deployment: Vercel/Netlify (frontend) + Railway/Render (backend)

## BRAND IDENTITY

- Primary Color: Blue (#3B82F6)
- Secondary Color: Light Blue/Cyan (#06B6D4)
- Logo: "growinsight" with "grow" in dark blue and "insight" in light blue
- Font: Clean, modern sans-serif (Inter or similar)
- Background: Light gray (#F3F4F6) with white content cards

## AUTHENTICATION SYSTEM

### Login Page

- Clean, centered login form with:
  - Username field
  - Password field
  - Blue "Sign in" button
  - Display test credentials: Username: test, Password: password
- Split-screen design:
  - Left: Login form with "Welcome back" heading
  - Right: Feature highlights with icons:
    - Multi-Channel Analytics
    - Real-time Insights
    - ROAS Tracking
    - Location Analysis

### User Management

- JWT token authentication
- Session persistence
- User profile dropdown with "Sign out" option
- Display username in bottom-left corner

## NAVIGATION STRUCTURE

### Sidebar Navigation (Left)

1. **Dashboard** (default selected, blue highlight)
2. **Area Level** - Geographic analysis
3. **Cuisine Level** - Cuisine category analysis
4. **Missing Brands** - Competitive gap analysis
5. **Upload Data** - CSV import functionality

### User Info (Bottom Left)

- Display current user (e.g., "Test User")
- Sign out link

## DATA MODEL

### Core Data Structure (CSV Format)

```
Channel, City, Month_Year, Month, Year, Location, Cuisine, Brand_Name, Orders, Net_Sales, Gross_Sales, Ads_Spend, Discount_Spend, Ads_Return
```

### Supported Channels

- Talabat (Orange: #F97316)
- Deliveroo (Cyan: #06B6D4)
- Careem (Green: #10B981)
- Noon (Yellow: #FDE047)
- Keeta (Gray: #6B7280)

## PAGE SPECIFICATIONS

### 1. DASHBOARD PAGE

#### Header

- Title: "Dashboard"
- Subtitle: "Food delivery analytics and insights"

#### Filter Bar (Horizontal)

Four dropdown filters:

1. **Months**: All Months (default) or specific months
2. **City**: All Cities (default), Dubai, Abu Dhabi, Sharjah, Ajman, etc.
3. **Area**: All Areas (default) or specific areas
4. **Cuisine**: All Cuisines (default) or specific cuisine types

#### Analytics Cards (2x3 Grid)

**Row 1:**

1. **Orders by Channel** (Pie Chart)
   - Show percentage distribution of orders across channels
   - Display legend with percentages
   - Color-coded by channel

2. **Net Sales by Channel** (Pie Chart)
   - Show percentage distribution of revenue
   - Display legend with percentages
   - Color-coded by channel

**Row 2:**

3. **Monthly Market Share (Orders) by Channel** (Stacked Bar Chart)
   - X-axis: Months (January to October)
   - Y-axis: Market Share (0-100%)
   - Stacked bars showing channel distribution
   - Legend below chart

**Row 3:**

4. **Ads Spend vs Gross Sales** (Bar Chart)
   - Compare ad spend efficiency across platforms
   - Y-axis: Percentage values

5. **Discount Spend vs Gross Sales** (Bar Chart)
   - Show discount investment by platform
   - Y-axis: Percentage values

6. **Total Marketing vs Gross Sales** (Bar Chart)
   - Combined marketing spend analysis
   - Y-axis: Percentage values

**Row 4:**

7. **ROAS by Channel** (Bar Chart)
   - Return on Ad Spend for each channel
   - Y-axis: ROAS value (0-8)
   - Highlight best performing channel

8. **Average Order Value by Channel** (Bar Chart)
   - AOV comparison across platforms
   - Y-axis: Currency value (0-120)

### 2. AREA LEVEL ANALYSIS PAGE

#### Header

- Title: "Area Level Analysis"
- Subtitle: "Market share by geographical areas"
- Same filter bar as Dashboard

#### Market Share by Area Table

- Search bar: "Search areas..."
- Sortable columns:
  - Area (with location pin icon)
  - Talabat Market Share %
  - Deliveroo Market Share %
  - Careem Market Share %
  - Noon Market Share %
  - Keeta Market Share %
- Color coding: Highest percentage in each row highlighted
- Show data for all areas in UAE including:
  - Abu Dhabi regions (Main, Khalifa City, Mushrif, etc.)
  - Dubai areas (Academic City, Al Barsha, JBR, Marina, etc.)
  - Sharjah areas
  - Ajman areas
  - Other Emirates

### 3. CUISINE LEVEL ANALYSIS PAGE

#### Header

- Title: "Cuisine Level Analysis"
- Subtitle: "Market share by cuisine categories"
- Same filter bar as Dashboard

#### Market Share by Cuisine Table

- Search bar: "Search cuisines..."
- Sortable columns:
  - Cuisine (with icon for each cuisine type)
  - Talabat Market Share %
  - Deliveroo Market Share %
  - Careem Market Share %
  - Noon Market Share %
  - Keeta Market Share %
- Cuisine categories with icons:
  - 🍔 American/Fast Food
  - 🥢 Asian
  - ☕ Beverages
  - 🥐 Breakfast & Bakery
  - 🍰 Desserts & Sweets
  - 🥗 Healthy & Special Diets
  - 🔥 Indian
  - 🌍 International
  - 🍝 Italian
  - 🌮 Mexican
  - 🥙 Middle Eastern
  - 🐟 Seafood
  - 🥙 Shawarma
  - 🍜 Soup & Liquid
  - 🥘 Turkish

### 4. MISSING BRANDS PAGE

#### Header

- Title: "Missing Brands in Careem"
- Subtitle: "Brands available on Talabat but not on Careem across all areas and cuisines"

#### Section: All Missing Brands

- Grid layout (3 columns on desktop, responsive)
- Brand cards showing:
  - Restaurant name (bold)
  - Cuisine type (gray text)
  - Location/Area
  - Star rating (visual stars)
  - Number indicator (top-right corner showing location count)
- Each card has hover effect (slight shadow)
- Cards are clickable for potential detailed view


## KEY FEATURES TO IMPLEMENT

### Data Processing

1. **Aggregation Logic**
   - Calculate market share percentages
   - Generate monthly trends
   - Compute ROAS (Ads_Return / Ads_Spend)
   - Calculate AOV (Gross_Sales / Orders)

2. **Filtering System**
   - Multi-select filters
   - Dynamic data updates
   - URL parameter sync for shareable views

3. **Performance Optimization**
   - Data caching
   - Lazy loading for large datasets
   - Pagination for tables
   - Debounced search

### Responsive Design

- Mobile-friendly navigation (hamburger menu)
- Responsive grid layouts
- Touch-friendly controls
- Optimized chart sizes for mobile

### Additional Features

1. **Export Functionality**
   - Export filtered data as CSV
   - Export charts as images/PDF
   - Generate reports

2. **Real-time Updates**
   - WebSocket for live data updates
   - Notification system for data changes
   - Auto-refresh option

3. **Advanced Analytics**
   - Trend analysis with predictions
   - Comparative period analysis (MoM, YoY)
   - Performance alerts and thresholds

## DATA STRUCTURE
Connect to bigquery with below mentioned credentials
project-id: vpc-host-prod-fn204-ex958
key: vpc-host-prod-fn204-ex958-654b99d94b5d.json
This is the query that can feed all data needed:
-- Combined Monthly Performance View (Filtered by country_id = 1 and year = 2025)
-- Updated to use clean area names from l3_growinsight_locations
SELECT
  s.channel AS Channel,
  gl.clean_city AS City,
  gl.clean_area AS Area,
  s.month_year AS Month_Year,
  SPLIT(s.month_year, "-")[OFFSET(0)] AS Month,
  SPLIT(s.month_year, "-")[OFFSET(1)] AS Year,
  gl.location_name AS Location,
  cu.name AS Cuisine,
  s.total_orders_count AS Orders,
  s.net_revenue AS Net_Sales,
  s.gross_revenue AS Gross_Sales,
  COALESCE(a.spend, 0) AS Ads_Spend,
  s.discount AS Discount_Spend,
  COALESCE(a.return, 0) AS Ads_Return
FROM `vpc-host-prod-fn204-ex958.aisha.l4_legacy_monthly_sales` AS s
LEFT JOIN `vpc-host-prod-fn204-ex958.aisha.l3_legacy_monthly_ad_campaigns` AS a
  ON s.brand_id = a.brand_id
  AND s.branch_id = a.branch_id
  AND s.channel = a.channel
  AND s.month_year = a.month_year
LEFT JOIN `vpc-host-prod-fn204-ex958.growdash_postgresql.public_branches` AS b
  ON CAST(s.branch_id AS INT64) = b.id
LEFT JOIN `vpc-host-prod-fn204-ex958.growdash_postgresql.public_brands` AS br
  ON CAST(s.brand_id AS INT64) = br.id
LEFT JOIN `vpc-host-prod-fn204-ex958.growdash_postgresql.public_cuisines` AS cu
  ON CAST(br.cuisine_id AS INT64) = cu.id
LEFT JOIN `vpc-host-prod-fn204-ex958.growinsight.l3_growinsight_locations` AS gl
  ON b.location_id = gl.location_id
WHERE br.country_id = 1
  AND SPLIT(s.month_year, "-")[OFFSET(1)] = '2025'
ORDER BY Year, Month, Channel, City;

## API ENDPOINTS

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/verify

GET  /api/dashboard/summary
GET  /api/dashboard/charts

GET  /api/areas
GET  /api/areas/market-share

GET  /api/cuisines
GET  /api/cuisines/market-share

GET  /api/brands/missing/:channel

POST /api/data/upload
DELETE /api/data/clear
GET  /api/data/count
```

## DEVELOPMENT PRIORITIES

### Phase 1: Foundation

1. Setup project with TypeScript and Tailwind
2. Implement authentication system
3. Create responsive layout with sidebar
4. Build Dashboard page with static data

### Phase 2: Data Integration

1. Setup database and models
2. Implement CSV upload functionality
3. Create data aggregation services
4. Connect charts to real data

### Phase 3: Analysis Pages

1. Build Area Level Analysis page
2. Build Cuisine Level Analysis page
3. Implement Missing Brands page
4. Add filtering functionality

### Phase 4: Polish & Optimization

1. Add loading states and error handling
2. Implement caching and performance optimization
3. Add export functionality
4. Mobile responsiveness fine-tuning

### Phase 5: Advanced Features

1. Real-time data updates
2. Advanced analytics and predictions
3. User preferences and saved views
4. Notification system

## TESTING REQUIREMENTS

- Unit tests for data processing functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for large datasets
- Accessibility testing (WCAG 2.1 AA compliance)

## DEPLOYMENT CHECKLIST

- Environment variables configuration
- Database migrations
- SSL certificates
- CORS configuration
- Rate limiting
- Error logging (Sentry or similar)
- Analytics integration
- Backup strategy
- CI/CD pipeline


## SUCCESS CRITERIA
Best in class UI/UX with Shadcn
Next.js Backend
Eslint
Prettier
Docker
Full unit test coverage
Use zod and rhf for validation type

This comprehensive prompt should enable you to recreate the entire GrowInsight application with all its features and functionality using Cursor AI.