import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfilePageEditComponent } from '../../dialogs/profile-page-edit/profile-page-edit.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ConfirmationDialogComponent,
  EntityRightsDialogComponent,
  EntitySettingsDialogComponent,
} from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import {
  AddEntityWizardComponent,
} from 'src/app/wizards';
import {
  IEntity,
  IUserData,
  isMetadataEntity,
} from 'src/common';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { ProfilePageHeaderComponent } from './profile-page-header/profile-page-header.component'; // Import the header component
import { CollectionsComponent } from 'src/app/components/profile/collections/collections.component';
import { GroupsComponent } from 'src/app/components/profile/groups/groups.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  standalone: true,
  imports: [
    ActionbarComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatExpansionPanelContent,
    MatChipListbox,
    MatChipOption,
    MatTooltip,
    MatRadioGroup,
    MatRadioButton,
    MatFormField,
    MatInput,
    MatPaginator,
    GridElementComponent,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    RouterLink,
    FormsModule,
    AsyncPipe,
    TranslatePipe_1,
    CollectionsComponent,
    GroupsComponent,
    ProfilePageHeaderComponent, // Add the header component to imports
  ],
})
export class ProfilePageComponent implements OnInit {
  public userData: IUserData;
  
  public filter = {
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  };
  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public pageEvent: PageEvent = {
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  };

  private searchInput = new BehaviorSubject('');

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.userData = this.route.snapshot.data.userData;
    
    this.account.user$.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;
    });
  }
  
  public changeEntitySearchText(event: Event, paginator: MatPaginator) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.next(value.toLowerCase());
    paginator.firstPage();
  }

  get filteredEntities$() {
    const { published, unpublished, restricted, unfinished } = this.filter;
    return combineLatest([
      this.account.publishedEntities$,
      this.account.unpublishedEntities$,
      this.account.restrictedEntities$,
      this.account.unfinishedEntities$,
    ]).pipe(
      map(([publishedEntities, unpublishedEntities, restrictedEntities, unfinishedEntities]) => {
        if (published) return publishedEntities;
        if (unpublished) return unpublishedEntities;
        if (restricted) return restrictedEntities;
        if (unfinished) return unfinishedEntities;
        return [];
      }),
      map(entities => {
        this.pageEvent.length = entities.length;
        return entities;
      }),
    );
  }

  get paginatorEntities$() {
    const start = this.pageEvent.pageSize * this.pageEvent.pageIndex;
    const end = start + this.pageEvent.pageSize;
    return combineLatest([this.filteredEntities$, this.searchInput]).pipe(
      map(([arr, searchInput]) => {
        if (!searchInput) return arr;
        return arr
          .filter(_e => {
            let content = _e.name;
            if (isMetadataEntity(_e.relatedDigitalEntity)) {
              content += _e.relatedDigitalEntity.title;
              content += _e.relatedDigitalEntity.description;
            }
            return content.toLowerCase().includes(searchInput);
          })
          .slice(start, end);
      }),
    );
  }

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in this.filter) {
        (this.filter as any)[prop] = prop === property;
      }
    }

    if (paginator) paginator.firstPage();
  }

  public openEntitySettings(entity: IEntity) {
    const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
      data: entity,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        // Replace old entity with new entity
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
        }
      });
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
  }

  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public openEntityOwnerSelection(entity: IEntity) {
    this.dialog.open(EntityRightsDialogComponent, {
      data: entity,
      disableClose: false,
    });
  }

  public editEntity(entity: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          this.updateFilter();
        }
      });
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(ProfilePageEditComponent, {
      data: this.userData
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userData = result; 
      }
    });
  }
  
  public async removeEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(entity._id, 'entity', username, password)
      .then(result => {
        if (this.userData?.data?.entity) {
          this.userData.data.entity = (this.userData.data.entity as IEntity[]).filter(
            _e => _e._id !== entity._id,
          );
          this.updateFilter();
        }
      })
      .catch(e => console.error(e));
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');

    this.backend.getCurrentUserProfile().then(freshUser => {
    this.account.setUserData(freshUser);
  });

  this.account.user$.subscribe(newData => {
    this.userData = newData;
    if (!this.userData) return;
    console.log('userData:', {
      // type: this.userData.type,
      description: this.userData.description,
      displayName: this.userData.displayName,
      imageUrl: this.userData.imageUrl,
      location: this.userData.location,
      socials: this.userData.socials,
    });
  });
  }
}