import {HttpClient, HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule, MatExpansionModule,
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
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AuthDialogComponent} from './components/auth-dialog/auth-dialog.component';
import {EntityDetailComponent} from './components/entity-detail/entity-detail.component';
import {EntityOverviewComponent} from './components/entity-overview/entity-overview.component';
import {HomeComponent} from './components/home/home.component';
import {AddressComponent} from './components/metadata/address/address.component';
import {EntityComponent} from './components/metadata/entity/entity.component';
import {InstitutionComponent} from './components/metadata/institution/institution.component';
import {PersonComponent} from './components/metadata/person/person.component';
import {FooterComponent} from './components/navigation/footer/footer.component';
import {NavbarComponent} from './components/navigation/navbar/navbar.component';
import {SidenavListComponent} from './components/navigation/sidenav-list/sidenav-list.component';
import {ProfilePageComponent} from './components/profile-page/profile-page.component';
import {ContactComponent} from './components/static-pages/contact/contact.component';
import {ImprintComponent} from './components/static-pages/imprint/imprint.component';
import {PrivacyComponent} from './components/static-pages/privacy/privacy.component';
import {UploadComponent} from './components/upload/upload.component';
// Wizards
import {AddEntityWizardComponent} from './components/wizards/add-entity/add-entity-wizard.component';
import {SafePipe} from './pipes/safe.pipe';

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
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [AuthDialogComponent],
})
export class AppModule {}
