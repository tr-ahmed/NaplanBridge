export enum TeachingType {
  OneToOne = 'OneToOne',
  GroupTutoring = 'GroupTutoring'
}

export interface Subject {
  id: number;
  name: string;
  arabicName: string;
}

export interface PackagePricing {
  id: number;
  yearId: number;
  teachingType: TeachingType;
  studentCount: number;
  subjectIds: number[];
  subjectNames: string[];
  packageName: string;
  price?: number;
  useIndividualPricing: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePricingCreateDto {
  yearId: number;
  teachingType: TeachingType;
  studentCount: number;
  subjectIds: number[];
  price?: number;
  useIndividualPricing?: boolean;
  isActive?: boolean;
}

export interface PackagePricingUpdateDto {
  price?: number;
  useIndividualPricing?: boolean;
  isActive?: boolean;
}

export interface PackagePricingBulkUpdateDto {
  packageId: number;
  price: number;
}

export interface GenerateMixesRequest {
  yearId: number;
  includeOneToOne: boolean;
  includeGroupTutoring: boolean;
  minStudents: number;
  maxStudents: number;
  maxSubjectsPerPackage: number;
}

export interface GenerateMixesResponse {
  totalGenerated: number;
  newlyCreated: number;
  alreadyExisted: number;
  generatedPackages: string[];
  message: string;
}

export interface PriceCalculationRequest {
  yearId: number;
  teachingType: TeachingType;
  studentCount: number;
  subjectNames: string[];  // Changed from subjectIds to subjectNames
  termId?: number;
}

export interface PriceCalculationResponse {
  // New (matches backend spec)
  price?: number;
  hasDirectPrice?: boolean;
  usedIndividualPricing: boolean;
  subjectNames?: string[];
  packageName?: string;
  priceBreakdown?: string;

  // Backward compatible (used by existing UI code)
  totalPrice?: number;
  breakdown?: {
    subjectName: string;
    price: number;
  }[];
  message?: string;
}

export interface PricingMatrixRow {
  packageId: number;
  packageName: string;
  subjectIds: number[];
  priceByStudentCount: { [studentCount: number]: number | null };
}

export interface PricingMatrix {
  teachingType: TeachingType;
  rows: PricingMatrixRow[];
}

export interface CreatePackageOrderRequest {
  teachingType: TeachingType;
  studentCount: number;
  subjectNames: string[];  // Changed from subjectIds - backend will resolve per student year
  studentIds: number[];
  termId: number;
  expectedPrice: number;
  promotionCode?: string;
}

export interface CreatePackageOrderResponse {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  stripeSessionId: string;
  stripeCheckoutUrl: string;
  teachingType: TeachingType;
  studentCount: number;
  subjectNames: string[];
  students: OrderStudent[];
}

export interface OrderStudent {
  studentId: number;
  studentName: string;
  subjectIds: number[];
  subjectNames: string[];
}
