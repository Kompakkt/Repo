import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { CollectionsComponent } from 'src/app/components/profile/collections/collections.component';
import { GroupsComponent } from 'src/app/components/profile/groups/groups.component';
import { EntityRightsDialogComponent, EntitySettingsDialogComponent } from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { AddEntityWizardComponent } from 'src/app/wizards';
import { Collection, IEntity, isMetadataEntity } from 'src/common';
import { IUserDataWithoutData } from 'src/common/interfaces';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import DeepClone from 'rfdc';
const deepClone = DeepClone({ circles: true });

type EntityFilter = {
  published: boolean;
  unpublished: boolean;
  restricted: boolean;
  unfinished: boolean;
};

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
    MatFormField,
    MatInput,
    MatPaginator,
    GridElementComponent,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    AsyncPipe,
    TranslatePipe,
    GroupsComponent,
    CollectionsComponent,
  ],
})
export class ProfilePageComponent implements OnInit {
  public userData: IUserDataWithoutData | undefined;

  public filter$ = new BehaviorSubject<EntityFilter>({
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  });

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public pageEvent$ = new BehaviorSubject<PageEvent>({
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  });

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
    this.account.user$.subscribe(newData => {
      this.userData = newData;
    });

    this.filteredEntities$.subscribe(entities => {
      const pageEvent = this.pageEvent$.getValue();
      this.pageEvent$.next({ ...pageEvent, length: entities.length });
    });
  }

  public changeEntitySearchText(event: Event, paginator: MatPaginator) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchInput.next(value.toLowerCase());
    paginator.firstPage();
  }

  filteredEntities$ = combineLatest([
    this.account.publishedEntities$,
    this.account.unpublishedEntities$,
    this.account.restrictedEntities$,
    this.account.unfinishedEntities$,
    this.filter$,
  ]).pipe(
    map(
      ([
        publishedEntities,
        unpublishedEntities,
        restrictedEntities,
        unfinishedEntities,
        filter,
      ]) => {
        const { published, unpublished, restricted, unfinished } = filter;
        if (published) return publishedEntities;
        if (unpublished) return unpublishedEntities;
        if (restricted) return restrictedEntities;
        if (unfinished) return unfinishedEntities;
        return [];
      },
    ),
  );

  paginatorEntities$ = combineLatest([
    this.filteredEntities$,
    this.searchInput,
    this.pageEvent$,
  ]).pipe(
    map(([arr, searchInput, { pageSize, pageIndex }]) => {
      if (!searchInput) return arr;
      const start = pageSize * pageIndex;
      const end = start + pageSize;
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

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    const filter = this.filter$.getValue();
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in filter) {
        (filter as any)[prop] = prop === property;
      }
    }
    this.filter$.next({ ...filter });

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
        this.account.updateTrigger$.next(Collection.entity);
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

  public async editEntity(entity: IEntity) {
    const resolvedEntity = await this.backend.getEntity(entity._id);

    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: resolvedEntity,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
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
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
      })
      .catch(e => console.error(e));
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}
