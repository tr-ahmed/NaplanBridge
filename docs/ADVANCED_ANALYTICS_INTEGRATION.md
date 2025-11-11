# Advanced Analytics Integration Guide

## 📊 Overview

The Advanced Analytics feature provides comprehensive analytics and reporting capabilities for the NaplanBridge platform. This document explains how to integrate the backend API once it's implemented.

---

## 🔴 Current Status: MOCK DATA MODE

The service is currently configured to use **mock data** for development and testing purposes.

**Configuration File:** `src/app/core/services/advanced-analytics.service.ts`

```typescript
private useMockData = true; // ⚠️ Currently using mock data
```

---

## ✅ How to Switch to Real Data

### Step 1: Verify Backend is Ready

Ensure the following endpoints are implemented and deployed:

- ✅ `GET /api/Analytics/advanced`
- ✅ `GET /api/Analytics/charts`
- ✅ `POST /api/Analytics/export/pdf`
- ✅ `POST /api/Analytics/export/excel`

### Step 2: Update Service Configuration

Open `src/app/core/services/advanced-analytics.service.ts` and change:

```typescript
// FROM:
private useMockData = true;

// TO:
private useMockData = false;
```

### Step 3: Verify API Base URL

Ensure the API URL matches your environment:

```typescript
const API_BASE_URL = 'https://naplan2.runasp.net/api';
```

For development, you might use:
```typescript
const API_BASE_URL = 'https://localhost:7265/api';
```

### Step 4: Test the Integration

1. Navigate to `/admin/advanced-analytics`
2. Try different periods (week, month, year)
3. Try different report types (overview, students, courses, revenue)
4. Test PDF and Excel exports
5. Verify data accuracy

---

## 📋 API Endpoints Specification

### 1. Get Advanced Analytics

**Endpoint:** `GET /api/Analytics/advanced`

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| period | string | Yes | `week`, `month`, `year` |
| reportType | string | Yes | `overview`, `students`, `courses`, `revenue` |
| startDate | string | No | `yyyy-MM-dd` |
| endDate | string | No | `yyyy-MM-dd` |

**Example Request:**
```http
GET /api/Analytics/advanced?period=month&reportType=overview
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "period": "month",
  "reportType": "overview",
  "overview": {
    "totalStudents": 1250,
    "previousStudents": 1180,
    "activeStudents": 980,
    "previousActive": 920,
    "totalRevenue": 45600,
    "previousRevenue": 42300,
    "coursesCompleted": 3450,
    "previousCompleted": 3200,
    "averageScore": 85.5,
    "previousScore": 83.2
  }
}
```

---

### 2. Get Chart Data

**Endpoint:** `GET /api/Analytics/charts`

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| period | string | Yes | `week`, `month`, `year` |
| reportType | string | Yes | `overview`, `students`, `courses`, `revenue` |

**Expected Response:**
```json
{
  "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "datasets": [
    {
      "label": "Enrollments",
      "data": [120, 135, 150, 145],
      "color": "#3B82F6",
      "backgroundColor": "rgba(59, 130, 246, 0.1)"
    }
  ]
}
```

---

### 3. Export to PDF

**Endpoint:** `POST /api/Analytics/export/pdf`

**Request Body:**
```json
{
  "period": "month",
  "reportType": "overview",
  "data": { /* full analytics data object */ }
}
```

**Response:** Binary PDF file

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="analytics_20251106.pdf"
```

---

### 4. Export to Excel

**Endpoint:** `POST /api/Analytics/export/excel`

**Request Body:**
```json
{
  "period": "month",
  "reportType": "overview",
  "data": { /* full analytics data object */ }
}
```

**Response:** Binary Excel file

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="analytics_20251106.xlsx"
```

---

## 🔒 Authentication & Authorization

All analytics endpoints require:
- ✅ **Authentication:** Valid JWT token
- ✅ **Authorization:** Admin role only

**Headers:**
```http
Authorization: Bearer {your-jwt-token}
```

---

## ⚠️ Error Handling

The service includes automatic fallback to mock data if the API fails:

```typescript
return this.http.get<AnalyticsData>(`${this.apiUrl}/advanced`, { params }).pipe(
  catchError(error => {
    console.error('Error loading analytics:', error);
    return this.getMockAnalytics(period, reportType); // Fallback
  })
);
```

**Common Error Scenarios:**
- API not deployed → Uses mock data
- Network error → Uses mock data
- Invalid token → Returns 401 error
- Insufficient permissions → Returns 403 error

---

## 🧪 Testing

### Frontend Testing (Mock Mode)

1. Set `useMockData = true`
2. Run: `ng serve`
3. Navigate to: `http://localhost:4200/admin/advanced-analytics`
4. Verify all UI components render correctly
5. Test period/report type switching
6. Test export buttons (downloads mock files)

### Backend Integration Testing

1. Set `useMockData = false`
2. Verify backend is running
3. Login as Admin
4. Navigate to Advanced Analytics
5. Test each scenario:
   - ✅ Week overview
   - ✅ Month overview
   - ✅ Year overview
   - ✅ Student metrics
   - ✅ Course metrics
   - ✅ Revenue metrics
   - ✅ PDF export
   - ✅ Excel export

### Performance Testing

Monitor:
- API response time (should be < 2 seconds)
- Chart rendering time
- Export file generation time
- Browser memory usage

---

## 📊 Data Structure

### AnalyticsData Interface

```typescript
export interface AnalyticsData {
  period: 'week' | 'month' | 'year';
  reportType: 'overview' | 'students' | 'courses' | 'revenue';
  
  overview: {
    totalStudents: number;
    previousStudents: number;
    activeStudents: number;
    previousActive: number;
    totalRevenue: number;
    previousRevenue: number;
    coursesCompleted: number;
    previousCompleted: number;
    averageScore: number;
    previousScore: number;
  };
  
  studentMetrics?: {
    enrollments: number[];
    labels: string[];
    topPerformers: Array<{
      name: string;
      score: number;
      progress: number;
    }>;
    engagementRate: number;
  };
  
  courseMetrics?: {
    completionRates: number[];
    courseNames: string[];
    mostPopular: Array<{
      name: string;
      enrollments: number;
      rating: number;
    }>;
  };
  
  revenueMetrics?: {
    daily: number[];
    monthly: number[];
    yearly: number[];
    labels: string[];
    byPlan: Record<string, number>;
    subscriptionTrends: {
      new: number;
      renewals: number;
      cancellations: number;
    };
  };
}
```

---

## 🔗 Related Documentation

- **Backend Change Report:** `/reports/backend_changes/backend_change_advanced_analytics_2025-11-06.md`
- **Swagger API Docs:** `https://naplan2.runasp.net/swagger`
- **Frontend Component:** `src/app/features/advanced-analytics/`
- **Analytics Service:** `src/app/core/services/advanced-analytics.service.ts`

---

## 📞 Support

For backend implementation questions:
- Review the Backend Change Report
- Contact Backend Team Lead
- Check Swagger documentation

For frontend integration issues:
- Check browser console for errors
- Verify API responses in Network tab
- Review this integration guide

---

**Last Updated:** November 6, 2025  
**Status:** Ready for Backend Implementation  
**Frontend Version:** Configured with Mock/Real toggle
