/**
 * Validation Helpers for Subscription Plans
 */

import { PlanType } from '../models/enums';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../models/subscription.models';

export interface ValidationError {
  field: string;
  message: string;
  messageAr?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate CreateSubscriptionPlanDto
 */
export function validateSubscriptionPlan(dto: CreateSubscriptionPlanDto): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!dto.name || dto.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Plan name is required',
      messageAr: 'اسم الخطة مطلوب'
    });
  }

  if (!dto.description || dto.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Plan description is required',
      messageAr: 'وصف الخطة مطلوب'
    });
  }

  if (!dto.price || dto.price <= 0) {
    errors.push({
      field: 'price',
      message: 'Price must be greater than 0',
      messageAr: 'السعر يجب أن يكون أكبر من 0'
    });
  }

  if (!dto.planType) {
    errors.push({
      field: 'planType',
      message: 'Plan type is required',
      messageAr: 'نوع الخطة مطلوب'
    });
    return { isValid: false, errors };
  }

  // Plan type specific validations
  switch (dto.planType) {
    case PlanType.SingleTerm:
      if (!dto.termId) {
        errors.push({
          field: 'termId',
          message: 'Term is required for Single Term plans',
          messageAr: 'الترم مطلوب لخطط الترم الواحد'
        });
      }
      if (!dto.subjectId) {
        errors.push({
          field: 'subjectId',
          message: 'Subject is required for Single Term plans',
          messageAr: 'المادة مطلوبة لخطط الترم الواحد'
        });
      }
      break;

    case PlanType.MultiTerm:
      if (!dto.subjectId) {
        errors.push({
          field: 'subjectId',
          message: 'Subject is required for Multi Term plans',
          messageAr: 'المادة مطلوبة لخطط الفصول المتعددة'
        });
      }
      if (!dto.includedTermIds || dto.includedTermIds.trim().length === 0) {
        errors.push({
          field: 'includedTermIds',
          message: 'At least 2 terms must be selected for Multi Term plans',
          messageAr: 'يجب اختيار فصلين على الأقل لخطط الفصول المتعددة'
        });
      } else {
        // Validate format and count
        const terms = dto.includedTermIds.split(',').map(t => t.trim()).filter(t => t);
        if (terms.length < 2) {
          errors.push({
            field: 'includedTermIds',
            message: 'Multi Term plans must include at least 2 terms',
            messageAr: 'خطط الفصول المتعددة يجب أن تتضمن فصلين على الأقل'
          });
        }
      }
      break;

    case PlanType.FullYear:
      if (!dto.yearId) {
        errors.push({
          field: 'yearId',
          message: 'Year is required for Full Year plans',
          messageAr: 'السنة مطلوبة لخطط السنة الكاملة'
        });
      }
      break;

    case PlanType.SubjectAnnual:
      if (!dto.subjectId) {
        errors.push({
          field: 'subjectId',
          message: 'Subject is required for Subject Annual plans',
          messageAr: 'المادة مطلوبة لخطط المادة السنوية'
        });
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get required fields for a plan type
 */
export function getRequiredFieldsForPlanType(planType: PlanType): string[] {
  const baseFields = ['name', 'description', 'price', 'planType'];

  switch (planType) {
    case PlanType.SingleTerm:
      return [...baseFields, 'subjectId', 'termId'];

    case PlanType.MultiTerm:
      return [...baseFields, 'subjectId', 'includedTermIds'];

    case PlanType.FullYear:
      return [...baseFields, 'yearId'];

    case PlanType.SubjectAnnual:
      return [...baseFields, 'subjectId'];

    default:
      return baseFields;
  }
}

/**
 * Calculate default duration for a plan type
 */
export function getDefaultDurationForPlanType(planType: PlanType, termsCount: number = 1): number {
  switch (planType) {
    case PlanType.SingleTerm:
      return 90;  // 3 months

    case PlanType.MultiTerm:
      return termsCount * 90;  // 3 months per term

    case PlanType.FullYear:
      return 365;  // 1 year

    case PlanType.SubjectAnnual:
      return 365;  // 1 year

    default:
      return 90;
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[], arabic: boolean = false): string {
  return errors
    .map(e => arabic && e.messageAr ? e.messageAr : e.message)
    .join('\n');
}
