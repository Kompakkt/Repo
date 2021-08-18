// External dependencies
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { RouteReuse } from './route-reuse-strategy';
import { AppComponent } from './app.component';

// Angular Material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import {
  AuthDialogComponent,
  EntityDetailComponent,
  AddressComponent,
  EntityComponent,
  InstitutionComponent,
  PersonComponent,
  FooterComponent,
  NavbarComponent,
  SidenavListComponent,
  UploadComponent,
  ActionbarComponent,
  AnimatedImageComponent,
  CompilationDetailComponent,
  GridElementComponent,
  DetailEntityComponent,
  DetailPersonComponent,
  DetailInstitutionComponent,
} from './components';

// Pages
import {
  AnnotateComponent,
  CollaborateComponent,
  DetailPageComponent,
  ExploreComponent,
  HomeComponent,
  ProfilePageComponent,
  ProfilePageHelpComponent,
  AdminPageComponent,
  AboutComponent,
  ContactComponent,
  PrivacyComponent,
  NotFoundComponent,
} from './pages';

// Wizards
import {
  AddCompilationWizardComponent,
  AddEntityWizardComponent,
  AddGroupWizardComponent,
} from './wizards';

// Pipes
import { FilesizePipe, SafePipe } from './pipes';

// Dialogs
import {
  ConfirmationDialogComponent,
  RegisterDialogComponent,
  EntitySettingsDialogComponent,
  GroupMemberDialogComponent,
  EntityRightsDialogComponent,
  ExploreEntityDialogComponent,
  UploadApplicationDialogComponent,
  ExploreCompilationDialogComponent,
  EditEntityDialogComponent,
  PasswordProtectedDialogComponent,
} from './dialogs';

const createTranslateLoader = (http: HttpClient) => {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
};

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    SidenavListComponent,
    AuthDialogComponent,
    UploadComponent,
    AddEntityWizardComponent,
    AddCompilationWizardComponent,
    FooterComponent,
    ContactComponent,
    PrivacyComponent,
    EntityDetailComponent,
    SafePipe,
    PersonComponent,
    InstitutionComponent,
    EntityComponent,
    AddressComponent,
    ProfilePageComponent,
    AddGroupWizardComponent,
    ConfirmationDialogComponent,
    ExploreComponent,
    RegisterDialogComponent,
    EntitySettingsDialogComponent,
    GroupMemberDialogComponent,
    EntityRightsDialogComponent,
    AnnotateComponent,
    CollaborateComponent,
    AboutComponent,
    ExploreEntityDialogComponent,
    UploadApplicationDialogComponent,
    ProfilePageHelpComponent,
    ActionbarComponent,
    AnimatedImageComponent,
    ExploreCompilationDialogComponent,
    EditEntityDialogComponent,
    AdminPageComponent,
    CompilationDetailComponent,
    DetailPageComponent,
    GridElementComponent,
    PasswordProtectedDialogComponent,
    NotFoundComponent,
    DetailEntityComponent,
    DetailPersonComponent,
    DetailInstitutionComponent,
    FilesizePipe,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    DragDropModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatGridListModule,
    MatCardModule,
    MatStepperModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressBarModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: RouteReuse,
    },
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    AuthDialogComponent,
    ConfirmationDialogComponent,
    RegisterDialogComponent,
    EntitySettingsDialogComponent,
    AddGroupWizardComponent,
    GroupMemberDialogComponent,
    EntityRightsDialogComponent,
    ExploreEntityDialogComponent,
    UploadApplicationDialogComponent,
    ProfilePageHelpComponent,
    ExploreCompilationDialogComponent,
    EditEntityDialogComponent,
    PasswordProtectedDialogComponent,
  ],
})
export class AppModule {}
