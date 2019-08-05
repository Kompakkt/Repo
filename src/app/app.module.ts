import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatRadioModule,
  MatSidenavModule,
  MatSnackBarModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthDialogComponent } from './components/auth-dialog/auth-dialog.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { SidenavListComponent } from './components/navigation/sidenav-list/sidenav-list.component';
import { ObjectDetailComponent } from './components/object-detail/object-detail.component';
import { ObjectOverviewComponent } from './components/object-overview/object-overview.component';
import { ContactComponent } from './components/static-pages/contact/contact.component';
import { ImprintComponent } from './components/static-pages/imprint/imprint.component';
import { PrivacyComponent } from './components/static-pages/privacy/privacy.component';
import { UploadComponent } from './components/upload/upload.component';
import { WizardComponent } from './components/wizard/wizard.component';
import { SafePipe } from './pipes/safe.pipe';
import { PersonComponent } from './components/metadata/person/person.component';
import { InstitutionComponent } from './components/metadata/institution/institution.component';
import { EntityComponent } from './components/metadata/entity/entity.component';
import { AddressComponent } from './components/metadata/address/address.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';

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
    ObjectOverviewComponent,
    UploadComponent,
    WizardComponent,
    FooterComponent,
    ImprintComponent,
    ContactComponent,
    PrivacyComponent,
    ObjectDetailComponent,
    SafePipe,
    PersonComponent,
    InstitutionComponent,
    EntityComponent,
    AddressComponent,
    ProfilePageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
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
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatCheckboxModule,
    MatRadioModule,
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
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [AuthDialogComponent],
})
export class AppModule {}
