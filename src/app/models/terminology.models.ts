/**
 * Terminology Configuration Models
 * Allows clients to customize labels for Term and Week throughout the application
 * Example: Rename "Term" to "Parts", "Week" to "Sessions", etc.
 */

// ============================================
// Terminology Configuration
// ============================================

export interface TerminologyConfig {
  id?: number;
  organizationId?: number;

  // Term Terminology
  termLabel: string;           // Default: "Term", Custom: "Part", "Unit", "Module", etc.
  termNumberLabel: string;     // Default: "Term Number", Custom: "Part Number", etc.
  termSingular: string;        // Default: "term", used in messages
  termPlural: string;          // Default: "terms", used in lists

  // Week Terminology
  weekLabel: string;           // Default: "Week", Custom: "Session", "Chapter", etc.
  weekNumberLabel: string;     // Default: "Week Number", Custom: "Session Number", etc.
  weekSingular: string;        // Default: "week", used in messages
  weekPlural: string;          // Default: "weeks", used in lists

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateTerminologyConfigDto {
  termLabel: string;
  termNumberLabel: string;
  termSingular: string;
  termPlural: string;
  weekLabel: string;
  weekNumberLabel: string;
  weekSingular: string;
  weekPlural: string;
}

export interface UpdateTerminologyConfigDto {
  termLabel?: string;
  termNumberLabel?: string;
  termSingular?: string;
  termPlural?: string;
  weekLabel?: string;
  weekNumberLabel?: string;
  weekSingular?: string;
  weekPlural?: string;
}

// Default configuration - Standard English terminology
export const DEFAULT_TERMINOLOGY: TerminologyConfig = {
  termLabel: 'Term',
  termNumberLabel: 'Term Number',
  termSingular: 'term',
  termPlural: 'terms',
  weekLabel: 'Week',
  weekNumberLabel: 'Week Number',
  weekSingular: 'week',
  weekPlural: 'weeks'
};

// Preset configurations for common use cases
export const TERMINOLOGY_PRESETS = {
  standard: DEFAULT_TERMINOLOGY,
  parts: {
    termLabel: 'Part',
    termNumberLabel: 'Part Number',
    termSingular: 'part',
    termPlural: 'parts',
    weekLabel: 'Session',
    weekNumberLabel: 'Session Number',
    weekSingular: 'session',
    weekPlural: 'sessions'
  },
  modules: {
    termLabel: 'Module',
    termNumberLabel: 'Module Number',
    termSingular: 'module',
    termPlural: 'modules',
    weekLabel: 'Lesson',
    weekNumberLabel: 'Lesson Number',
    weekSingular: 'lesson',
    weekPlural: 'lessons'
  },
  units: {
    termLabel: 'Unit',
    termNumberLabel: 'Unit Number',
    termSingular: 'unit',
    termPlural: 'units',
    weekLabel: 'Topic',
    weekNumberLabel: 'Topic Number',
    weekSingular: 'topic',
    weekPlural: 'topics'
  }
};
