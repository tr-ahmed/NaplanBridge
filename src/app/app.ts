import { Component, signal, OnInit, OnDestroy, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { FooterComponent } from './shared/footer/footer';
import { AdminHeaderComponent } from './shared/components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './shared/components/admin-sidebar/admin-sidebar.component';
import { TeacherHeaderComponent } from './shared/components/teacher-header/teacher-header.component';
import { TeacherSidebarComponent } from './shared/components/teacher-sidebar/teacher-sidebar.component';
import { ToastContainerComponent } from './components/toast-container.component';
import { ScrollToTopComponent } from "./shared/scroll-to-top/scroll-to-top.component";
import { GlobalConfirmationDialogComponent } from './shared/components/confirmation-dialog/global-confirmation-dialog.component';
import { UploadProgressComponent } from './shared/components/upload-progress/upload-progress.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    AdminHeaderComponent,
    AdminSidebarComponent,
    TeacherHeaderComponent,
    TeacherSidebarComponent,
    ToastContainerComponent,
    ScrollToTopComponent,
    GlobalConfirmationDialogComponent,
    UploadProgressComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly title = signal('NAPLAN-Bridge Learning Platform');

  @ViewChild(AdminSidebarComponent) adminSidebar?: AdminSidebarComponent;
  @ViewChild(TeacherSidebarComponent) teacherSidebar?: TeacherSidebarComponent;

  showHeader = signal(true);
  showFooter = signal(true);
  showAdminLayout = signal(false);
  showTeacherLayout = signal(false);
  showPublicLayout = signal(true);

  private routerEventsSubscription: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.routerEventsSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // ✅ Scroll to top on navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.checkCurrentRoute();
      });

    this.checkCurrentRoute();
  }

  ngOnDestroy() {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }

  onToggleAdminSidebar(): void {
    this.adminSidebar?.toggleSidebar();
  }

  onToggleTeacherSidebar(): void {
    this.teacherSidebar?.toggleSidebar();
  }

  private checkCurrentRoute() {
    const currentUrl = this.router.url;
    const user = this.authService.currentUser();
    const isAuthenticated = this.authService.isAuthenticated();

    // Check if route is admin or teacher
    const isAdminRoute = currentUrl.startsWith('/admin');
    const isTeacherRoute = currentUrl.startsWith('/teacher') || currentUrl.startsWith('/sessions');
    const isAuthRoute = currentUrl.startsWith('/login') || currentUrl.startsWith('/register');

    // Hide header/footer on auth pages
    if (isAuthRoute) {
      this.showHeader.set(false);
      this.showFooter.set(false);
      this.showAdminLayout.set(false);
      this.showTeacherLayout.set(false);
      this.showPublicLayout.set(false);
      return;
    }

    // Admin layout
    if (isAdminRoute && isAuthenticated && user?.roles.includes('Admin')) {
      this.showHeader.set(false);
      this.showFooter.set(false);
      this.showAdminLayout.set(true);
      this.showTeacherLayout.set(false);
      this.showPublicLayout.set(false);
      return;
    }

    // Teacher layout
    if (isTeacherRoute && isAuthenticated && user?.roles.includes('Teacher')) {
      this.showHeader.set(false);
      this.showFooter.set(false);
      this.showAdminLayout.set(false);
      this.showTeacherLayout.set(true);
      this.showPublicLayout.set(false);
      return;
    }

    // Public layout (default)
    this.showHeader.set(true);
    this.showFooter.set(true);
    this.showAdminLayout.set(false);
    this.showTeacherLayout.set(false);
    this.showPublicLayout.set(true);
  }
}
