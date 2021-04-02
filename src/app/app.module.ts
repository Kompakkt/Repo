import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { RouteReuse } from './route-reuse-strategy';
import { AppComponent } from './app.component';
import { AuthDialogComponent } from './components/auth-dialog/auth-dialog.component';
import { EntityDetailComponent } from './components/entity-detail/entity-detail.component';
import { HomeComponent } from './components/home/home.component';
import { AddressComponent } from './components/metadata/address/address.component';
import { EntityComponent } from './components/metadata/entity/entity.component';
import { InstitutionComponent } from './components/metadata/institution/institution.component';
import { PersonComponent } from './components/metadata/person/person.component';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { SidenavListComponent } from './components/navigation/sidenav-list/sidenav-list.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { ContactComponent } from './components/static-pages/contact/contact.component';
import { PrivacyComponent } from './components/static-pages/privacy/privacy.component';
import { UploadComponent } from './components/upload/upload.component';
// Wizards
import { AddEntityWizardComponent } from './wizards/add-entity/add-entity-wizard.component';
import { AddCompilationWizardComponent } from './wizards/add-compilation/add-compilation-wizard.component';

import { SafePipe } from './pipes/safe.pipe';
import { AddGroupWizardComponent } from './wizards/add-group-wizard/add-group-wizard.component';
import { ConfirmationDialogComponent } from './dialogs/confirmation-dialog/confirmation-dialog.component';
import { ExploreComponent } from './components/explore/explore.component';
import { RegisterDialogComponent } from './dialogs/register-dialog/register-dialog.component';
import { EntitySettingsDialogComponent } from './dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { GroupMemberDialogComponent } from './dialogs/group-member-dialog/group-member-dialog.component';
import { EntityRightsDialogComponent } from './dialogs/entity-rights-dialog/entity-rights-dialog.component';
import { AnnotateComponent } from './components/annotate/annotate.component';
import { CollaborateComponent } from './components/collaborate/collaborate.component';
import { AboutComponent } from './components/static-pages/about/about.component';
import { EntityInteractionMenuComponent } from './components/navigation/entity-interaction-menu/entity-interaction-menu.component';
import { ExploreEntityDialogComponent } from './dialogs/explore-entity/explore-entity-dialog.component';
import { UploadApplicationDialogComponent } from './dialogs/upload-application-dialog/upload-application-dialog.component';
import { ProfilePageHelpComponent } from './components/profile-page/profile-page-help.component';
import { ActionbarComponent } from './components/actionbar/actionbar.component';
import { AnimatedImageComponent } from './components/animated-image/animated-image.component';
import { ExploreCompilationDialogComponent } from './dialogs/explore-compilation-dialog/explore-compilation-dialog.component';
import { EditEntityDialogComponent } from './dialogs/edit-entity-dialog/edit-entity-dialog.component';
import { AdminPageComponent } from './components/admin-page/admin-page.component';
import { CompilationDetailComponent } from './components/compilation-detail/compilation-detail.component';
import { DetailPageComponent } from './components/detail-page/detail-page.component';
import { GridElementComponent } from './components/grid-element/grid-element.component';
import { PasswordProtectedDialogComponent } from './dialogs/password-protected-dialog/password-protected-dialog.component';
import { NotFoundComponent } from './components/notfound/notfound.component';
import { DetailEntityComponent } from './components/entity-detail/detail-entity/detail-entity.component';
import { DetailPersonComponent } from './components/entity-detail/detail-person/detail-person.component';
import { DetailInstitutionComponent } from './components/entity-detail/detail-institution/detail-institution.component';
import { FilesizePipe } from './pipes/filesize.pipe';

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
    EntityInteractionMenuComponent,
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
    FlexLayoutModule,
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
