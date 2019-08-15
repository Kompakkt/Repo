import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddCompilationWizardComponent } from './components/wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from './components/wizards/add-entity/add-entity-wizard.component';
import { AddGroupWizardComponent } from './components/wizards/add-group-wizard/add-group-wizard.component';
import { AnnotateComponent } from './components/annotate/annotate.component';
import { CollaborateComponent } from './components/collaborate/collaborate.component';
import { EntityDetailComponent } from './components/entity-detail/entity-detail.component';
import { ExploreEntitiesComponent } from './components/explore-entities/explore-entities.component';
import { HomeComponent } from './components/home/home.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { ContactComponent } from './components/static-pages/contact/contact.component';
import { ImprintComponent } from './components/static-pages/imprint/imprint.component';
import { PrivacyComponent } from './components/static-pages/privacy/privacy.component';

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
    path: 'profile',
    component: ProfilePageComponent,
  },
  {
    path: 'imprint',
    component: ImprintComponent,
    data: {
      title: 'Imprint',
    },
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: {
      title: 'Privacy',
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
    component: EntityDetailComponent,
  },
  {
    path: 'explore',
    component: ExploreEntitiesComponent,
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
  },
  {
    path: 'annotate',
    component: AnnotateComponent,
  },
  {
    path: 'collaborate',
    component: CollaborateComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
