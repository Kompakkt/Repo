import { AsyncPipe, CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Output,
  Pipe,
  QueryList,
  signal,
  TemplateRef,
  viewChild,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import DeepClone from 'rfdc';
import { BehaviorSubject, combineLatest, firstValueFrom, map, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { VisibilityAndAccessDialogComponent } from 'src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { 
  Collection,
  EntityAccessRole,
  ICompilation,
  IEntity,
  isEntity,
  isMetadataEntity,
 } from '@kompakkt/common';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { IsUserOfRolePipe } from 'src/app/pipes/is-user-of-role.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
// const deepClone = DeepClone({ circles: true });

@Component({
  selector: 'app-profile-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    SelectionContainerComponent,
    IsUserOfRolePipe,
    MatCheckboxModule,
  ],
})
export class ProfileEntitiesComponent implements AfterViewInit {
  private account = inject(AccountService);
  private dialog = inject(MatDialog);
  private backend = inject(BackendService);
  private helper = inject(DialogHelperService);
  private _rootSelectionService = inject(SelectionService);
  private selectionContainerSignal = signal<SelectionContainerComponent | undefined>(undefined);
  private snackbar = inject(SnackbarService);

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);
  entityType = input.required<'finished' | 'unfinished'>();
  isDraft = computed(() => this.entityType() === 'unfinished');
  entityType$ = toObservable(this.entityType);
  paginator = viewChild(MatPaginator);

  @ViewChildren('gridItem', { read: ElementRef }) gridItems!: QueryList<ElementRef>;
  @ViewChild('sc') set selectionContainer(container: SelectionContainerComponent | undefined) {
    this.selectionContainerSignal.set(container);
  }

  @ViewChild('selectionActions', { static: true })
  selectionActionsTpl!: TemplateRef<unknown>;

  @Output()
  actionsTemplateChange = new EventEmitter<TemplateRef<unknown>>();

  public selectionService = computed<SelectionService>(
    () => this.selectionContainerSignal()?.selectionService ?? this._rootSelectionService,
  );

  public user = toSignal(this.account.user$);

  editorEntitiesInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.editor),
  );
  selectionHasEditorEntities = computed(() => this.editorEntitiesInSelection().length > 0);

  viewerEntitiesInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, EntityAccessRole.viewer),
  );
  selectionHasViewerEntities = computed(() => this.viewerEntitiesInSelection().length > 0);

  readonly singleSelectedEntity = computed(() => this.selectionService().singleSelectedEntity());

  public pageEvent$ = new BehaviorSubject<PageEvent>({
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  });

  public userCompilations = toSignal(this.account.compilations$, { initialValue: null });

  isOwner(entity: IEntity): boolean {
    const user = this.user();
    if (!user?._id) return false;

    const userAccess = entity.access.find(u => u._id === user._id);
    return userAccess?.role === EntityAccessRole.owner;
  }

  constructor() {
    this.filteredEntities$.subscribe(entities => {
      const pageEvent = this.pageEvent$.getValue();
      this.pageEvent$.next({ ...pageEvent, length: entities.length });
    });

    effect(() => {
      const searchText = this.searchText();
      this.paginator()?.firstPage();
    });
  }

  filteredEntities$ = this.entityType$.pipe(
    switchMap(type =>
      type === 'finished' ? this.account.finishedEntities$ : this.account.draftEntities$,
    ),
  );

  filteredEntitiesSignal = toSignal(this.filteredEntities$);

  filteredLength$ = combineLatest([this.filteredEntities$, this.searchText$]).pipe(
    map(([arr, searchInput]) => this.filterEntities(arr, searchInput).length),
  );

  paginatorEntities$ = combineLatest([
    this.filteredEntities$,
    this.searchText$,
    this.pageEvent$,
  ]).pipe(
    map(([arr, searchInput, { pageSize, pageIndex }]) => {
      const filtered = this.filterEntities(arr, searchInput);
      const start = pageSize * pageIndex;
      return filtered.slice(start, start + pageSize);
    }),
  );

  paginatorEntitiesSignal = toSignal(this.paginatorEntities$);

  private filterEntities(arr: IEntity[], searchInput: string): IEntity[] {
    return arr.filter(_e => {
      let content = _e.name;
      if (isMetadataEntity(_e.relatedDigitalEntity)) {
        content += _e.relatedDigitalEntity.title;
        content += _e.relatedDigitalEntity.description;
      }
      return content.toLowerCase().includes(searchInput);
    });
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

    return this.helper.editEntity(resolvedEntity);
  }

  //Multi entities

  public openTransferOwnerDialog(entity?: IEntity) {
    const selection = this.selectionService().selectedElements();
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
      });
  }

  public openVisibilityAndAccessDialog(entity?: IEntity) {
    const selection = this.selectionService().selectedElements();
    const data = entity ? [entity] : selection.filter(isEntity);
    this.helper.editVisibilityAndAccess(data);
    this.selectionService().clearSelection();
  }

  public async quickAddToCompilation(entity?: IEntity) {
    const selectedEntities = (() => {
      if (entity) return [entity];
      const selection = this.selectionService().selectedElements();
      if (!selection || selection.length === 0) return [];
      return this.selectionService().selectedElements().filter(isEntity);
    })();

    if (selectedEntities.length === 0) {
      this.snackbar.showMessage('Please select at least one entity to add to the compilation.', 5);
      return;
    }

    this.helper
      .addToCompilation(selectedEntities)
      .afterClosed()
      .subscribe(result => {
        if (result?.hasSavedChanges) {
          this.selectionService().clearSelection();
        }
      });
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
      `Do you really want to delete these ${this.selectionService().selectedElements().length} items?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService()
      .selectedElements()
      .forEach(entity => {
        if (isEntity(entity)) {
          this.removeEntity(entity, loginData);
        }
      });

    this.selectionService().clearSelection();
  }

  public async removeEntity(entity: IEntity, loginData: { username: string; password: string }) {
    const { username, password } = loginData;
    const isOwner = this.isOwner(entity);

    if (isOwner) {
      this.backend
        .deleteRequest(entity._id, 'entity', username, password)
        .then(result => {
          this.account.updateTrigger$.next(Collection.entity);
        })
        .catch(e => console.error(e));
    } else {
      this.backend
        .removeSelfFromAccess('entity', entity._id)
        .then(result => {
          this.account.updateTrigger$.next(Collection.entity);
        })
        .catch(e => console.error(e));
    }
  }

  //Selection
  public isSelected(entity: IEntity): boolean {
    return this.selectionService().isSelected(entity);
  }

  public addEntityToSelection(entity: IEntity, event: MouseEvent) {
    this.selectionService().updateSelection(entity, event);
  }

  public changeSelectionOnCheckbox(entity: IEntity) {
    this.selectionService().updateSelection(entity, undefined, true);
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
      this.selectionService().onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService().onMouseMove(event);
  }

  onMouseUp() {
    const selectionRect = this.selectionService().getCurrentBoxRect();
    this.selectionService().stopDragging();
    if (!selectionRect) return;

    const user = this.user();
    if (!user?._id) {
      this.snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const entityElementPairs =
      this.paginatorEntitiesSignal()?.map((element, index) => ({
        element,
        htmlElement: this.gridItems.get(index)?.nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectElementsInRect(selectionRect, entityElementPairs);
  }

  ngAfterViewInit() {
    this.actionsTemplateChange.emit(this.selectionActionsTpl);
  }
}
