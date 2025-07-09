import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, Provider, LOCALE_ID, importProvidersFrom } from '@angular/core';
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
import { MatSortModule } from '@angular/material/sort';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { RouteReuse } from 'src/app/route-reuse-strategy';
import { ExploreTimingInterceptor } from 'src/app/services/interceptors/explore-timing-interceptor';
import { HttpErrorInterceptor } from 'src/app/services/interceptors/http-error-interceptor';
import { HttpOptionsInterceptor } from 'src/app/services/interceptors/http-options-interceptor';
import { RequestProgressInterceptor } from 'src/app/services/interceptors/request-progress-interceptor';
import { TranslateService } from 'src/app/services/translate.service';

const INTERCEPTORS: Provider[] = [
  HttpErrorInterceptor,
  HttpOptionsInterceptor,
  RequestProgressInterceptor,
  ExploreTimingInterceptor,
].map(useClass => ({ provide: HTTP_INTERCEPTORS, multi: true, useClass }));

import { ApplicationConfig } from '@angular/core';
import { routes } from './app.routes';
import { pluginProviders } from './app.plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      CommonModule,
      BrowserModule,
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
      MatSortModule,
      FormsModule,
      ReactiveFormsModule,
    ),
    TranslateService,
    TranslatePipe,
    {
      provide: [APP_INITIALIZER, RouteReuseStrategy],
      useFactory: (service: TranslateService) => service.requestLanguage(),
      deps: [TranslateService],
      useClass: RouteReuse,
      multi: true,
    },
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { dateFormat: 'full' },
    },
    {
      provide: LOCALE_ID,
      useValue: 'en-US',
    },
    ...INTERCEPTORS,
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
    ),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    pluginProviders,
  ],
};
