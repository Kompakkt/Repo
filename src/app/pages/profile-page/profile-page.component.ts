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
import { AccountService, DialogHelperService } from 'src/app/services';
import { ProfileType } from 'src/common';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfileGroupsComponent } from './groups/groups.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    ActionbarComponent,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatRadioModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    ProfileEntitiesComponent,
    ProfileGroupsComponent,
    ProfileCompilationsComponent,
    ProfilePageHeaderComponent,
  ],
})
export class ProfilePageComponent implements OnInit {
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #titleService = inject(Title);

  userData = toSignal(this.#account.user$);
  profiles = toSignal(this.#account.profiles$, { initialValue: [] });
  profileData = computed(() => {
    const profiles = this.profiles();
    return profiles.find(p => p.type === ProfileType.user);
  });

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
    this.#helper.editProfile(this.profileData());
  }

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – Profile');
  }
}
