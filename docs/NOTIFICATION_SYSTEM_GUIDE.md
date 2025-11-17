# 📱 Frontend Integration Guide - Notification System
## Complete API Documentation & Implementation Guide

**Version:** 1.0  
**Last Updated:** November 15, 2025  
**Backend Status:** ✅ Production Ready  
**API Base URL:** `https://naplan2.runasp.net/api`

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Real-time Updates](#real-time-updates)
6. [Implementation Examples](#implementation-examples)
7. [UI Components](#ui-components)
8. [Testing Guide](#testing-guide)

---

## 🎯 System Overview

### What is the Notification System?

A complete notification platform that sends alerts to users across 4 channels:
- 📱 **In-App Notifications** (Primary - Always enabled)
- 📧 **Email** (Optional - User can toggle)
- 📨 **SMS** (Optional - User can toggle)
- 🔔 **Push Notifications** (Optional - User can toggle)

### Notification Events (16 Active)

| Category | Events | Description |
|----------|--------|-------------|
| **Student** | 4 | Profile updates, password changes, lesson progress |
| **Discussion** | 2 | Replies, helpful marks |
| **Content** | 4 | Submissions, approvals, rejections |
| **Registration** | 1 | New user registrations |
| **Exam** | 1 | New exam availability |
| **Payment** | 2 | High-value payments, session payments |
| **Refund** | 1 | Refund requests |
| **System** | 1 | Critical system errors |
| **Total** | **16** | **All implemented** ✅ |

---

## 🔐 Authentication

### Required Headers

All API calls require authentication:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📡 API Endpoints

### Base URL: `/api/Notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/Notifications` | Get all notifications |
| GET | `/api/Notifications/unread-count` | Get unread count |
| PUT | `/api/Notifications/{id}/read` | Mark as read |
| PUT | `/api/Notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/Notifications/{id}` | Delete notification |
| GET | `/api/Notifications/preferences` | Get preferences |
| PUT | `/api/Notifications/preferences` | Update preferences |
| POST | `/api/Orders/{orderId}/request-refund` | Request refund |

---

## 📊 Data Models

See TypeScript interfaces in `src/app/models/notification.models.ts`

---

## 💻 Implementation Status

### ✅ Completed
- Notification models updated
- API endpoint definitions exist
- Basic notification service exists
- Basic notification component exists

### 🔄 Needs Update
- Update notification service to match new API
- Create notification bell component
- Create notification settings page
- Add time-ago pipe
- Update routing

---

## 🚀 Next Steps

1. **Update Notification Service** - Match new API endpoints
2. **Create Notification Bell** - For navbar
3. **Create Settings Page** - For preferences
4. **Add Polling** - For real-time updates
5. **Test Everything** - Verify all functionality

---

**Status:** Documentation Created ✅  
**Implementation:** In Progress 🔄
