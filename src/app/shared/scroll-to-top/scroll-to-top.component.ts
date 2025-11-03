import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  templateUrl: './scroll-to-top.component.html'
})
export class ScrollToTopComponent {
  showButton = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.showButton.set(window.scrollY > 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}