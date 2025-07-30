import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfilePageEditComponent } from '../../dialogs/profile-page-edit/profile-page-edit.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import DeepClone from 'rfdc';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IUserDataWithoutData } from 'src/common/interfaces';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { ProfileCompilationsComponent } from './compilations/compilations.component';
import { ProfileEntitiesComponent } from './entities/entities.component';
import { ProfileGroupsComponent } from './groups/groups.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
const deepClone = DeepClone({ circles: true });
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component'; // Import the header component
import { CollectionsComponent } from 'src/app/components/profile/collections/collections.component';
import { GroupsComponent } from 'src/app/components/profile/groups/groups.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  imports: [
    ActionbarComponent,
    MatExpansionModule,
    MatChipListbox,
    MatChipOption,
    MatTooltip,
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
  ]
})
export class ProfilePageComponent implements OnInit {
  public userData: IUserDataWithoutData | undefined;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.account.user$.subscribe(newData => {
      this.userData = newData;
    });
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  public openEditDialog() {
    const dialogRef = this.dialog.open(ProfilePageEditComponent, {
      data: this.userData,
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
        this.backend.getCurrentUserProfile().then(freshUser => {
          this.userData = freshUser;
        });
    });
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}
