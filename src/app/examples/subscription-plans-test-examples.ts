/**
 * Subscription Plans CRUD - Integration Test Examples
 * هذا الملف يحتوي على أمثلة اختبار كاملة لنظام CRUD
 */

import { Component, OnInit, Injectable } from '@angular/core';
import { SubscriptionPlansService } from '../core/services/subscription-plans.service';
import { CreateSubscriptionPlanDto } from '../models/subscription.models';
import { PlanType } from '../models/enums';
import { validateSubscriptionPlan } from '../utils/validation.helpers';

/**
 * Component للاختبار - يمكن استخدامه كمرجع
 */
@Injectable()
export class SubscriptionPlansTestExamples implements OnInit {

  constructor(private plansService: SubscriptionPlansService) {}

  ngOnInit() {
    // يمكن استدعاء الأمثلة من هنا للاختبار
  }

  // ==================== مثال 1: إنشاء Single Term Plan ====================

  example1_CreateSingleTermPlan() {
    console.log('📝 Example 1: Create Single Term Plan');

    const dto: CreateSubscriptionPlanDto = {
      name: 'Mathematics Year 7 - Term 1',
      description: 'Complete access to Mathematics lessons for Term 1',
      planType: PlanType.SingleTerm,  // = 1
      price: 49.99,
      subjectId: 5,   // Mathematics
      termId: 12,     // Term 1
      isActive: true
    };

    // Validate before sending
    const validation = validateSubscriptionPlan(dto);
    if (!validation.isValid) {
      console.error('❌ Validation Failed:', validation.errors);
      return;
    }

    // Create plan
    this.plansService.createPlan(dto).subscribe({
      next: (plan) => {
        console.log('✅ Single Term Plan Created:', plan);
        console.log('   - Plan ID:', plan.id);
        console.log('   - Name:', plan.name);
        console.log('   - Price: $', plan.price);
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 2: إنشاء Multi-Term Plan ====================

  example2_CreateMultiTermPlan() {
    console.log('📝 Example 2: Create Multi-Term Plan');

    const dto: CreateSubscriptionPlanDto = {
      name: 'Mathematics Year 7 - Terms 1 & 2 Bundle',
      description: 'Save 20% with this bundle package for Terms 1 and 2',
      planType: PlanType.MultiTerm,  // = 2
      price: 79.99,  // Original: 2 × $49.99 = $99.98, Save: $19.99
      subjectId: 5,   // Mathematics
      includedTermIds: '12,13',  // ✅ مطلوب للـ MultiTerm
      isActive: true
    };

    // Validate
    const validation = validateSubscriptionPlan(dto);
    if (!validation.isValid) {
      console.error('❌ Validation Failed:', validation.errors);
      return;
    }

    // Create
    this.plansService.createPlan(dto).subscribe({
      next: (plan) => {
        console.log('✅ Multi-Term Plan Created:', plan);
        console.log('   - Included Terms:', plan.includedTermIds);
        console.log('   - Savings: $19.99 (20%)');
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 3: إنشاء Full Year Plan ====================

  example3_CreateFullYearPlan() {
    console.log('📝 Example 3: Create Full Year Plan');

    const dto: CreateSubscriptionPlanDto = {
      name: 'Year 7 Complete Package',
      description: 'All subjects, all terms for Year 7 - Best Value!',
      planType: PlanType.FullYear,  // = 3
      price: 499.99,
      yearId: 2,  // Year 7
      isActive: true
    };

    // Validate
    const validation = validateSubscriptionPlan(dto);
    if (!validation.isValid) {
      console.error('❌ Validation Failed:', validation.errors);
      return;
    }

    // Create
    this.plansService.createPlan(dto).subscribe({
      next: (plan) => {
        console.log('✅ Full Year Plan Created:', plan);
        console.log('   - Coverage: All subjects, all terms');
        console.log('   - Duration: 365 days');
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 4: إنشاء Subject Annual Plan ====================

  example4_CreateSubjectAnnualPlan() {
    console.log('📝 Example 4: Create Subject Annual Plan');

    const dto: CreateSubscriptionPlanDto = {
      name: 'Mathematics Full Year Access',
      description: 'Complete access to all Mathematics content for the entire year (4 terms)',
      planType: PlanType.SubjectAnnual,  // = 4
      price: 149.99,  // vs 4 × $49.99 = $199.96, Save $49.97 (25%)
      subjectId: 5,   // Mathematics
      isActive: true
    };

    // Validate
    const validation = validateSubscriptionPlan(dto);
    if (!validation.isValid) {
      console.error('❌ Validation Failed:', validation.errors);
      return;
    }

    // Create
    this.plansService.createPlan(dto).subscribe({
      next: (plan) => {
        console.log('✅ Subject Annual Plan Created:', plan);
        console.log('   - Subject: Mathematics');
        console.log('   - All 4 terms included');
        console.log('   - Savings: $49.97 (25%)');
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 5: تحديث خطة موجودة ====================

  example5_UpdatePlan() {
    console.log('📝 Example 5: Update Existing Plan');

    const planId = 25;  // معرف الخطة المراد تحديثها

    const updateDto: CreateSubscriptionPlanDto = {
      name: 'Mathematics Year 7 - Term 1 (Special Offer)',
      description: 'Limited time offer - Save $5!',
      planType: PlanType.SingleTerm,
      price: 44.99,  // خصم من 49.99
      subjectId: 5,
      termId: 12,
      isActive: true
    };

    this.plansService.updatePlan(planId, updateDto).subscribe({
      next: (plan) => {
        console.log('✅ Plan Updated:', plan);
        console.log('   - New Price: $', plan.price);
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 6: تعطيل خطة ====================

  example6_DeactivatePlan() {
    console.log('📝 Example 6: Deactivate Plan');

    const planId = 25;

    this.plansService.deactivatePlan(planId).subscribe({
      next: () => {
        console.log('✅ Plan Deactivated Successfully');
        console.log('   - Plan ID:', planId);
        console.log('   - Status: Inactive');
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 7: الحصول على جميع الخطط ====================

  example7_GetAllPlans() {
    console.log('📝 Example 7: Get All Plans');

    this.plansService.getAllPlans().subscribe({
      next: (plans) => {
        console.log('✅ Loaded Plans:', plans.length);

        // تصنيف حسب النوع
        const byType = {
          SingleTerm: plans.filter(p => p.planType === PlanType.SingleTerm).length,
          MultiTerm: plans.filter(p => p.planType === PlanType.MultiTerm).length,
          FullYear: plans.filter(p => p.planType === PlanType.FullYear).length,
          SubjectAnnual: plans.filter(p => p.planType === PlanType.SubjectAnnual).length
        };

        console.log('   - Single Term:', byType.SingleTerm);
        console.log('   - Multi Term:', byType.MultiTerm);
        console.log('   - Full Year:', byType.FullYear);
        console.log('   - Subject Annual:', byType.SubjectAnnual);

        // الخطط النشطة
        const activePlans = plans.filter(p => p.isActive).length;
        console.log('   - Active Plans:', activePlans);
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 8: الحصول على خطط لـ Term محدد ====================

  example8_GetPlansForTerm() {
    console.log('📝 Example 8: Get Plans for Specific Term');

    const subjectId = 5;   // Mathematics
    const termNumber = 1;  // Term 1

    this.plansService.getAvailablePlansForTerm(subjectId, termNumber).subscribe({
      next: (response) => {
        console.log('✅ Plans for', response.subjectName, '-', response.termName);
        console.log('   - Available Plans:', response.availablePlans.length);

        response.availablePlans.forEach((plan, index) => {
          console.log(`   ${index + 1}. ${plan.planName}`);
          console.log(`      - Type: ${plan.planType}`);
          console.log(`      - Price: ${plan.currency} ${plan.price}`);
          console.log(`      - Duration: ${plan.duration}`);
          if (plan.isRecommended) {
            console.log(`      - ⭐ RECOMMENDED`);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 9: الحصول على جميع خطط مادة ====================

  example9_GetPlansForSubject() {
    console.log('📝 Example 9: Get All Plans for Subject');

    const subjectId = 5;  // Mathematics

    this.plansService.getAvailablePlansForSubject(subjectId).subscribe({
      next: (response) => {
        console.log('✅ Plans for', response.subjectName);
        console.log('   - Year:', response.yearNumber);
        console.log('   - Available Plans:', response.availablePlans.length);

        // الخطة الموصى بها
        const recommended = response.availablePlans.find(p => p.isRecommended);
        if (recommended) {
          console.log('   - Recommended:', recommended.planName);
          console.log('     Price:', recommended.currency, recommended.price);
          if (recommended.saveAmount) {
            console.log('     Savings:', recommended.currency, recommended.saveAmount);
          }
        }
      },
      error: (err) => {
        console.error('❌ Error:', err.message);
      }
    });
  }

  // ==================== مثال 10: Validation Test ====================

  example10_ValidationTest() {
    console.log('📝 Example 10: Validation Test');

    // حالة 1: Single Term بدون termId (خطأ)
    const invalidDto1: CreateSubscriptionPlanDto = {
      name: 'Test Plan',
      description: 'Test',
      planType: PlanType.SingleTerm,
      price: 49.99,
      subjectId: 5
      // termId مفقود - سيفشل Validation
    };

    const validation1 = validateSubscriptionPlan(invalidDto1);
    console.log('Test 1 - Single Term without termId:');
    console.log('  Valid:', validation1.isValid);
    console.log('  Errors:', validation1.errors.map(e => e.message));

    // حالة 2: Multi Term بدون includedTermIds (خطأ)
    const invalidDto2: CreateSubscriptionPlanDto = {
      name: 'Test Plan',
      description: 'Test',
      planType: PlanType.MultiTerm,
      price: 79.99,
      subjectId: 5
      // includedTermIds مفقود - سيفشل Validation
    };

    const validation2 = validateSubscriptionPlan(invalidDto2);
    console.log('Test 2 - Multi Term without includedTermIds:');
    console.log('  Valid:', validation2.isValid);
    console.log('  Errors:', validation2.errors.map(e => e.message));

    // حالة 3: خطة صحيحة (نجاح)
    const validDto: CreateSubscriptionPlanDto = {
      name: 'Valid Plan',
      description: 'This is valid',
      planType: PlanType.SingleTerm,
      price: 49.99,
      subjectId: 5,
      termId: 12,
      isActive: true
    };

    const validation3 = validateSubscriptionPlan(validDto);
    console.log('Test 3 - Valid Single Term Plan:');
    console.log('  Valid:', validation3.isValid);
    console.log('  Errors:', validation3.errors.length);
  }

  // ==================== مثال 11: Bulk Operations ====================

  example11_BulkCreate() {
    console.log('📝 Example 11: Bulk Create Plans');

    const plans: CreateSubscriptionPlanDto[] = [
      {
        name: 'English Year 7 - Term 1',
        description: 'English Term 1',
        planType: PlanType.SingleTerm,
        price: 49.99,
        subjectId: 6,
        termId: 14,
        isActive: true
      },
      {
        name: 'Science Year 7 - Term 1',
        description: 'Science Term 1',
        planType: PlanType.SingleTerm,
        price: 49.99,
        subjectId: 7,
        termId: 16,
        isActive: true
      },
      {
        name: 'History Year 7 - Term 1',
        description: 'History Term 1',
        planType: PlanType.SingleTerm,
        price: 49.99,
        subjectId: 8,
        termId: 18,
        isActive: true
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    plans.forEach((dto, index) => {
      this.plansService.createPlan(dto).subscribe({
        next: (plan) => {
          successCount++;
          console.log(`✅ [${index + 1}/${plans.length}] Created: ${plan.name}`);

          if (successCount + errorCount === plans.length) {
            console.log(`\n📊 Summary:`);
            console.log(`   - Total: ${plans.length}`);
            console.log(`   - Success: ${successCount}`);
            console.log(`   - Failed: ${errorCount}`);
          }
        },
        error: (err) => {
          errorCount++;
          console.error(`❌ [${index + 1}/${plans.length}] Failed: ${dto.name}`);
          console.error(`   Error: ${err.message}`);

          if (successCount + errorCount === plans.length) {
            console.log(`\n📊 Summary:`);
            console.log(`   - Total: ${plans.length}`);
            console.log(`   - Success: ${successCount}`);
            console.log(`   - Failed: ${errorCount}`);
          }
        }
      });
    });
  }

  // ==================== Run All Examples ====================

  runAllExamples() {
    console.log('🚀 Running All Examples...\n');

    // Note: في بيئة production، يجب تشغيل هذه الأمثلة بشكل متسلسل
    // باستخدام observables chaining أو async/await

    console.log('⚠️  Note: This will create test data in your database!');
    console.log('⚠️  Make sure you are in a test environment.\n');

    // Uncomment to run all examples:
    // this.example1_CreateSingleTermPlan();
    // this.example2_CreateMultiTermPlan();
    // this.example3_CreateFullYearPlan();
    // this.example4_CreateSubjectAnnualPlan();
    // this.example5_UpdatePlan();
    // this.example6_DeactivatePlan();
    // this.example7_GetAllPlans();
    // this.example8_GetPlansForTerm();
    // this.example9_GetPlansForSubject();
    // this.example10_ValidationTest();
    // this.example11_BulkCreate();
  }
}

/**
 * Quick Test Function - للاستخدام في Console
 */
export function quickTest(plansService: SubscriptionPlansService) {
  const test = new SubscriptionPlansTestExamples(plansService);
  test.runAllExamples();
}
