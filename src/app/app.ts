import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { FooterComponent } from './shared/footer/footer';
import { ToastContainerComponent } from './components/toast-container.component';
import { ScrollToTopComponent } from "./shared/scroll-to-top/scroll-to-top.component";
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent, ScrollToTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  isDashboardPage = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isDashboardPage = event.urlAfterRedirects === '/admin/dashboard';
      });
  }
  protected readonly title = signal('NAPLAN-Bridge Learning Platform');
  
}
