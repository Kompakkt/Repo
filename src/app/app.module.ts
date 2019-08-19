import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatOptionModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthDialogComponent } from './components/auth-dialog/auth-dialog.component';
import { EntityDetailComponent } from './components/entity-detail/entity-detail.component';
import { EntityOverviewComponent } from './components/entity-overview/entity-overview.component';
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
import { ImprintComponent } from './components/static-pages/imprint/imprint.component';
import { PrivacyComponent } from './components/static-pages/privacy/privacy.component';
import { UploadComponent } from './components/upload/upload.component';
// Wizards
import { AddEntityWizardComponent } from './components/wizards/add-entity/add-entity-wizard.component';
import { AddCompilationWizardComponent } from './components/wizards/add-compilation/add-compilation-wizard.component';
import {MediaTypePipe} from './pipes/media-type';

import { SafePipe } from './pipes/safe.pipe';
import { AddGroupWizardComponent } from './components/wizards/add-group-wizard/add-group-wizard.component';
import { ConfirmationDialogComponent } from './components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { ExploreComponent } from './components/explore/explore.component';
import { RegisterDialogComponent } from './components/dialogs/register-dialog/register-dialog.component';
import { EntitySettingsDialogComponent } from './components/dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { GroupMemberDialogComponent } from './components/dialogs/group-member-dialog/group-member-dialog.component';
import { EntityRightsDialogComponent } from './components/dialogs/entity-rights-dialog/entity-rights-dialog.component';
import { AnnotateComponent } from './components/annotate/annotate.component';
import { CollaborateComponent } from './components/collaborate/collaborate.component';
import { AboutComponent } from './components/static-pages/about/about.component';

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
    EntityOverviewComponent,
    UploadComponent,
    AddEntityWizardComponent,
    AddCompilationWizardComponent,
    FooterComponent,
    ImprintComponent,
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
    MediaTypePipe,
  ],
            imports: [
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
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    AuthDialogComponent,
    ConfirmationDialogComponent,
    RegisterDialogComponent,
    EntitySettingsDialogComponent,
    AddGroupWizardComponent,
    GroupMemberDialogComponent,
    EntityRightsDialogComponent,
  ],
})
export class AppModule {}
