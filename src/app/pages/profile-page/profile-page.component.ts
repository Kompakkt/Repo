import { Component, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
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
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ConfirmationDialogComponent,
  EntityRightsDialogComponent,
  EntitySettingsDialogComponent,
  GroupMemberDialogComponent,
  VisibilityAndAccessDialogComponent
} from 'src/app/dialogs';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import {
  AddCompilationWizardComponent,
  AddEntityWizardComponent,
  AddGroupWizardComponent,
} from 'src/app/wizards';
import {
  ICompilation,
  IEntity,
  IGroup,
  IUserData,
  isCompilation,
  isGroup,
  isMetadataEntity,
} from 'src/common';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { DigitalEntity } from 'src/app/metadata';
import { ObjectsComponent } from "../../components/profile/objects/objects.component";

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
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardActions,
    MatExpansionPanelActionRow,
    MatButton,
    MatDivider,
    MatSlideToggle,
    FormsModule,
    AsyncPipe,
    TranslatePipe_1,
    ObjectsComponent
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

  public showPartakingGroups = false;
  public showPartakingCompilations = false;

  private __partakingGroups: IGroup[] = [];
  private __partakingCompilations: ICompilation[] = [];

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
      this.backend
        .findUserInGroups()
        .then(groups => (this.__partakingGroups = groups))
        .catch(e => console.error(e));

      this.backend
        .findUserInCompilations()
        .then(compilations => (this.__partakingCompilations = compilations))
        .catch(e => console.error(e));
      // this.updateFilter();
    });
  }

  // public changeEntitySearchText(event: Event, paginator: MatPaginator) {
  //   const value = (event.target as HTMLInputElement)?.value ?? '';
  //   this.searchInput.next(value.toLowerCase());
  //   paginator.firstPage();
  // }

  // get filteredEntities$() {
  //   const { published, unpublished, restricted, unfinished } = this.filter;
  //   return combineLatest([
  //     this.account.publishedEntities$,
  //     this.account.unpublishedEntities$,
  //     this.account.restrictedEntities$,
  //     this.account.unfinishedEntities$,
  //   ]).pipe(
  //     map(([publishedEntities, unpublishedEntities, restrictedEntities, unfinishedEntities]) => {
  //       if (published) return publishedEntities;
  //       if (unpublished) return unpublishedEntities;
  //       if (restricted) return restrictedEntities;
  //       if (unfinished) return unfinishedEntities;
  //       return [];
  //     }),
  //     map(entities => {
  //       this.pageEvent.length = entities.length;
  //       return entities;
  //     }),
  //   );
  // }

  // get paginatorEntities$() {
  //   const start = this.pageEvent.pageSize * this.pageEvent.pageIndex;
  //   const end = start + this.pageEvent.pageSize;
  //   return combineLatest([this.filteredEntities$, this.searchInput]).pipe(
  //     map(([arr, searchInput]) => {
  //       if (!searchInput) return arr;
  //       return arr
  //         .filter(_e => {
  //           let content = _e.name;
  //           if (isMetadataEntity(_e.relatedDigitalEntity)) {
  //             content += _e.relatedDigitalEntity.title;
  //             content += _e.relatedDigitalEntity.description;
  //           }
  //           return content.toLowerCase().includes(searchInput);
  //         })
  //         .slice(start, end);
  //     }),
  //   );
  // }

  // public async updateFilter(property?: string, paginator?: MatPaginator) {
  //   // On radio button change
  //   if (property) {
  //     // Disable wrong filters
  //     for (const prop in this.filter) {
  //       (this.filter as any)[prop] = prop === property;
  //     }
  //   }

  //   if (paginator) paginator.firstPage();
  // }

  // public openEntitySettings(entity: IEntity) {
  //   const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
  //     data: entity,
  //     disableClose: true,
  //   });

  //   dialogRef
  //     .afterClosed()
  //     .toPromise()
  //     .then(result => {
  //       // Replace old entity with new entity
  //       if (result && this.userData && this.userData.data.entity) {
  //         const index = (this.userData.data.entity as IEntity[]).findIndex(
  //           _en => result._id === _en._id,
  //         );
  //         if (index === -1) return;
  //         this.userData.data.entity.splice(index, 1, result as IEntity);
  //       }
  //     });
  // }

  // public editViewerSettings(entity: IEntity) {
  //   this.helper.editSettingsInViewer(entity);
  // }

  // public continueEntityUpload(entity: IEntity) {
  //   this.editEntity(entity);
  // }

  // public openEntityOwnerSelection(entity: IEntity) {
  //   this.dialog.open(EntityRightsDialogComponent, {
  //     data: entity,
  //     disableClose: false,
  //   });
  // }

  // public editEntity(entity: IEntity) {
  //   const dialogRef = this.dialog.open(AddEntityWizardComponent, {
  //     data: entity,
  //     disableClose: true,
  //   });

  //   dialogRef
  //     .afterClosed()
  //     .toPromise()
  //     .then(result => {
  //       if (result && this.userData && this.userData.data.entity) {
  //         const index = (this.userData.data.entity as IEntity[]).findIndex(
  //           _en => result._id === _en._id,
  //         );
  //         if (index === -1) return;
  //         this.userData.data.entity.splice(index, 1, result as IEntity);
  //         this.updateFilter();
  //       }
  //     });
  // }

  // public async singleRemoveEntity(entity: IEntity) {
  //   const loginData = await this.helper.confirmWithAuth(
  //     `Do you really want to delete ${entity.name}?`,
  //     `Validate login before deleting ${entity.name}`,
  //   );

  //   this.removeEntity(entity, loginData);
  // }

  // public async removeEntity(entity: IEntity, loginData) {

  //   if (!loginData) return;
  //   const { username, password } = loginData;

  //   // Delete
  //   this.backend
  //     .deleteRequest(entity._id, 'entity', username, password)
  //     .then(result => {
  //       console.log(result);
  //       if (this.userData?.data?.entity) {
  //         this.userData.data.entity = (this.userData.data.entity as IEntity[]).filter(
  //           _e => _e._id !== entity._id,
  //         );
  //         this.updateFilter();
  //       }
  //     })
  //     .catch(e => console.error(e));
  // }

  // Groups
  get userGroups(): IGroup[] {
    return this.userData?.data?.group?.filter(group => isGroup(group)) ?? [];
  }

  get partakingGroups(): IGroup[] {
    return this.__partakingGroups;
  }

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? group : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        if (!result) return;
        if (!this.userData) return;
        // Add new group to list
        this.userData.data.group = this.userData.data.group
          ? [...this.userData.data.group, result]
          : [result];
      });
  }

  public openMemberList(group: IGroup) {
    this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${group.name}?`,
      `Validate login before deleting ${group.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    this.backend
      .deleteRequest(group._id, 'group', username, password)
      .then(result => {
        if (this.userData?.data?.group) {
          this.userData.data.group = (this.userData.data.group as IGroup[]).filter(
            _g => _g._id !== group._id,
          );
        }
      })
      .catch(e => console.error(e));
  }

  public leaveGroupDialog(group: IGroup) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result) {
          // TODO: leave
          console.log('Leave', group);
        }
      });
  }

  // Compilations
  get userCompilations(): ICompilation[] {
    return this.userData?.data?.compilation?.filter(comp => isCompilation(comp)) ?? [];
  }

  get partakingCompilations(): ICompilation[] {
    return this.__partakingCompilations;
  }

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data.compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result);
          }
        }
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        if (this.userData?.data?.compilation) {
          this.userData.data.compilation = (
            this.userData.data.compilation as ICompilation[]
          ).filter(comp => comp._id !== compilation._id);
        }
      })
      .catch(e => console.error(e));
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }

  //New
  // selectedEntities = signal<Set<IEntity>>(new Set());

  // public addToSelection(entity: IEntity, event: MouseEvent) {

  //   this.selectedEntities.update((selection) => {
  //     const newSelection = new Set(selection);
  //     const existingEntity = [...newSelection].some(e => e.relatedDigitalEntity._id === entity.relatedDigitalEntity._id);

  //     if(event.shiftKey) {
  //       existingEntity ? newSelection.delete(entity) : newSelection.add(entity);
  //     } else {
  //       newSelection.clear();
  //       newSelection.add(entity);
  //     }
      
  //     return newSelection;
  //   });
  // }

  // public hasEntityID(entityId: string): boolean {
  //   return [...this.selectedEntities()].some(e => e.relatedDigitalEntity._id === entityId);
  // }

  // public clearSelection() {
  //   this.selectedEntities().clear();
  // }

  // public async multiRemoveEntities() {
  //   const loginData = await this.helper.confirmWithAuth(
  //     `Do you really want to delete these ${this.selectedEntities().size} items?`,
  //     `Validate login before deleting.`,
  //   );

  //   this.selectedEntities().forEach(entity => {
  //     this.removeEntity(entity, loginData);
  //   });

  //   this.clearSelection();
  // }
  // addEntitiesToCollection(){
  //   console.log("Add Entity to collection");
  // }
  // manageOwners(){
  //   console.log("Visibility and access => to be continued!")
  // }
}