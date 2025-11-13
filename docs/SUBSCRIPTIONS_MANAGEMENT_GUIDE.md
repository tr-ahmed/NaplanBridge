# Subscriptions & Orders Management Component

## 📋 Overview
Complete admin component for managing subscription plans, orders, and payments with analytics.

## ✨ Features

### **1. Subscription Plans Management**
- ✅ View all subscription plans
- ✅ Create new plans
- ✅ Edit existing plans
- ✅ Deactivate plans
- ✅ Search and filter plans
- ✅ Real-time statistics

### **2. Orders Management**
- ✅ View all orders
- ✅ Filter by status (Pending, Paid, Failed)
- ✅ Search orders
- ✅ View order details
- ✅ Download invoices (PDF)
- ✅ Pagination support

### **3. Analytics Dashboard**
- ✅ Total revenue tracking
- ✅ Order statistics
- ✅ Average order value
- ✅ Date range filtering
- ✅ Monthly trends
- ✅ Top performing plans

## 🎯 API Endpoints Used

### Subscription Plans
- `GET /api/SubscriptionPlans` - Get all plans
- `POST /api/SubscriptionPlans` - Create plan
- `PUT /api/SubscriptionPlans/{id}` - Update plan
- `POST /api/SubscriptionPlans/deactivate-plan/{id}` - Deactivate plan

### Orders
- `GET /api/Orders` - Get all orders
- `GET /api/Orders/{orderId}` - Get order details
- `GET /api/Orders/{orderId}/invoice` - Download invoice
- `GET /api/Orders/parent/analytics` - Get analytics data

## 📊 Statistics Cards
1. **Total Plans** - Count of all subscription plans
2. **Active Plans** - Count of active plans
3. **Total Orders** - Total number of orders
4. **Total Revenue** - Sum of all paid orders

## 🎨 UI Components

### Tabs
- **Subscription Plans** - CRUD operations for plans
- **Orders** - View and manage orders
- **Analytics** - Revenue and order analytics

### Modal
- Add/Edit subscription plan with form validation
- Fields: Name, Description, Price, Duration, Active Status

### Tables
- Responsive tables with hover effects
- Color-coded status badges
- Action buttons (View, Edit, Deactivate, Download)

## 🚀 Usage

### Route
```typescript
/admin/subscriptions
```

### Access Control
- Role: Admin only
- Auth Guard: Required
- Header/Footer: Hidden

## 📱 Responsive Design
- Mobile-friendly layout
- Collapsible sidebar
- Responsive tables
- Touch-friendly buttons

## 🔧 Technical Details

### Dependencies
- Angular 18+
- Tailwind CSS
- SweetAlert2
- Font Awesome
- HttpClient

### State Management
- Signals for reactive UI
- Local component state
- HTTP service integration

### Features
- Real-time data loading
- Error handling with user feedback
- Loading states
- Form validation
- Pagination
- Search & filter

## 🎯 Future Enhancements
- [ ] Chart.js integration for analytics
- [ ] Export data to CSV/Excel
- [ ] Bulk operations
- [ ] Email notifications
- [ ] Advanced filtering options
- [ ] Order refund functionality
