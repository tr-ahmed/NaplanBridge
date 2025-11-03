/**
 * Video Provider Types - Based on Backend API
 * Supports 4 providers: Mux (recommended), BunnyStream, BunnyStorage, Cloudinary
 */
export type VideoProvider = 'Mux' | 'BunnyStream' | 'BunnyStorage' | 'Cloudinary';

export const VideoProviders = {
  MUX: 'Mux' as VideoProvider,                  // Recommended - Premium streaming with HLS, DRM, Analytics
  BUNNY_STREAM: 'BunnyStream' as VideoProvider,  // Adaptive streaming with HLS/DASH
  BUNNY_STORAGE: 'BunnyStorage' as VideoProvider,// Simple CDN storage + delivery
  CLOUDINARY: 'Cloudinary' as VideoProvider      // Deprecated - Legacy support
};

/**
 * Question Types - Based on Backend API
 */
export type QuestionType = 'Text' | 'MultipleChoice' | 'MultipleSelect' | 'TrueFalse';

export const QuestionTypes = {
  TEXT: 'Text' as QuestionType,
  MULTIPLE_CHOICE: 'MultipleChoice' as QuestionType,
  MULTIPLE_SELECT: 'MultipleSelect' as QuestionType,
  TRUE_FALSE: 'TrueFalse' as QuestionType
};

/**
 * Resource Types
 */
export type ResourceType = 'PDF' | 'Image' | 'Document' | 'Link' | 'Other';

/**
 * Interface for Lesson data - Updated to match API response
 */
export interface Lesson {
  id: number;
  weekId: number;
  title: string;
  description?: string;

  // Video Info (Multi-Provider Support)
  videoUrl?: string;
  videoProvider?: VideoProvider;
  videoDuration?: number; // in seconds
  duration?: number; // alias for videoDuration
  posterUrl?: string;
  thumbnailUrl?: string; // alias for posterUrl

  // Bunny.net-specific fields (when videoProvider === 'BunnyStream' or 'BunnyStorage')
  bunnyVideoId?: string;        // Video ID from Bunny.net
  bunnyStoragePath?: string;    // Storage path for BunnyStorage

  // Mux-specific fields (when videoProvider === 'Mux')
  muxPlaybackId?: string;
  muxAssetId?: string;

  // Structure
  order: number;
  subject?: string; // subject name
  term?: number;
  termId?: number;
  week?: number;

  // Resources
  resources: Resource[];

  // Questions
  questionCount?: number;

  // Stats
  viewCount?: number;
  completionRate?: number;

  // Computed/derived fields (not from API)
  courseId?: number;
  courseName?: string;
  isCompleted?: boolean;
  rating?: number;
  totalRatings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isLocked?: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
  prerequisites?: number[];
  learningObjectives?: string[];
}

/**
 * Lesson Details - Extended version
 */
export interface LessonDetails extends Lesson {
  weekNumber?: number;
  termId?: number;
  termNumber?: number;
  subjectId?: number;
  subjectName?: string;
  questions?: LessonQuestion[];
}

/**
 * Lesson Question Models
 */
export interface LessonQuestion {
  id: number;
  lessonId: number;
  questionText: string;
  questionType: QuestionType;
  order: number;
  options?: QuestionOption[];
  videoMinute?: number;
  isMultipleChoice?: boolean;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect: boolean;
}

export interface LessonQuestionAnswer {
  questionId: number;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  textAnswer?: string;
}

/**
 * Interface for Lesson Resource (PDFs, exercises, etc.)
 */
export interface Resource {
  id: number;
  lessonId: number;
  title: string;
  name?: string; // alias for title
  description?: string;
  resourceType: ResourceType;
  type?: ResourceType; // alias for resourceType
  resourceUrl: string;
  url?: string; // alias for resourceUrl
  fileSize?: number;
  uploadedAt?: string | Date;
  downloadable?: boolean;
}

// Legacy type alias for backward compatibility
export type LessonResource = Resource;

/**
 * Interface for Lesson Rating
 */
export interface LessonRating {
  id: number;
  lessonId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

/**
 * Create/Update Lesson DTOs
 */
export interface CreateLessonDto {
  weekId: number;
  title: string;
  description?: string;
  order: number;
  videoFile?: File;
  videoProvider?: VideoProvider;
}

export interface UpdateLessonDto {
  title?: string;
  description?: string;
  order?: number;
  videoFile?: File;
}

/**
 * Create/Update Lesson Question DTOs
 */
export interface CreateLessonQuestionDto {
  lessonId: number;
  questionText: string;
  questionType: QuestionType;
  order: number;
  videoMinute?: number;
  options?: CreateQuestionOptionDto[];
}

export interface CreateQuestionOptionDto {
  optionText: string;
  isCorrect: boolean;
}

export interface UpdateLessonQuestionDto {
  questionText?: string;
  questionType?: QuestionType;
  order?: number;
  videoMinute?: number;
  options?: CreateQuestionOptionDto[];
}

/**
 * Create/Update Resource DTOs
 */
export interface CreateResourceDto {
  lessonId: number;
  title: string;
  description?: string;
  resourceType: ResourceType;
  resourceFile?: File;
  resourceUrl?: string;
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  resourceType?: ResourceType;
  resourceFile?: File;
}

/**
 * Video Upload Response
 */
export interface VideoUploadResponse {
  videoUrl: string;
  videoId: string;
  videoProvider: VideoProvider;
  posterUrl?: string;
  duration?: number;
  status: 'processing' | 'ready' | 'error';
}

/**
 * Video Player Configuration
 */
export interface VideoPlayerConfig {
  videoUrl: string;
  posterUrl?: string;
  provider: VideoProvider;
  controls?: string[];
  settings?: string[];
  autoplay?: boolean;
  muted?: boolean;
  startTime?: number;

  // Mux-specific configuration
  muxPlaybackId?: string;
  muxAssetId?: string;
  metadataVideoTitle?: string;
  metadataViewerUserId?: string;
}

/**
 * Lesson Progress
 */
export interface LessonProgress {
  lessonId: number;
  userId: number;
  completed: boolean;
  progress: number;
  lastWatchedPosition?: number;
  completedAt?: Date;
  updatedAt: Date;
}

/**
 * Interface for Lesson Progress
 */
export interface LessonProgress {
  lessonId: number;
  studentId: number;
  progress: number; // 0-100 percentage
  timeSpent: number; // in minutes
  currentPosition?: number; // video position in seconds
  isCompleted: boolean;
  completedAt?: Date;
  attempts: number;
}

/**
 * Interface for Student's enrolled lessons with progress
 */
export interface StudentLesson {
  lesson: Lesson;
  progress: LessonProgress;
  canAccess: boolean;
  nextLesson?: Lesson;
  previousLesson?: Lesson;
}

/**
 * Interface for Lesson Filter options - Updated to use IDs
 */
export interface LessonFilter {
  courseId?: number;
  subjectId?: number; // Updated to use subjectId instead of subject string
  subject?: string; // Keep for backward compatibility
  termId?: number; // Updated to use termId
  term?: number; // Keep for backward compatibility
  weekId?: number; // Updated to use weekId
  week?: number; // Keep for backward compatibility
  difficulty?: string;
  isCompleted?: boolean;
  rating?: number;
}

/**
 * Interface for Student Lesson Statistics
 */
export interface StudentLessonStats {
  completedLessons: number;
  totalLessons: number;
  completionRate: number; // percentage
  totalTimeSpent: number; // in minutes
  averageRating: number;
  currentStreak: number; // consecutive days of study
}
