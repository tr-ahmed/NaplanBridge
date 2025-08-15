import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://your-api-url.com/api/users'; // عدل الرابط حسب الـ backend بتاعك

  constructor(private http: HttpClient) {}

  // إضافة يوزر جديد
  addUser(userData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData);
  }

  // جلب كل اليوزرز (ممكن تحتاجها)
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
