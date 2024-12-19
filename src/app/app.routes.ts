import { Routes } from '@angular/router';

import {
  AdminPageComponent,
  AnnotateComponent,
  CollaborateComponent,
  AboutComponent,
  DetailPageComponent,
  ExploreComponent,
  HomeComponent,
  NotFoundComponent,
  PrivacyComponent,
  ProfilePageComponent,
} from './pages';

import { AuthenticatedGuard } from './guards';
import { ProfilePageResolver } from './resolvers';

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
    resolve: {
      userData: ProfilePageResolver,
    },
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
    path: 'collaborate',
    component: CollaborateComponent,
  },
  {
    path: 'collaborate/:type/:id',
    component: CollaborateComponent,
  },
  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
