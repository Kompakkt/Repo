import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NavbarComponent} from './components/navigation/navbar/navbar.component';
import {HomeComponent} from './components/home/home.component';
import {
  MatButtonModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatToolbarModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatSnackBarModule,
  MatGridListModule,
  MatCardModule,
  MatStepperModule,
  MatTableModule,
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SidenavListComponent} from './components/navigation/sidenav-list/sidenav-list.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AuthDialogComponent} from './components/auth-dialog/auth-dialog.component';
import { ModelOverviewComponent } from './components/model-overview/model-overview.component';
import { UploadComponent } from './components/upload/upload.component';
import { WizardComponent } from './components/wizard/wizard.component';
import { FooterComponent } from './components/navigation/footer/footer.component';

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
  entryComponents: [AuthDialogComponent]
})
export class AppModule {
}
