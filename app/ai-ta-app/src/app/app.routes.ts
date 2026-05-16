import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tutor/tutor.component').then((m) => m.TutorComponent),
  },
  { path: '**', redirectTo: '' },
];
