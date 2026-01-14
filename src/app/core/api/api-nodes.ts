/**
 * API Nodes specification for courses
 * Contains endpoint definitions for API calls
 */
export const ApiNodes = {
  // Get all courses
  getAllCourses: {
    url: '/subjects',
    method: 'GET' as const
  },

  // Get course by ID
  getCourseById: {
    url: '/subjects/:id',
    method: 'GET' as const
  },

  // Get courses by category
  getCoursesByCategory: {
    url: '\/subjects/category/:category',
    method: 'GET' as const
  },

  // Get course categories
  getCategories: {
    url: '\/subjects/categories',
    method: 'GET' as const
  },

  // Enroll in course
  enrollInCourse: {
    url: '\/subjects/:id/enroll',
    method: 'POST' as const
  },

  // Add to cart
  // ⚠️ NOTE: This endpoint requires subscriptionPlanId + studentId, NOT subjectId
  // Request body: { subscriptionPlanId: number, studentId: number, quantity: number }
  addToCart: {
    url: '/Cart/add',
    method: 'POST' as const
  },

  // Get cart items
  getCartItems: {
    url: '/Cart',
    method: 'GET' as const
  },

  // Remove from cart
  // ⚠️ NOTE: Backend endpoint is /Cart/items/{cartItemId}, not /Cart/remove/{id}
  removeFromCart: {
    url: '/Cart/items/:id',
    method: 'DELETE' as const
  },

  // ===== NOTIFICATIONS API (Updated to match Backend) =====

  // Note: Notification endpoints have been moved to NotificationService
  // The service directly calls the API endpoints without mock data
  // For reference, the endpoints are:
  // - GET /api/Notifications (with query params)
  // - GET /api/Notifications/unread-count
  // - PUT /api/Notifications/{id}/read
  // - PUT /api/Notifications/mark-all-read
  // - DELETE /api/Notifications/{id}
  // - GET /api/Notifications/preferences
  // - PUT /api/Notifications/preferences
  // - POST /api/Orders/{orderId}/request-refund

  // ===== LESSONS API =====

  // Get lessons by subject ID
  getLessonsBySubjectId: {
    url: '/Lessons/subject/:subjectId',
    method: 'GET' as const
  },

  // Get all lessons
  getAllLessons: {
    url: '/Lessons',
    method: 'GET' as const
  },

  // Get lesson by ID
  getLessonById: {
    url: '/Lessons/:id',
    method: 'GET' as const
  },

  // Get student lessons
  getStudentLessons: {
    url: '/Lessons/student/:studentId/in-progress',
    method: 'GET' as const
  },

  // Get lessons by subject with progress
  getLessonsBySubjectWithProgress: {
    url: '/Lessons/subject/:subjectId/with-progress',
    method: 'GET' as const
  },

  // Get lessons by term with progress
  getLessonsByTermWithProgress: {
    url: '/Lessons/term/:termId/with-progress',
    method: 'GET' as const
  },

  // Get lessons by term number with progress
  getLessonsByTermNumberWithProgress: {
    url: '/Lessons/subject/:subjectId/term-number/:termNumber/with-progress',
    method: 'GET' as const
  },

  // Update lesson progress
  updateLessonProgress: {
    url: '/Progress/students/:studentId/lessons/:lessonId',
    method: 'POST' as const
  },

  // Rate lesson
  rateLesson: {
    url: '/Lessons/:id/rate',
    method: 'POST' as const
  },

  // Get student lesson stats
  getStudentLessonStats: {
    url: '/Lessons/student/:studentId/stats',
    method: 'GET' as const
  },

  // Check enrollment
  checkEnrollment: {
    url: '/Enrollments/check',
    method: 'GET' as const
  },

  // Get enrolled courses
  getEnrolledCourses: {
    url: '/Enrollments/courses',
    method: 'GET' as const
  }
};

export type ApiEndpoint = keyof typeof ApiNodes;
