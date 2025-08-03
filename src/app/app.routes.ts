import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  // Add more routes here as needed
  // { path: 'about', component: AboutComponent },
  // { path: 'courses', component: CoursesComponent },
  // { path: 'blog', component: BlogComponent },
  // { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' } // Wildcard route for 404 pages
];
