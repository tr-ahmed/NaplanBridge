/**
 * Notes Service
 * Handles student notes for lessons
 * Based on Backend API Documentation
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiService } from './base-api.service';
import { environment } from '../../../environments/environment';

export interface Note {
  id: number;
  content: string;
  lessonId: number;
  studentId: number;
  timestamp?: number; // video timestamp in seconds
  isFavorite: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CreateNoteDto {
  content: string;
  lessonId: number;
  timestamp?: number;
}

export interface UpdateNoteDto {
  content?: string;
  timestamp?: number;
  isFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private api = inject(ApiService);

  /**
   * Get all notes for current student
   * Endpoint: GET /api/Notes
   */
  getNotes(): Observable<Note[]> {
    return this.api.get<Note[]>('Notes').pipe(timeout(environment.apiTimeout));
  }

  /**
   * Get note by ID
   * Endpoint: GET /api/Notes/{id}
   */
  getNoteById(id: number): Observable<Note> {
    return this.api.get<Note>(`Notes/${id}`).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Get notes for a specific lesson
   * Query parameter: lessonId
   */
  getNotesByLesson(lessonId: number): Observable<Note[]> {
    return this.api.get<Note[]>(`Notes?lessonId=${lessonId}`).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Create a new note
   * Endpoint: POST /api/Notes
   */
  createNote(dto: CreateNoteDto): Observable<Note> {
    return this.api.post<Note>('Notes', dto).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Update a note
   * Endpoint: PUT /api/Notes/{id}
   */
  updateNote(id: number, dto: UpdateNoteDto): Observable<Note> {
    return this.api.put<Note>(`Notes/${id}`, dto).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Delete a note
   * Endpoint: DELETE /api/Notes/{id}
   */
  deleteNote(id: number): Observable<void> {
    return this.api.delete<void>(`Notes/${id}`).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Toggle favorite status of a note
   * Endpoint: POST /api/Notes/{id}/favorite
   */
  toggleFavorite(id: number): Observable<Note> {
    return this.api.post<Note>(`Notes/${id}/favorite`, {}).pipe(timeout(environment.apiTimeout));
  }

  /**
   * Search notes
   * Endpoint: GET /api/Notes/search?query={query}
   */
  searchNotes(query: string): Observable<Note[]> {
    return this.api.get<Note[]>(`Notes/search?query=${encodeURIComponent(query)}`).pipe(timeout(environment.apiTimeout));
  }
}
