import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  teacher = {
    name: 'منى خالد',
    subjects: ['Math', 'Science'],
    studentsCount: 120
  };
}
