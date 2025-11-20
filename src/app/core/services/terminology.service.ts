/**
 * Terminology Service
 * Manages customizable terminology configuration for Terms and Weeks
 * Provides methods to get, set, and reset terminology labels
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  TerminologyConfig,
  CreateTerminologyConfigDto,
  UpdateTerminologyConfigDto,
  DEFAULT_TERMINOLOGY
} from '../../models/terminology.models';

@Injectable({
  providedIn: 'root'
})
export class TerminologyService {

  private terminologySubject = new BehaviorSubject<TerminologyConfig>(DEFAULT_TERMINOLOGY);
  public terminology$ = this.terminologySubject.asObservable();

  private readonly CACHE_KEY = 'app_terminology_config';
  private readonly API_ENDPOINT = 'settings/terminology';
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  constructor() {
    this.initializeTerminology();
  }

  /**
   * Initialize terminology from cache or default
   */
  private initializeTerminology(): void {
    const cached = this.getFromCache();
    if (cached) {
      this.terminologySubject.next(cached);
    }
  }

  /**
   * Get current terminology configuration
   */
  getTerminology(): TerminologyConfig {
    return this.terminologySubject.getValue();
  }

  /**
   * Get terminology as observable
   */
  getTerminology$(): Observable<TerminologyConfig> {
    return this.terminology$;
  }

  /**
   * Fetch terminology from backend
   */
  fetchTerminologyFromServer(): Observable<TerminologyConfig> {
    return this.http.get<TerminologyConfig>(`${this.apiUrl}${this.API_ENDPOINT}`)
      .pipe(
        tap(config => {
          this.terminologySubject.next(config);
          this.saveToCache(config);
        })
      );
  }

  /**
   * Update terminology configuration on the backend
   */
  updateTerminology(config: UpdateTerminologyConfigDto): Observable<TerminologyConfig> {
    return this.http.put<TerminologyConfig>(`${this.apiUrl}${this.API_ENDPOINT}`, config)
      .pipe(
        tap(updatedConfig => {
          this.terminologySubject.next(updatedConfig);
          this.saveToCache(updatedConfig);
        })
      );
  }

  /**
   * Reset terminology to defaults
   */
  resetTerminology(): Observable<TerminologyConfig> {
    return this.http.post<TerminologyConfig>(`${this.apiUrl}${this.API_ENDPOINT}/reset`, {})
      .pipe(
        tap(config => {
          this.terminologySubject.next(config);
          this.saveToCache(config);
        })
      );
  }

  /**
   * Create/Initialize terminology for an organization
   */
  createTerminology(config: CreateTerminologyConfigDto): Observable<TerminologyConfig> {
    return this.http.post<TerminologyConfig>(`${this.apiUrl}${this.API_ENDPOINT}`, config)
      .pipe(
        tap(createdConfig => {
          this.terminologySubject.next(createdConfig);
          this.saveToCache(createdConfig);
        })
      );
  }

  // ============================================
  // Helper Methods for UI Components
  // ============================================

  /**
   * Get formatted term label for display
   */
  getTermLabel(count: number = 1): string {
    const config = this.getTerminology();
    return count === 1 ? config.termLabel : config.termPlural;
  }

  /**
   * Get formatted week label for display
   */
  getWeekLabel(count: number = 1): string {
    const config = this.getTerminology();
    return count === 1 ? config.weekLabel : config.weekPlural;
  }

  /**
   * Get term number label (for form fields)
   */
  getTermNumberLabel(): string {
    return this.getTerminology().termNumberLabel;
  }

  /**
   * Get week number label (for form fields)
   */
  getWeekNumberLabel(): string {
    return this.getTerminology().weekNumberLabel;
  }

  /**
   * Get term singular form
   */
  getTermSingular(): string {
    return this.getTerminology().termSingular;
  }

  /**
   * Get term plural form
   */
  getTermPlural(): string {
    return this.getTerminology().termPlural;
  }

  /**
   * Get week singular form
   */
  getWeekSingular(): string {
    return this.getTerminology().weekSingular;
  }

  /**
   * Get week plural form
   */
  getWeekPlural(): string {
    return this.getTerminology().weekPlural;
  }

  /**
   * Get error message with dynamic term label
   * Example: "Please provide a valid term number (greater than 0)."
   */
  getValidationMessage(type: 'term' | 'week', messageKey: 'required' | 'positive' | 'range'): string {
    const config = this.getTerminology();
    const label = type === 'term' ? config.termNumberLabel : config.weekNumberLabel;

    const messages = {
      required: `${label} is required`,
      positive: `${label} must be greater than 0`,
      range: `${label} must be within valid range`
    };

    return messages[messageKey];
  }

  /**
   * Get placeholder text with dynamic labels
   */
  getPlaceholder(type: 'term' | 'week'): string {
    const config = this.getTerminology();
    if (type === 'term') {
      return `Enter ${config.termSingular} number`;
    }
    return `Enter ${config.weekSingular} number`;
  }

  /**
   * Format term display string
   * Example: "Term 1" or "Part 1"
   */
  formatTerm(number: number): string {
    const config = this.getTerminology();
    return `${config.termLabel} ${number}`;
  }

  /**
   * Format week display string
   * Example: "Week 5" or "Session 5"
   */
  formatWeek(number: number): string {
    const config = this.getTerminology();
    return `${config.weekLabel} ${number}`;
  }

  /**
   * Format combined term and week string
   * Example: "Term 1 - Week 5" or "Part 1 - Session 5"
   */
  formatTermAndWeek(termNumber: number, weekNumber: number): string {
    return `${this.formatTerm(termNumber)} - ${this.formatWeek(weekNumber)}`;
  }

  // ============================================
  // Caching Methods
  // ============================================

  private saveToCache(config: TerminologyConfig): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to cache terminology config', e);
    }
  }

  private getFromCache(): TerminologyConfig | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('Failed to retrieve cached terminology config', e);
      return null;
    }
  }

  /**
   * Clear cached terminology configuration
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear terminology cache', e);
    }
  }

  /**
   * Update terminology in memory without backend call
   * Useful for temporary changes or preview
   */
  setTerminology(config: TerminologyConfig): void {
    this.terminologySubject.next(config);
  }
}
