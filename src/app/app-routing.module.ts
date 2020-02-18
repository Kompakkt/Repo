import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AnnotateComponent } from './components/annotate/annotate.component';
import { CollaborateComponent } from './components/collaborate/collaborate.component';
import { DetailPageComponent } from './components/detail-page/detail-page.component';
import { ExploreComponent } from './components/explore/explore.component';
import { HomeComponent } from './components/home/home.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { AdminPageComponent } from './components/admin-page/admin-page.component';
import { AboutComponent } from './components/static-pages/about/about.component';
import { ContactComponent } from './components/static-pages/contact/contact.component';
import { PrivacyComponent } from './components/static-pages/privacy/privacy.component';
import { NotFoundComponent } from './components/notfound/notfound.component';
import { AddCompilationWizardComponent } from './wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from './wizards/add-entity/add-entity-wizard.component';
import { AddGroupWizardComponent } from './wizards/add-group-wizard/add-group-wizard.component';

import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
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
    path: 'add-entity-wizard',
    component: AddEntityWizardComponent,
  },
  {
    path: 'add-compilation-wizard',
    component: AddCompilationWizardComponent,
  },
  {
    path: 'add-group-wizard',
    component: AddGroupWizardComponent,
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
    canActivate: [AuthGuardService],
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [AuthGuardService],
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
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
