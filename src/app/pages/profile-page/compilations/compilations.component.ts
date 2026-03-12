import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Output,
  QueryList,
  signal,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { combineLatest, firstValueFrom, map, switchMap } from 'rxjs';

import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { VisibilityAndAccessDialogComponent } from 'src/app/dialogs';
import { ManageOwnershipComponent } from 'src/app/dialogs/manage-ownership/manage-ownership.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { CacheManagerService } from 'src/app/services/cache-manager.service';
import { SelectionService } from 'src/app/services/selection.service';
import { Collection, EntityAccessRole, ICompilation, IEntity, isCompilation } from 'src/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-profile-compilations',
  templateUrl: './compilations.component.html',
  styleUrls: ['./compilations.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    GridElementComponent,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionContainerComponent,
    MatCheckboxModule,
  ],
})
export class ProfileCompilationsComponent implements AfterViewInit {
  #cache = inject(CacheManagerService);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #dialogHelper = inject(DialogHelperService);
  #rootSelectionService = inject(SelectionService);
  #selectionContainerSignal = signal<SelectionContainerComponent | undefined>(undefined);
  #snackbar = inject(SnackbarService);

  @ViewChildren('gridItem', { read: ElementRef }) gridItems!: QueryList<ElementRef>;
  @ViewChild('sc') set selectionContainer(container: SelectionContainerComponent | undefined) {
    this.#selectionContainerSignal.set(container);
  }

  @ViewChild('selectionActions', { static: true })
  selectionActionsTpl!: TemplateRef<unknown>;

  @Output()
  actionsTemplateChange = new EventEmitter<TemplateRef<unknown>>();

