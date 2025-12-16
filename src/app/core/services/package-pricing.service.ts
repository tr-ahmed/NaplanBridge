import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PackagePricing,
  PackagePricingCreateDto,
  PackagePricingUpdateDto,
  PackagePricingBulkUpdateDto,
  GenerateMixesRequest,
  GenerateMixesResponse,
  PriceCalculationRequest,
  PriceCalculationResponse,
  PricingMatrix,
  Subject,
  TeachingType,
  CreatePackageOrderRequest,
  CreatePackageOrderResponse
} from '../../models/package-pricing.model';

@Injectable({
  providedIn: 'root'
})
export class PackagePricingService {
  private apiUrl = `${environment.apiBaseUrl}/PackagePricing`;

  constructor(private http: HttpClient) {}

  // Generate all package mixes automatically
  generateMixes(request: GenerateMixesRequest): Observable<GenerateMixesResponse> {
    return this.http.post<GenerateMixesResponse>(`${this.apiUrl}/generate-mixes`, request);
  }

  // Get all packages with optional filters
  getAllPackages(
    yearId?: number,
    teachingType?: TeachingType,
    studentCount?: number,
    isActive?: boolean
  ): Observable<PackagePricing[]> {
    let params = new HttpParams();
    if (yearId) params = params.set('yearId', yearId.toString());
    if (teachingType) params = params.set('teachingType', teachingType);
    if (studentCount) params = params.set('studentCount', studentCount.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<PackagePricing[]>(this.apiUrl, { params });
  }

  // Get pricing matrix for a teaching type
  getPricingMatrix(teachingType: TeachingType, yearId: number): Observable<PricingMatrix> {
    const params = new HttpParams().set('yearId', yearId.toString());
    return this.http.get<PricingMatrix>(`${this.apiUrl}/matrix/${teachingType}`, { params });
  }

  // Get single package by ID
  getPackageById(id: number): Observable<PackagePricing> {
    return this.http.get<PackagePricing>(`${this.apiUrl}/${id}`);
  }

  // Create new package
  createPackage(dto: PackagePricingCreateDto): Observable<PackagePricing> {
    return this.http.post<PackagePricing>(this.apiUrl, dto);
  }

  // Update package
  updatePackage(id: number, dto: PackagePricingUpdateDto): Observable<PackagePricing> {
    return this.http.put<PackagePricing>(`${this.apiUrl}/${id}`, dto);
  }

  // Bulk update prices
  bulkUpdatePrices(updates: PackagePricingBulkUpdateDto[]): Observable<{ message: string; updatedCount: number }> {
    return this.http.post<{ message: string; updatedCount: number }>(`${this.apiUrl}/bulk-update`, updates);
  }

  // Toggle package status (active/inactive)
  toggleStatus(id: number): Observable<PackagePricing> {
    return this.http.patch<PackagePricing>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Delete package
  deletePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get available subjects
  getAvailableSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/available-subjects`);
  }

  // Calculate price for parent selection (NEW - uses subject names)
  calculatePrice(request: PriceCalculationRequest): Observable<PriceCalculationResponse> {
    return this.http.post<PriceCalculationResponse>(`${this.apiUrl}/calculate-price-by-names`, request);
  }

  // Calculate price (OLD - deprecated, kept for backward compatibility)
  calculatePriceById(request: any): Observable<PriceCalculationResponse> {
    return this.http.post<PriceCalculationResponse>(`${this.apiUrl}/calculate-price`, request);
  }

  // Create package order (Parent only) - NEW endpoint with subject names
  createPackageOrder(request: CreatePackageOrderRequest): Observable<CreatePackageOrderResponse> {
    return this.http.post<CreatePackageOrderResponse>(`${this.apiUrl}/create-order-with-names`, request);
  }

  // Create package order (OLD - deprecated, kept for backward compatibility)
  createPackageOrderById(request: any): Observable<CreatePackageOrderResponse> {
    return this.http.post<CreatePackageOrderResponse>(`${this.apiUrl}/create-order`, request);
  }
}
