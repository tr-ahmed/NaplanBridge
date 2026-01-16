import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  stats = [
    { icon: 'fa-users', number: '10,000+', label: 'Active Students' },
    { icon: 'fa-chalkboard-teacher', number: '500+', label: 'Expert Teachers' },
    { icon: 'fa-graduation-cap', number: '95%', label: 'Success Rate' },
    { icon: 'fa-award', number: '50+', label: 'Awards Won' }
  ];

  values = [
    {
      icon: 'fa-bullseye',
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from content quality to student support.'
    },
    {
      icon: 'fa-users',
      title: 'Student-Centered',
      description: 'Every decision we make is guided by what\'s best for our students\' learning journey.'
    },
    {
      icon: 'fa-lightbulb',
      title: 'Innovation',
      description: 'We continuously innovate our platform to provide the best learning experience.'
    },
    {
      icon: 'fa-heart',
      title: 'Passion',
      description: 'Our team is passionate about education and helping students achieve their dreams.'
    }
  ];

  timeline = [
    { year: '2020', event: 'NaplanBridge was founded with a vision to revolutionize NAPLAN preparation' },
    { year: '2021', event: 'Launched our first comprehensive curriculum for Years 7-9' },
    { year: '2022', event: 'Expanded to cover Years 10-12 and reached 5,000 students' },
    { year: '2023', event: 'Introduced AI-powered personalized learning paths' },
    { year: '2024', event: 'Achieved 95% student success rate and won Best EdTech Platform award' },
    { year: '2025', event: 'Serving 10,000+ students across Australia with 500+ expert teachers' }
  ];
}
