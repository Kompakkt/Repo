import { Routes } from '@angular/router';

import { AuthenticatedGuard } from './guards';
import { HomeComponent } from './pages/home/home.component';
import { PrivacyComponent } from './pages/static-pages/privacy/privacy.component';
import { ImprintComponent } from './pages/static-pages/imprint/imprint.component';
import { AboutComponent } from './pages/static-pages/about/about.component';
import { DetailPageComponent } from './pages/detail-page/detail-page.component';
import { ExploreComponent } from './pages/explore/explore.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { AnnotateComponent } from './pages/annotate/annotate.component';
import { NotFoundComponent } from './pages/notfound/notfound.component';
import { DebugPageComponent } from './pages/debug-page/debug-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Kompakkt',
    },
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: {
      title: 'Privacy Policy',
    },
  },
  {
    path: 'imprint',
    component: ImprintComponent,
    data: {
      title: 'Imprint',
    },
  },
  {
    path: 'about',
    component: AboutComponent,
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
    component: DetailPageComponent,
    data: { type: 'entity' },
  },
  {
    path: 'compilation/:id',
    component: DetailPageComponent,
    data: { type: 'compilation' },
  },
  {
    path: 'explore',
    component: ExploreComponent,
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
  },
  {
    path: 'profile/:type/:id',
    component: ProfilePageComponent,
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [AuthenticatedGuard],
  },
  {
    path: 'annotate/:id',
    component: AnnotateComponent,
  },
  {
    path: 'annotate/:type/:id',
    component: AnnotateComponent,
  },
  {
    path: 'annotate',
    component: AnnotateComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '__debug',
    component: DebugPageComponent,
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
