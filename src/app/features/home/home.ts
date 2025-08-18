import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  /**
   * Hero section content data
   */
  heroContent = {
    title: 'Unlock Your Potential with NAPLAN-Bridge Courses',
    subtitle: 'Upskill Today is your gateway to a world of knowledge. Dive into our extensive catalog of courses and start learning from industry experts today.',
    primaryButtonText: 'Explore Courses',
    secondaryButtonText: 'Get Certified',
    primaryButtonRoute: '/courses',
    secondaryButtonRoute: '/contact'
  };

  /**
   * Featured statistics or highlights
   */
  statistics = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '500+', label: 'Expert Instructors' },
    { value: '100+', label: 'Courses Available' },
    { value: '95%', label: 'Success Rate' }
  ];

  /**
   * Gallery images for course showcase
   */
  galleryImages = [
    {
      id: 1,
      main: {
        src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Students collaborating in classroom'
      },
      secondary: {
        src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Online learning session'
      }
    },
    {
      id: 2,
      main: {
        src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Group discussion and learning'
      },
      secondary: {
        src: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Students working together'
      }
    },
    {
      id: 3,
      main: {
        src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Technology and learning'
      },
      secondary: {
        src: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Interactive learning environment'
      }
    }
  ];

  /**
   * Current slide index for gallery
   */
  currentSlide = 0;

  /**
   * Animation properties for automatic hero animations
   */
  private animationFrame?: number;
  private startTime = Date.now();
  private imageOffsets: { x: number; y: number; rotation: number }[] = [];

  constructor(private route: ActivatedRoute) {}

  /**
   * Initialize component and start animations
   */
  ngOnInit(): void {
    this.initializeImageOffsets();
    this.startAutoAnimation();
  }

  /**
   * Cleanup when component is destroyed
   */
  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  /**
   * Initialize random offsets for each image
   */
  private initializeImageOffsets(): void {
    this.imageOffsets = Array.from({ length: 6 }, () => ({
      x: Math.random() * 40 - 20, // Random between -20 and 20
      y: Math.random() * 40 - 20,
      rotation: Math.random() * 20 - 10 // Random between -10 and 10
    }));
  }

  /**
   * Start automatic animation loop
   */
  private startAutoAnimation(): void {
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds

      // Update image positions with smooth sine wave animations
      this.imageOffsets = this.imageOffsets.map((offset, index) => {
        const speed = 0.5 + (index * 0.1); // Different speeds for each image
        const amplitude = 15; // Movement amplitude

        return {
          x: Math.sin(elapsed * speed + index) * amplitude,
          y: Math.cos(elapsed * speed * 0.8 + index) * amplitude * 0.7,
          rotation: Math.sin(elapsed * speed * 1.2 + index) * 8
        };
      });

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Get dynamic transform for hero images with automatic animation
   */
  getImageTransform(imageIndex: number): string {
    if (imageIndex >= this.imageOffsets.length) {
      return '';
    }

    const offset = this.imageOffsets[imageIndex];
    return `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotation}deg)`;
  }

  /**
   * Handle primary CTA button click
   */
  onExploreCourses(): void {
    // Navigate to courses page or handle action
    console.log('Navigating to courses page');
  }

  /**
   * Handle secondary CTA button click
   */
  onGetCertified(): void {
    // Navigate to certification page or handle action
    console.log('Navigating to certification page');
  }

  /**
   * Navigate to next slide in gallery
   */
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.galleryImages.length;
  }

  /**
   * Navigate to previous slide in gallery
   */
  previousSlide(): void {
    this.currentSlide = this.currentSlide === 0
      ? this.galleryImages.length - 1
      : this.currentSlide - 1;
  }

  /**
   * Go to specific slide
   */
  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  ngAfterViewInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const el = document.getElementById(fragment);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
}
