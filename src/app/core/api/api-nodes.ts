import { Course, CourseCategory } from '../../models/course.models';
import { Notification, NotificationStats, NotificationSettings } from '../../models/notification.models';

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
  addToCart: {
    url: '/Cart/add',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Subject added to cart successfully',
      errors: []
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
  removeFromCart: {
    url: '/Cart/remove/:id',
    method: 'DELETE' as const,
    mockData: {
      success: true,
      message: 'Course removed from cart'
    }
  },

  // ===== NOTIFICATIONS API =====

  // Get all notifications for user
  getNotifications: {
    url: '\/notifications',
    method: 'GET' as const,
    mockData: [
      {
        id: '1',
        title: 'New Course Available!',
        message: 'Advanced Mathematics course is now available for enrollment.',
        type: 'course' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        priority: 'medium' as const,
        actionUrl: '/subjects/123',
        actionText: 'View Course',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        metadata: { courseId: 123 }
      },
      {
        id: '2',
        title: 'Assignment Due Tomorrow',
        message: 'Your Mathematics assignment is due tomorrow at 11:59 PM.',
        type: 'warning' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        priority: 'high' as const,
        actionUrl: '/student/assignments/456',
        actionText: 'View Assignment'
      },
      {
        id: '3',
        title: 'Course Completed!',
        message: 'Congratulations! You have successfully completed English Language Skills.',
        type: 'success' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        priority: 'medium' as const,
        actionUrl: '/student/certificates/789',
        actionText: 'Download Certificate'
      },
      {
        id: '4',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday 2-4 AM. Services may be unavailable.',
        type: 'info' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        priority: 'low' as const
      },
      {
        id: '5',
        title: 'Payment Successful',
        message: 'Your payment of $55 for Science Exploration course has been processed.',
        type: 'success' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
        priority: 'medium' as const,
        actionUrl: '/student/orders/order-123',
        actionText: 'View Receipt'
      }
    ] as Notification[]
  },

  // Get notification statistics
  getNotificationStats: {
    url: '\/notifications/stats',
    method: 'GET' as const,
    mockData: {
      totalCount: 25,
      unreadCount: 8,
      todayCount: 3,
      weekCount: 12,
      typeBreakdown: {
        course: 8,
        system: 4,
        success: 6,
        warning: 4,
        info: 2,
        error: 1
      }
    } as NotificationStats
  },

  // Mark notification as read
  markNotificationAsRead: {
    url: '\/notifications/:id/read',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Notification marked as read'
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: {
    url: '\/notifications/read-all',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'All notifications marked as read'
    }
  },

  // Delete notification
  deleteNotification: {
    url: '\/notifications/:id',
    method: 'DELETE' as const,
    mockData: {
      success: true,
      message: 'Notification deleted successfully'
    }
  },

  // Get notification settings
  getNotificationSettings: {
    url: '\/notifications/settings',
    method: 'GET' as const,
    mockData: {
      userId: 'user-123',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      courseUpdates: true,
      systemAlerts: true,
      marketingEmails: false,
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      }
    } as NotificationSettings
  },

  // Update notification settings
  updateNotificationSettings: {
    url: '\/notifications/settings',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Notification settings updated successfully'
    }
  },

  // Create new notification (admin only)
  createNotification: {
    url: '\/notifications',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Notification created successfully',
      notificationId: 'new-notification-id'
    }
  },

  // ===== LESSONS API =====

  // Get all lessons
  getAllLessons: {
    url: '\/lessons',
    method: 'GET' as const,
    mockData: [] as any[] // Will be populated by the service
  },

  // Get lesson by ID
  getLessonById: {
    url: '\/lessons/:id',
    method: 'GET' as const,
    mockData: {} as any // Will be populated by the service
  },

  // Get lessons by course ID
  getLessonsByCourse: {
    url: '\/subjects/:courseId/lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get student lessons with progress
  getStudentLessons: {
    url: '\/students/:studentId/lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Update lesson progress
  updateLessonProgress: {
    url: '\/lessons/:id/progress',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Progress updated successfully'
    }
  },

  // Rate a lesson
  ratLesson: {
    url: '\/lessons/:id/rate',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Lesson rated successfully'
    }
  },

  // Get lesson statistics for student
  getStudentLessonStats: {
    url: '\/students/:studentId/lessons/stats',
    method: 'GET' as const,
    mockData: {
      completedLessons: 0,
      totalLessons: 0,
      completionRate: 0,
      totalTimeSpent: 0,
      averageRating: 0,
      currentStreak: 0
    }
  },

  // Check course enrollment status
  checkEnrollment: {
    url: '\/subjects/:id/enrollment',
    method: 'GET' as const,
    mockData: {
      enrolled: false
    }
  },

  // Get user's enrolled courses
  getEnrolledCourses: {
    url: '\/user/enrolled-courses',
    method: 'GET' as const,
    mockData: []
  }
};

export type ApiEndpoint = keyof typeof ApiNodes;
