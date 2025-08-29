
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  /**
   * Current year for copyright display
   */
  currentYear = new Date().getFullYear();

  /**
   * Footer navigation links organized by columns
   */
  footerLinks = {
    leftColumn: [
      { label: 'About', route: '/about' },
      { label: 'Courses', route: '/courses' },
      { label: 'Pricing', route: '/pricing' },
      { label: 'Blog', route: '/blog' },
      { label: 'Support', route: '/support' }
    ],
    rightColumn: [
      { label: 'FAQs', route: '/faq' },
      { label: 'Contact Us', route: '/contact' },
      { label: 'Privacy Policy', route: '/privacy' },
      { label: 'Terms of Use', route: '/terms' },
      { label: 'Cookie Policy', route: '/cookies' }
    ]
  };

  
  constructor(
    public router: Router,
  ) {}
  /**
   * Social media links with FontAwesome icons
   */
  socialLinks = [
    { platform: 'Facebook', url: '#', icon: 'fab fa-facebook-f' },
    { platform: 'Instagram', url: '#', icon: 'fab fa-instagram' },
    { platform: 'Twitter', url: '#', icon: 'fab fa-twitter' },
    { platform: 'LinkedIn', url: '#', icon: 'fab fa-linkedin-in' },
    { platform: 'YouTube', url: '#', icon: 'fab fa-youtube' }
  ];

isAdminDashboard(): boolean {
  return this.router.url.startsWith('/admin/users') 
      || this.router.url.startsWith('/admin/content')

       || this.router.url.startsWith('/admin/subscriptions');
      
}


  
}
