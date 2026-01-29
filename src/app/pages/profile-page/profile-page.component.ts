import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { SearchBarComponent } from 'src/app/components/search-bar/search-bar.component';
import { Tab, TabsComponent } from 'src/app/components/tabs/tabs.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, DialogHelperService, SnackbarService } from 'src/app/services';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ProfileEntitiesComponent,
    ProfileCompilationsComponent,
    ProfilePageHeaderComponent,
    TabsComponent,
    SearchBarComponent,
  ],
})
export class ProfilePageComponent implements OnInit {
  #account = inject(AccountService);
  #router = inject(Router);
  #snackbar = inject(SnackbarService);
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #titleService = inject(Title);

  userData = toSignal(this.#account.user$);
  userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });

  availableTabs = [
    { label: 'Objects', value: 'objects' },
    { label: 'Drafts', value: 'drafts' },
    { label: 'Collections', value: 'collections' },
  ] as const satisfies Tab[];
  selectedTab = signal<string>('objects');

  searchText = signal<string>('');

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public openHelp() {
    this.#dialog.open(ProfilePageHelpComponent);
  }

  public openEditDialog() {
    this.#helper.editProfile(this.userProfile());
  }

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – Profile');

    this.#account.user$.pipe(debounceTime(5000)).subscribe(userdata => {
      if (!userdata) {
        // User is not logged in and not authenticated
        this.#snackbar.showMessage('You are not logged in or your session expired.');
        this.#router.navigate(['/']);
      }
    });
  }
}
