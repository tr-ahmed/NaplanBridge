import { Course, CourseCategory } from '../../models/course.models';

/**
 * API Nodes specification for courses
 * Contains endpoint definitions and mock data for fallback scenarios
 */
export const ApiNodes = {
  // Get all courses
  getAllCourses: {
    url: '/subjects',
    method: 'GET' as const,
    mockData: [
      {
        id: 1,
        yearId: 1,
        subjectNameId: 1,
        subjectName: "Mathematics",
        categoryId: 1,
        categoryName: "STEM",
        categoryDescription: "Science, Technology, Engineering, Mathematics",
        price: 0,
        originalPrice: 0,
        discountPercentage: 0,
        posterUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595681/360_F_60467600_edVkJvDs6Zl0HMo6x6IdZoO5Qv3WZQ64_iqcumo.jpg",
        level: "Beginner" as const,
        duration: 4,
        weekNumber: 8,
        termNumber: 4,
        studentCount: 0,
        termIds: [1, 2, 3, 4],
        weekIds: [1, 2, 3, 4, 5, 6, 7, 8],
        // Legacy fields for backwards compatibility
        name: "Mathematics",
        description: "Master mathematical foundations with comprehensive problem-solving techniques.",
        imageUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595681/360_F_60467600_edVkJvDs6Zl0HMo6x6IdZoO5Qv3WZQ64_iqcumo.jpg",
        category: "STEM",
        instructor: "Michael Chen",
        rating: 4.7,
        studentsCount: 0,
        tags: ["Math", "Problem Solving", "Algebra"],
        week: 1,
        term: 1,
        subject: "Math"
      },
      {
        id: 2,
        yearId: 1,
        subjectNameId: 3,
        subjectName: "Physics",
        categoryId: 1,
        categoryName: "STEM",
        categoryDescription: "Science, Technology, Engineering, Mathematics",
        price: 0,
        originalPrice: 0,
        discountPercentage: 0,
        posterUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595701/15d113bc1c28ef9fa418d2c4812a16e8_mmbfrd.jpg",
        level: "Beginner" as const,
        duration: 4,
        weekNumber: 8,
        termNumber: 4,
        studentCount: 0,
        termIds: [5, 6, 7, 8],
        weekIds: [9, 10, 11, 12, 13, 14, 15, 16],
        // Legacy fields for backwards compatibility
        name: "Physics",
        description: "Explore the fascinating world of physics through hands-on learning and experiments.",
        imageUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595701/15d113bc1c28ef9fa418d2c4812a16e8_mmbfrd.jpg",
        category: "STEM",
        instructor: "Dr. Lisa Park",
        rating: 4.5,
        studentsCount: 0,
        tags: ["Physics", "Lab Work", "Science"],
        week: 2,
        term: 2,
        subject: "Science"
      },
      {
        id: 3,
        yearId: 1,
        subjectNameId: 5,
        subjectName: "English",
        categoryId: 2,
        categoryName: "Social Studies",
        categoryDescription: "Arts, Business, Social Science, Psychology",
        price: 0,
        originalPrice: 0,
        discountPercentage: 0,
        posterUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595786/english_he2iy4.jpg",
        level: "Beginner" as const,
        duration: 4,
        weekNumber: 8,
        termNumber: 4,
        studentCount: 0,
        termIds: [9, 10, 11, 12],
        weekIds: [17, 18, 19, 20, 21, 22, 23, 24],
        // Legacy fields for backwards compatibility
        name: "English",
        description: "Master English reading, writing, and comprehension skills for academic success.",
        imageUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595786/english_he2iy4.jpg",
        category: "Social Studies",
        instructor: "Sarah Johnson",
        rating: 4.5,
        studentsCount: 0,
        tags: ["English", "Reading", "Writing"],
        week: 1,
        term: 1,
        subject: "English"
      }
    ] as Course[]
  },

  // Get course by ID
  getCourseById: {
    url: '/subjects/:id',
    method: 'GET' as const,
    mockData: {
      id: 1,
      yearId: 1,
      subjectNameId: 1,
      subjectName: "Mathematics",
      categoryId: 1,
      categoryName: "STEM",
      categoryDescription: "Science, Technology, Engineering, Mathematics",
      price: 0,
      originalPrice: 0,
      discountPercentage: 0,
      posterUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595681/360_F_60467600_edVkJvDs6Zl0HMo6x6IdZoO5Qv3WZQ64_iqcumo.jpg",
      level: "Beginner" as const,
      duration: 4,
      weekNumber: 8,
      termNumber: 4,
      studentCount: 0,
      termIds: [1, 2, 3, 4],
      weekIds: [1, 2, 3, 4, 5, 6, 7, 8],
      // Legacy fields for backwards compatibility
      name: "Mathematics",
      description: "Master mathematical foundations with comprehensive problem-solving techniques. This comprehensive course covers all aspects of mathematical learning including algebra, geometry, problem-solving techniques, and mathematical reasoning.",
      imageUrl: "https://res.cloudinary.com/drm73zopa/image/upload/v1757595681/360_F_60467600_edVkJvDs6Zl0HMo6x6IdZoO5Qv3WZQ64_iqcumo.jpg",
      category: "STEM",
      instructor: "Michael Chen",
      rating: 4.7,
      studentsCount: 0,
      tags: ["Math", "Problem Solving", "Algebra"],
      week: 1,
      term: 1,
      subject: "Math"
    } as Course
  },

  // Get courses by category
  getCoursesByCategory: {
    url: '\/subjects/category/:category',
    method: 'GET' as const,
    mockData: [] as Course[]
  },

  // Get course categories
  getCategories: {
    url: '\/subjects/categories',
    method: 'GET' as const,
    mockData: [
      {
        id: 'language',
        name: 'Language',
        icon: 'fas fa-language',
        description: 'English and other language courses'
      },
      {
        id: 'mathematics',
        name: 'Mathematics',
        icon: 'fas fa-calculator',
        description: 'Mathematical skills and problem solving'
      },
      {
        id: 'science',
        name: 'Science',
        icon: 'fas fa-flask',
        description: 'Scientific exploration and experiments'
      },
      {
        id: 'social-studies',
        name: 'Social Studies',
        icon: 'fas fa-globe',
        description: 'History, geography, and social sciences'
      }
    ] as CourseCategory[]
  },

  // Enroll in course
  enrollInCourse: {
    url: '\/subjects/:id/enroll',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Successfully enrolled in course',
      enrollmentId: 12345
    }
  },

  // Add to cart
  // ⚠️ NOTE: This endpoint requires subscriptionPlanId + studentId, NOT subjectId
  // Request body: { subscriptionPlanId: number, studentId: number, quantity: number }
  addToCart: {
    url: '/Cart/add',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Subscription plan added to cart successfully',
      cartId: 1,
      itemId: 1,
      totalItems: 1,
      totalAmount: 29.99
    }
  },

  // Get cart items
  getCartItems: {
    url: '/Cart',
    method: 'GET' as const,
    mockData: {
      items: [],
      totalAmount: 0,
      totalItems: 0
    }
  },

  // Remove from cart
  // ⚠️ NOTE: Backend endpoint is /Cart/items/{cartItemId}, not /Cart/remove/{id}
  removeFromCart: {
    url: '/Cart/items/:id',
    method: 'DELETE' as const,
    mockData: {
      success: true,
      message: 'Item removed from cart'
    }
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
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get all lessons
  getAllLessons: {
    url: '/Lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get lesson by ID
  getLessonById: {
    url: '/Lessons/:id',
    method: 'GET' as const,
    mockData: {} as any
  },

  // Get student lessons
  getStudentLessons: {
    url: '/Lessons/student/:studentId',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get lessons by subject with progress
  getLessonsBySubjectWithProgress: {
    url: '/Lessons/subject/:subjectId/with-progress',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get lessons by term with progress
  getLessonsByTermWithProgress: {
    url: '/Lessons/term/:termId/with-progress',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get lessons by term number with progress
  getLessonsByTermNumberWithProgress: {
    url: '/Lessons/subject/:subjectId/term-number/:termNumber/with-progress',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Update lesson progress
  updateLessonProgress: {
    url: '/Progress',
    method: 'POST' as const,
    mockData: { success: true }
  },

  // Rate lesson
  rateLesson: {
    url: '/Lessons/:id/rate',
    method: 'POST' as const,
    mockData: { success: true }
  },

  // Get student lesson stats
  getStudentLessonStats: {
    url: '/Lessons/student/:studentId/stats',
    method: 'GET' as const,
    mockData: {} as any
  },

  // Check enrollment
  checkEnrollment: {
    url: '/Enrollments/check',
    method: 'GET' as const,
    mockData: { enrolled: false }
  },

  // Get enrolled courses
  getEnrolledCourses: {
    url: '/Enrollments/courses',
    method: 'GET' as const,
    mockData: [] as any[]
  }
};

export type ApiEndpoint = keyof typeof ApiNodes;
