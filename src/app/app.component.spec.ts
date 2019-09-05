import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {MatSidenavModule} from "@angular/material/sidenav";
import {SidenavListComponent} from "./components/navigation/sidenav-list/sidenav-list.component";
import {NavbarComponent} from "./components/navigation/navbar/navbar.component";
import {FooterComponent} from "./components/navigation/footer/footer.component";
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule
} from "@ngx-translate/core";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatListModule} from "@angular/material/list";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {HttpClientModule} from "@angular/common/http";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatDialogModule} from "@angular/material/dialog";
import {AccountService} from "./services/account.service";

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
          RouterTestingModule,
          MatSidenavModule,
          MatListModule,
          MatIconModule,
          MatToolbarModule,
          MatSnackBarModule,
          MatDialogModule,
          BrowserAnimationsModule,
          HttpClientModule,
          TranslateModule.forRoot({
            loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
          })],
      declarations: [
          AppComponent,
          SidenavListComponent,
          NavbarComponent,
          FooterComponent
      ],
      providers: [
          AccountService
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Kompakkt'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Kompakkt');
  });
});
