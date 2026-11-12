import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
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
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
  withRouterResources,
} from '@angular/router';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { RouteReuse } from 'src/app/route-reuse-strategy';
import { exploreTimingInterceptor } from 'src/app/services/interceptors/explore-timing-interceptor';
import { httpErrorInterceptor } from 'src/app/services/interceptors/http-error-interceptor';
import { httpOptionsInterceptor } from 'src/app/services/interceptors/http-options-interceptor';
import { jwtInterceptor } from './services/interceptors/jwt-interceptor';
import { TranslateService } from 'src/app/services/translate.service';
import { pluginProviders } from './app.plugin';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      CommonModule,
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
    ),
    TranslateService,
    TranslatePipe,
    { provide: RouteReuseStrategy, useClass: RouteReuse },
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withComponentInputBinding(),
      withRouterResources(),
    ),
    provideAppInitializer(() => inject(TranslateService).requestLanguage('en')),
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: 'full' } },
    { provide: LOCALE_ID, useValue: 'en-US' },
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        exploreTimingInterceptor,
        httpErrorInterceptor,
        httpOptionsInterceptor,
        jwtInterceptor,
      ]),
    ),
    pluginProviders,
  ],
};
