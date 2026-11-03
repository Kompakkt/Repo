import { Routes } from '@angular/router';
import { adminPageResource } from './pages/admin-page/admin-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: {
      title: 'Kompakkt',
    },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/static-pages/privacy/privacy.component').then(m => m.PrivacyComponent),
    data: {
      title: 'Privacy Policy',
    },
  },
  {
    path: 'imprint',
    loadComponent: () =>
      import('./pages/static-pages/imprint/imprint.component').then(m => m.ImprintComponent),
    data: {
      title: 'Imprint',
    },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/static-pages/about/about.component').then(m => m.AboutComponent),
    data: {
      title: 'About the Kompakkt Consortium',
    },
  },
  {
    path: 'consortium',
    redirectTo: 'about',
  },
  {
    path: 'contact',
    redirectTo: 'about',
  },
  {
    path: 'entity/:id',
    loadComponent: () =>
      import('./pages/detail-page/detail-page.component').then(m => m.DetailPageComponent),
    data: { type: 'entity' },
  },
  {
    path: 'compilation/:id',
    loadComponent: () =>
      import('./pages/detail-page/detail-page.component').then(m => m.DetailPageComponent),
    data: { type: 'compilation' },
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/explore/explore.component').then(m => m.ExploreComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
  },
  {
    path: 'profile/:type/:id',
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-page/admin-page.component').then(m => m.AdminPageComponent),
    resources: adminPageResource,
  },
  {
    path: 'annotate/:id',
    loadComponent: () =>
      import('./pages/annotate/annotate.component').then(m => m.AnnotateComponent),
  },
  {
    path: 'annotate/:type/:id',
    loadComponent: () =>
      import('./pages/annotate/annotate.component').then(m => m.AnnotateComponent),
  },
  {
    path: 'annotate',
    loadComponent: () =>
      import('./pages/annotate/annotate.component').then(m => m.AnnotateComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/static-pages/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./pages/notfound/notfound.component').then(m => m.NotFoundComponent),
  },
  {
    path: '__debug',
    loadComponent: () =>
      import('./pages/debug-page/debug-page.component').then(m => m.DebugPageComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
