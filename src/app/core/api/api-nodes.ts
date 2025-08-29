import { Course, CourseCategory } from '../../models/course.models';
import { Notification, NotificationStats, NotificationSettings } from '../../models/notification.models';

/**
 * API Nodes specification for courses
 * Contains endpoint definitions and mock data for fallback scenarios
 */
export const ApiNodes = {
  // Get all courses
  getAllCourses: {
    url: '/api/courses',
    method: 'GET' as const,
    mockData: [
      {
        id: 1,
        name: 'English Language Skills',
        description: 'Master English reading, writing, and comprehension skills for NAPLAN success.',
        price: 55,
        originalPrice: 75,
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Language',
        level: 'Beginner' as const,
        duration: '8 weeks',
        instructor: 'Sarah Johnson',
        rating: 4.5,
        studentsCount: 156,
        tags: ['English', 'Reading', 'Writing'],
        week: 1,
        term: 1,
        subject: 'English'
      },
      {
        id: 2,
        name: 'Mathematics Fundamentals',
        description: 'Build strong mathematical foundations with comprehensive problem-solving techniques.',
        price: 55,
        originalPrice: 70,
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Mathematics',
        level: 'Intermediate' as const,
        duration: '10 weeks',
        instructor: 'Michael Chen',
        rating: 4.7,
        studentsCount: 203,
        tags: ['Math', 'Problem Solving', 'Algebra'],
        week: 1,
        term: 1,
        subject: 'Math'
      },
      {
        id: 3,
        name: 'Science Exploration',
        description: 'Discover the wonders of science through interactive experiments and demonstrations.',
        price: 55,
        originalPrice: 80,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Science',
        level: 'Beginner' as const,
        duration: '6 weeks',
        instructor: 'Dr. Emily Watson',
        rating: 4.6,
        studentsCount: 128,
        tags: ['Science', 'Experiments', 'Biology'],
        week: 1,
        term: 1,
        subject: 'Science'
      },
      {
        id: 4,
        name: 'History & Society',
        description: 'Explore historical events and social studies to understand our world better.',
        price: 55,
        originalPrice: 65,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Social Studies',
        level: 'Intermediate' as const,
        duration: '8 weeks',
        instructor: 'Prof. David Miller',
        rating: 4.4,
        studentsCount: 95,
        tags: ['History', 'Society', 'Culture'],
        week: 1,
        term: 1,
        subject: 'HASS'
      },
      {
        id: 5,
        name: 'Advanced English Literature',
        description: 'Dive deep into classic and contemporary literature with critical analysis.',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Language',
        level: 'Advanced' as const,
        duration: '12 weeks',
        instructor: 'Dr. Amanda Clarke',
        rating: 4.8,
        studentsCount: 67,
        tags: ['Literature', 'Analysis', 'Writing'],
        week: 2,
        term: 2,
        subject: 'English'
      },
      {
        id: 6,
        name: 'Calculus & Advanced Math',
        description: 'Master advanced mathematical concepts including calculus and statistics.',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Mathematics',
        level: 'Advanced' as const,
        duration: '14 weeks',
        instructor: 'Prof. Robert Kim',
        rating: 4.9,
        studentsCount: 89,
        tags: ['Calculus', 'Statistics', 'Advanced Math'],
        week: 2,
        term: 2,
        subject: 'Math'
      },
      {
        id: 7,
        name: 'Chemistry & Physics',
        description: 'Explore the fascinating world of chemistry and physics through hands-on learning.',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Science',
        level: 'Intermediate' as const,
        duration: '10 weeks',
        instructor: 'Dr. Lisa Park',
        rating: 4.5,
        studentsCount: 112,
        tags: ['Chemistry', 'Physics', 'Lab Work'],
        week: 2,
        term: 2,
        subject: 'Science'
      },
      {
        id: 8,
        name: 'Geography & Environmental Studies',
        description: 'Understand our planet and environmental challenges facing the modern world.',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Social Studies',
        level: 'Beginner' as const,
        duration: '8 weeks',
        instructor: 'Dr. James Wilson',
        rating: 4.3,
        studentsCount: 134,
        tags: ['Geography', 'Environment', 'Climate'],
        week: 2,
        term: 2,
        subject: 'HASS'
      }
    ] as Course[]
  },

  // Get course by ID
  getCourseById: {
    url: '/api/courses/:id',
    method: 'GET' as const,
    mockData: {
      id: 1,
      name: 'English Language Skills',
      description: 'Master English reading, writing, and comprehension skills for NAPLAN success. This comprehensive course covers all aspects of English language learning including grammar, vocabulary, reading comprehension, and essay writing.',
      price: 55,
      originalPrice: 75,
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      category: 'Language',
      level: 'Beginner' as const,
      duration: '8 weeks',
      instructor: 'Sarah Johnson',
      rating: 4.5,
      studentsCount: 156,
      tags: ['English', 'Reading', 'Writing'],
      week: 1,
      term: 1,
      subject: 'English'
    } as Course
  },

  // Get courses by category
  getCoursesByCategory: {
    url: '/api/courses/category/:category',
    method: 'GET' as const,
    mockData: [] as Course[]
  },

  // Get course categories
  getCategories: {
    url: '/api/courses/categories',
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
    url: '/api/courses/:id/enroll',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Successfully enrolled in course',
      enrollmentId: 12345
    }
  },

  // Add to cart
  addToCart: {
    url: '/api/cart/add',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Course added to cart successfully',
      cartItemCount: 1
    }
  },

  // Get cart items
  getCartItems: {
    url: '/api/cart',
    method: 'GET' as const,
    mockData: {
      items: [],
      totalAmount: 0,
      totalItems: 0
    }
  },

  // Remove from cart
  removeFromCart: {
    url: '/api/cart/remove/:id',
    method: 'DELETE' as const,
    mockData: {
      success: true,
      message: 'Course removed from cart'
    }
  },

  // ===== NOTIFICATIONS API =====

  // Get all notifications for user
  getNotifications: {
    url: '/api/notifications',
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
        actionUrl: '/courses/123',
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
    url: '/api/notifications/stats',
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
    url: '/api/notifications/:id/read',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Notification marked as read'
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: {
    url: '/api/notifications/read-all',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'All notifications marked as read'
    }
  },

  // Delete notification
  deleteNotification: {
    url: '/api/notifications/:id',
    method: 'DELETE' as const,
    mockData: {
      success: true,
      message: 'Notification deleted successfully'
    }
  },

  // Get notification settings
  getNotificationSettings: {
    url: '/api/notifications/settings',
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
    url: '/api/notifications/settings',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Notification settings updated successfully'
    }
  },

  // Create new notification (admin only)
  createNotification: {
    url: '/api/notifications',
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
    url: '/api/lessons',
    method: 'GET' as const,
    mockData: [] as any[] // Will be populated by the service
  },

  // Get lesson by ID
  getLessonById: {
    url: '/api/lessons/:id',
    method: 'GET' as const,
    mockData: {} as any // Will be populated by the service
  },

  // Get lessons by course ID
  getLessonsByCourse: {
    url: '/api/courses/:courseId/lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get student lessons with progress
  getStudentLessons: {
    url: '/api/students/:studentId/lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Get lessons by subject ID
  getLessonsBySubject: {
    url: '/api/subjects/:subjectId/lessons',
    method: 'GET' as const,
    mockData: [] as any[]
  },

  // Update lesson progress
  updateLessonProgress: {
    url: '/api/lessons/:id/progress',
    method: 'PUT' as const,
    mockData: {
      success: true,
      message: 'Progress updated successfully'
    }
  },

  // Rate a lesson
  ratLesson: {
    url: '/api/lessons/:id/rate',
    method: 'POST' as const,
    mockData: {
      success: true,
      message: 'Lesson rated successfully'
    }
  },

  // Get lesson statistics for student
  getStudentLessonStats: {
    url: '/api/students/:studentId/lessons/stats',
    method: 'GET' as const,
    mockData: {
      completedLessons: 0,
      totalLessons: 0,
      completionRate: 0,
      totalTimeSpent: 0,
      averageRating: 0,
      currentStreak: 0
    }
  }
};

export type ApiEndpoint = keyof typeof ApiNodes;
