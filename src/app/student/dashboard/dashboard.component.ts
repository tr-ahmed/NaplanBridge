import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  student = {
    fullName: 'محمد أحمد',
    grade: 'Year 3',
    subjects: ['Math', 'English', 'Science', 'HASS']
  };
}
