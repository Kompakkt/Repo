import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../../src/app/app.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavListComponent } from '../../src/app/components/navigation/sidenav-list/sidenav-list.component';
import { NavbarComponent } from '../../src/app/components/navigation/navbar/navbar.component';
import { FooterComponent } from '../../src/app/components/navigation/footer/footer.component';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { AccountService } from '../../src/app/services/account.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

describe('AppComponent', () => {

  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

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
        MatProgressBarModule,
        BrowserAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader },
        }),
      ],
      declarations: [
        AppComponent,
        SidenavListComponent,
        NavbarComponent,
        FooterComponent,
      ],
      providers: [AccountService],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.debugElement.componentInstance;
  }));

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'Kompakkt'`, () => {
    expect(component.title).toEqual('Kompakkt');
  });
});
