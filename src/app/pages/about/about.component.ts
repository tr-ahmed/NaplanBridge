import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  stats = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '500+', label: 'Expert Instructors' },
    { value: '1,000+', label: 'Quality Courses' },
    { value: '98%', label: 'Success Rate' }
  ];

  team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'assets/img/team/sarah.jpg',
      description: 'Education leader with 15+ years of experience in online learning.'
    },
    {
      name: 'Michael Chen',
      role: 'Chief Academic Officer',
      image: 'assets/img/team/michael.jpg',
      description: 'Former university professor dedicated to curriculum excellence.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Technology',
      image: 'assets/img/team/emily.jpg',
      description: 'Tech innovator creating seamless learning experiences.'
    },
    {
      name: 'David Thompson',
      role: 'Student Success Manager',
      image: 'assets/img/team/david.jpg',
      description: 'Passionate about helping every student achieve their goals.'
    }
  ];

  values = [
    {
      icon: 'fas fa-lightbulb',
      title: 'Innovation',
      description: 'We constantly innovate to provide the best learning experience.'
    },
    {
      icon: 'fas fa-users',
      title: 'Community',
      description: 'Building a supportive community of learners and educators.'
    },
    {
      icon: 'fas fa-star',
      title: 'Excellence',
      description: 'Committed to delivering high-quality educational content.'
    },
    {
      icon: 'fas fa-heart',
      title: 'Accessibility',
      description: 'Making quality education accessible to everyone, everywhere.'
    }
  ];
}
