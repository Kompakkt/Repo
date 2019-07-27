import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatSnackBarModule,
  MatStepperModule,
  MatTableModule,
  MatToolbarModule,
} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AuthDialogComponent} from './components/auth-dialog/auth-dialog.component';
import {HomeComponent} from './components/home/home.component';
import {ModelOverviewComponent} from './components/model-overview/model-overview.component';
import {FooterComponent} from './components/navigation/footer/footer.component';
import {NavbarComponent} from './components/navigation/navbar/navbar.component';
import {SidenavListComponent} from './components/navigation/sidenav-list/sidenav-list.component';
import {ContactComponent} from './components/static-pages/contact/contact.component';
import {ImprintComponent} from './components/static-pages/imprint/imprint.component';
import {PrivacyComponent} from './components/static-pages/privacy/privacy.component';
import {UploadComponent} from './components/upload/upload.component';
import {WizardComponent} from './components/wizard/wizard.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    SidenavListComponent,
    AuthDialogComponent,
    ModelOverviewComponent,
    UploadComponent,
    WizardComponent,
    FooterComponent,
    ImprintComponent,
    ContactComponent,
    PrivacyComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
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
    FormsModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [AuthDialogComponent],
})
export class AppModule {
}
