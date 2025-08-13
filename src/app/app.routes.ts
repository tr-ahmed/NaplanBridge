import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'auth/login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'terms', loadComponent: () => import('./features/terms/terms.component').then(m => m.TermsComponent) },
  {
    path: 'add-student',
    loadComponent: () => import('./features/Add-Student/add-student').then(m => m.AddStudentComponent)
  },
  {
    path: 'students',
    loadComponent: () => import('./features/students-list/students-list').then(m => m.StudentsListComponent)
  },
  // Add more routes here as needed
  // { path: 'about', component: AboutComponent },
  // { path: 'courses', component: CoursesComponent },
  // { path: 'blog', component: BlogComponent },
  // { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];
