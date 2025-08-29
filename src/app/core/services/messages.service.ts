import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { LessonMessage } from '../../models/lesson.models';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private mockMessages: LessonMessage[] = [
    {
      id: 1,
      lessonId: 1,
      senderId: 1,
      senderName: 'أحمد محمد',
      senderType: 'student',
      message: 'لم أفهم الجزء الخاص بحل المعادلات، هل يمكنك شرحه مرة أخرى؟',
      createdAt: new Date('2024-02-20T10:30:00'),
      isRead: true
    },
    {
      id: 2,
      lessonId: 1,
      senderId: 101,
      senderName: 'الأستاذ محمود',
      senderType: 'teacher',
      message: 'بالطبع، حل المعادلات يحتاج إلى تطبيق قوانين الجبر بشكل متسلسل. سأرسل لك مثال إضافي.',
      createdAt: new Date('2024-02-20T11:15:00'),
      isRead: false
    },
    {
      id: 3,
      lessonId: 5,
      senderId: 1,
      senderName: 'أحمد محمد',
      senderType: 'student',
      message: 'هذا الدرس كان ممتازاً، شكراً لك',
      createdAt: new Date('2024-02-21T14:20:00'),
      isRead: true
    }
  ];

  private newMessageSubject = new BehaviorSubject<LessonMessage | null>(null);
  public newMessage$ = this.newMessageSubject.asObservable();

  constructor() { }

  /**
   * Get all messages for a specific lesson
   */
  getLessonMessages(lessonId: number): Observable<LessonMessage[]> {
    const messages = this.mockMessages
      .filter(msg => msg.lessonId === lessonId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return of(messages);
  }

  /**
   * Send a new message in a lesson
   */
  sendMessage(
    lessonId: number,
    senderId: number,
    senderName: string,
    senderType: 'student' | 'teacher',
    message: string
  ): Observable<LessonMessage> {
    const newMessage: LessonMessage = {
      id: this.mockMessages.length + 1,
      lessonId,
      senderId,
      senderName,
      senderType,
      message,
      createdAt: new Date(),
      isRead: false
    };

    this.mockMessages.push(newMessage);
    this.newMessageSubject.next(newMessage);

    return of(newMessage);
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(lessonId: number, userId: number): Observable<void> {
    this.mockMessages
      .filter(msg => msg.lessonId === lessonId && msg.senderId !== userId)
      .forEach(msg => msg.isRead = true);

    return of();
  }

  /**
   * Get unread messages count for a student
   */
  getUnreadMessagesCount(studentId: number): Observable<number> {
    const unreadCount = this.mockMessages
      .filter(msg => msg.senderType === 'teacher' && !msg.isRead)
      .length;

    return of(unreadCount);
  }

  /**
   * Get recent messages for a student across all lessons
   */
  getRecentMessages(studentId: number, limit: number = 5): Observable<LessonMessage[]> {
    const recentMessages = this.mockMessages
      .filter(msg => msg.senderId === studentId || msg.senderType === 'teacher')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return of(recentMessages);
  }
}