  showPartakingCompilations = signal(false);
  showPartakingCompilations$ = toObservable(this.showPartakingCompilations);

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);

  user = toSignal(this.#account.user$);

  editorCompilationsInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, 'editor'),
  );
  selectionHasEditorCompilations = computed(() => this.editorCompilationsInSelection().length > 0);

  viewerCompilationsInSelection = computed(() =>
    this.selectionService().filterByRole(this.user()?._id, 'viewer'),
  );
  selectionHasViewerCompilations = computed(() => this.viewerCompilationsInSelection().length > 0);

  isOwner(compilation: ICompilation): boolean {
    const user = this.user();
    if (!user?._id) return false;

    const userAccess = compilation.access?.[user._id];
    return userAccess?.role === 'owner';
  }

  public selectionService = computed<SelectionService>(
    () => this.#selectionContainerSignal()?.selectionService ?? this.#rootSelectionService,
  );

  userCompilations$ = this.#account.compilationsWithEntities$.pipe(
    map(compilations => compilations.filter(c => isCompilation(c))),
  );

  partakingCompilations$ = this.#account.user$.pipe(
    switchMap(() =>
      this.#cache.getItem<ICompilation[]>('profile-partaking-compilations', () =>
        this.#backend.findUserInCompilations(),
      ),
    ),
  );

  filteredCompilations$ = combineLatest(
    this.searchText$,
    this.showPartakingCompilations$,
    this.userCompilations$,
    this.partakingCompilations$,
  ).pipe(
    map(([text, showPartaking, userCompilations, partakingCompilations]) => {
      const compilations = showPartaking ? partakingCompilations : userCompilations;

      /* Change owner of legacy-collections, when accessfield is empty */
      if (compilations) this.tryAccessField(compilations);

      if (!compilations || compilations.length === 0) return { empty: true, results: [] };
      if (!text || text.trim().length === 0) return { empty: false, results: compilations };
      text = text.trim().toLowerCase();
      return {
        empty: false,
        results: compilations.filter(c =>
          ((c.__normalizedName || c.name) + c.description)
            .toLowerCase()
            .includes(text.toLowerCase()),
        ),
      };
    }),
  );

  filteredCompilationsSignal = toSignal(this.filteredCompilations$);

  readonly singleSelectedCompilation = computed(() =>
    this.selectionService().singleSelectedCompilation(),
  );

  public openRemoveCompilationDialog(compilation: ICompilation) {
    this.#dialogHelper.removeFromCompilation(compilation);
  }

  public openTransferOwnerDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.#dialog.open(ManageOwnershipComponent, {
      data: data,
      disableClose: false,
    });

    firstValueFrom(dialogRef.afterClosed()).then(result => {
      this.#account.updateTrigger$.next(Collection.compilation);
    });
  }

  public openVisibilityAndAccessDialog(compilation?: ICompilation) {
    const selection = this.selectionService().selectedElements();
    const data = compilation ?? (selection.length === 1 ? selection[0] : selection);

    const dialogRef = this.#dialog.open(VisibilityAndAccessDialogComponent, {
      data: data,
      disableClose: true,
    });

    firstValueFrom(dialogRef.afterClosed()).then(
      (result: null | undefined | IEntity | ICompilation) => {
        if (!result) return;
        this.#account.updateTrigger$.next(Collection.compilation);
      },
    );

    this.selectionService().clearSelection();
  }

  public async singleRemoveCompilation(compilation: ICompilation) {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    this.removeCompilation(compilation, loginData);
  }

  public async multiRemoveCompilations() {
    const loginData = await this.#dialogHelper.confirmWithAuth(
      `Do you really want to delete these ${this.selectionService().selectedElements().length}?`,
      `Validate login before deleting.`,
    );
    if (!loginData) return;
    this.selectionService()
      .selectedElements()
      .forEach(compilation => {
        if (isCompilation(compilation)) {
          this.removeCompilation(compilation, loginData);
        }
      });

    this.selectionService().clearSelection();
  }

  private async removeCompilation(
    compilation: ICompilation,
    loginData: { username: string; password: string },
  ) {
    const { username, password } = loginData;
    const isOwner = this.isOwner(compilation);

    if (isOwner) {
      this.#backend
        .deleteRequest(compilation._id, 'compilation', username, password)
        .then(result => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    } else {
      this.#backend
        .removeSelfFromAccess('compilation', compilation._id)
        .then(result => {
          this.#account.updateTrigger$.next(Collection.compilation);
        })
        .catch(e => console.error(e));
    }
  }

  //Selection

  public isSelected(compilation: ICompilation): boolean {
    return this.selectionService().isSelected(compilation);
  }

  public addCompilationToSelection(compilation: ICompilation, event: MouseEvent) {
    this.selectionService().updateSelection(compilation, event);
  }

  public changeSelectionOnCheckbox(compilation: ICompilation) {
    this.selectionService().updateSelection(compilation, undefined, true);
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
      this.#snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    const compElementPairs =
      this.filteredCompilationsSignal()?.results.map((element, index) => ({
        element,
        htmlElement: this.gridItems.get(index)?.nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectElementsInRect(selectionRect, compElementPairs);
  }

  ngAfterViewInit() {
    this.actionsTemplateChange.emit(this.selectionActionsTpl);
  }

  /* Helper until access-field is used */
  tryAccessField(
    data?:
      | IEntity<Record<string, unknown>, false>
      | ICompilation<false>
      | (IEntity<Record<string, unknown>, false> | ICompilation<false>)[],
  ) {
    if (!data) return;
    const items = Array.isArray(data) ? data : [data];

    const compilationsWithEmptyAccess = items.filter(
      (item): item is ICompilation<false> => item && item.access == null,
    );

    compilationsWithEmptyAccess.forEach(comp => this.makeCreatorOwnerIfAccessIsUnused(comp));
  }

  makeCreatorOwnerIfAccessIsUnused(compilation: ICompilation) {
    const creator = compilation.creator;
    if (!creator) return;

    if (!compilation.access) {
      compilation.access = {};
    }

    compilation.access![creator._id] = {
      _id: creator._id,
      fullname: creator.fullname,
      username: creator.username,
      role: EntityAccessRole.owner,
    };
  }

  /* Helper End*/
}
