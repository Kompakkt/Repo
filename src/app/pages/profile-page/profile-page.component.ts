import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  DialogHelperService,
  ProgressBarService,
  SnackbarService,
} from 'src/app/services';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfileGroupsComponent } from './groups/groups.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { combineLatest, debounceTime, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    MatExpansionModule,
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
    ProfileGroupsComponent,
    ProfileCompilationsComponent,
    ProfilePageHeaderComponent,
  ],
})
export class ProfilePageComponent implements OnInit {
  #account = inject(AccountService);
  #router = inject(Router);
  #snackbar = inject(SnackbarService);
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #titleService = inject(Title);
  #progressBarService = inject(ProgressBarService);

  isWaitingForAuthRequest$ = this.#progressBarService.progressState$.pipe(
    map(state => Array.from(state.values()).some(url => url.endsWith('/auth'))),
  );

  userData = toSignal(this.#account.user$);
  userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });

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

    combineLatest([this.isWaitingForAuthRequest$, this.#account.userData$])
      .pipe(debounceTime(500))
      .subscribe(([isWaiting, userData]) => {
        if (!isWaiting && !userData) {
          // User is not logged in and not authenticated
          this.#snackbar.showMessage('You are not logged in or your session expired.');
          this.#router.navigate(['/']);
        }
      });
  }
}
