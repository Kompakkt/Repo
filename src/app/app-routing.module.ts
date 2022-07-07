import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  AnnotateComponent,
  CollaborateComponent,
  DetailPageComponent,
  ExploreComponent,
  HomeComponent,
  ProfilePageComponent,
  AdminPageComponent,
  AboutComponent,
  ContactComponent,
  PrivacyComponent,
  NotFoundComponent,
} from './pages';

import { AuthenticatedGuard } from './guards';
import { ProfilePageResolver } from './resolvers';

const routes: Routes = [
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
    path: 'contact',
    component: ContactComponent,
    data: {
      title: 'Contact',
    },
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
    path: 'about',
    component: AboutComponent,
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

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
