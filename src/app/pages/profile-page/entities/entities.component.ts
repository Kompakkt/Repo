import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  Pipe,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import DeepClone from 'rfdc';
import { BehaviorSubject, combineLatest, firstValueFrom, map } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { VisibilityAndAccessDialogComponent } from 'src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  QuickAddService,
  SnackbarService,
} from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { AddCompilationWizardComponent, AddEntityWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, IEntity, isMetadataEntity } from 'src/common';
import { IUserData, IUserDataWithoutData } from 'src/common/interfaces';
import { SelectionBox } from '../selection-box/selection-box.component';
const deepClone = DeepClone({ circles: true });

type EntityFilter = {
  published: boolean;
  unpublished: boolean;
  restricted: boolean;
  unfinished: boolean;
};

@Pipe({
  name: 'isUserOfRole',
  standalone: true,
})
export class IsUserOfRolePipe {
  transform(
    entity: IEntity,
    role: string,
    userData: IUserData | IUserDataWithoutData | undefined,
  ): boolean {
    if (!entity.access || !userData) return false;
    const userAccess = entity.access[userData._id];
    return userAccess && userAccess.role === role;
  }
}

@Component({
  selector: 'app-profile-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatButtonModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSlideToggleModule,
    GridElementComponent,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionBox,
    IsUserOfRolePipe,
  ],
})
export class ProfileEntitiesComponent {
  private translatePipe = inject(TranslatePipe);
  private account = inject(AccountService);
  private dialog = inject(MatDialog);
  private backend = inject(BackendService);
  private helper = inject(DialogHelperService);
  private titleService = inject(Title);
  private quickAdd = inject(QuickAddService);
  private route = inject(ActivatedRoute);
  public selectionService = inject(SelectionService);
  private snackbar = inject(SnackbarService);

  @ViewChildren('gridItem', { read: ElementRef }) gridItems!: QueryList<ElementRef>;

  editorEntitiesInSelection = computed(() => {
    const selectedEntities = this.selectionService.selectedEntities();
    const user = this.user();
    if (!user?._id) return [];
    return selectedEntities.filter(entity => {
      const userAccess = entity.access?.[user._id];
      return userAccess?.role === 'editor';
    });
  });
  selectionHasEditorEntities = computed(() => {
    return this.editorEntitiesInSelection().length > 0;
  });

  public filter$ = new BehaviorSubject<EntityFilter>({
    published: true,
    unpublished: false,
    restricted: false,
    unfinished: false,
  });

  public pageEvent$ = new BehaviorSubject<PageEvent>({
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  });

  public selectedEntities = signal<Set<IEntity>>(new Set());
  public userCompilations = toSignal(this.account.compilations$, { initialValue: null });

  private searchInput = new BehaviorSubject('');

  constructor() {
    this.filteredEntities$.subscribe(entities => {
      const pageEvent = this.pageEvent$.getValue();
      this.pageEvent$.next({ ...pageEvent, length: entities.length });
    });
  }

  public user = toSignal(this.account.user$);

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

  filteredEntitiesSignal = toSignal(this.filteredEntities$);

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
      this.selectionService.clearSelection();
      // Disable wrong filters
      for (const prop in filter) {
        (filter as any)[prop] = prop === property;
      }
    }
    this.filter$.next({ ...filter });

    if (paginator) paginator.firstPage();
  }

  //Single entities
  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public editViewerSettings(entity: IEntity) {
    this.helper.editSettingsInViewer(entity);
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

  //Multi entities

  public openTransferOwnerDialog(entity?: IEntity) {
    const selection = this.selectionService.selectedEntities();
    const data = entity ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.dialog.open(ManageOwnershipComponent, {
      data: data,
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
      });
  }

  public openVisibilityAndAccessDialog(entity?: IEntity) {
    const selection = this.selectionService.selectedEntities();
    const data = entity ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.dialog.open(VisibilityAndAccessDialogComponent, {
      data: data,
      disableClose: true,
    });

    firstValueFrom(dialogRef.afterClosed()).then(
      (result: null | undefined | IEntity | ICompilation) => {
        if (!result) return;
        this.account.updateTrigger$.next(Collection.entity);
      },
    );

    this.selectionService.clearSelection();
  }

  public openCompilationWizard() {
    const selection = this.selectionService.selectedEntities();
    if (!selection || selection.length === 0) {
      this.snackbar.showMessage('Please select at least one entity to add to a compilation.', 5);
      return;
    }

    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: selection,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.account.updateTrigger$.next(Collection.compilation);
      });

    this.selectionService.clearSelection();
  }

  public async quickAddToCompilation(comp: ICompilation) {
    const selection = this.selectionService.selectedEntities();
    if (!selection || selection.length === 0) {
      this.snackbar.showMessage('Please select at least one entity to add to the compilation.', 5);
      return;
    }

    for (const entity of selection) {
      await this.quickAdd.quickAddToCompilation(comp, entity._id.toString());
    }

    this.selectionService.clearSelection();
  }

  public async singleRemoveEntity(entity: IEntity) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${entity.name}?`,
      `Validate login before deleting ${entity.name}`,
    );
    if (!loginData) return;
    this.removeEntity(entity, loginData);
  }

  public async multiRemoveEntities() {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete these ${this.selectionService.selectedEntities().length} items?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService.selectedEntities().forEach(entity => {
      this.removeEntity(entity, loginData);
    });

    this.selectionService.clearSelection();
  }

  public async removeEntity(entity: IEntity, loginData: { username: string; password: string }) {
    const { username, password } = loginData;

    this.backend
      .deleteRequest(entity._id, 'entity', username, password)
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.updateFilter();
      })
      .catch(e => console.error(e));
  }

  //Selection
  public isSelected(entity: IEntity): boolean {
    return this.selectionService.isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    this.selectionService.addToSelection(entity, event);
  }

  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const hasSelectionBoxParent = !!target.closest('.selection');
    const hasForbiddenTagName = ['BUTTON', 'INPUT', 'MAT-ICON', 'MAT-MENU-ITEM'].includes(
      target.tagName,
    );
    if (hasSelectionBoxParent || hasForbiddenTagName) {
      return;
    }

    if (!event.shiftKey && !event.ctrlKey) {
      this.selectionService.onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService.onMouseMove(event);
  }

  onMouseUp() {
    this.selectionService.stopDragging();

    const selectionRect = this.selectionService.getCurrentBoxRect();
    if (!selectionRect) return;

    const user = this.user();
    if (!user?._id) {
      this.snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const entityElementPairs =
      this.filteredEntitiesSignal()?.map((entity, index) => ({
        entity,
        element: this.gridItems.get(index)?.nativeElement as HTMLElement,
      })) || [];

    this.selectionService.selectEntitiesInRect(selectionRect, entityElementPairs);
  }
}
