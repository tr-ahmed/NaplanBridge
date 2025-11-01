import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { FooterComponent } from './shared/footer/footer';
import { ToastContainerComponent } from './components/toast-container.component';
import { ScrollToTopComponent } from "./shared/scroll-to-top/scroll-to-top.component";
import { GlobalConfirmationDialogComponent } from './shared/components/confirmation-dialog/global-confirmation-dialog.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent, ScrollToTopComponent, GlobalConfirmationDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly title = signal('NAPLAN-Bridge Learning Platform');

  showHeader = true;
  showFooter = true;
  private routerEventsSubscription: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerEventsSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });

    this.checkCurrentRoute();
  }

  ngOnDestroy() {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;

    const hideHeaderFooterPages = [
      '/select-role',
      '/admin/users',
      '/teacher/dashboard',
      '/admin/content',
      '/admin/subscriptions',

    ];

    const shouldHide = hideHeaderFooterPages.some(page => currentUrl.includes(page));

    if (shouldHide) {
      this.showHeader = false;
      this.showFooter = false;
    } else {
      this.showHeader = true;
      this.showFooter = true;
    }
  }
}
