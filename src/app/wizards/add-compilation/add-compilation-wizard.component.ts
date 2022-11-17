import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatStepper, MatStep } from '@angular/material/stepper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { BackendService, AccountService } from 'src/app/services';
import { SortOrder } from 'src/app/services/backend.service';
import {
  isEntity,
  isCompilation,
  ObjectId,
  ICompilation,
  IEntity,
  IGroup,
  IStrippedUserData,
  IAnnotation,
  IDocument,
} from 'src/common';
import { FormControl, Validators } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  debounceTime,
  filter,
  firstValueFrom,
  from,
  map,
  OperatorFunction,
  pipe,
  startWith,
  throttle,
  throttleTime,
} from 'rxjs';

const sortEntitiesByName = (a: IEntity, b: IEntity) => a.name.localeCompare(b.name);

const idMatch = (a?: IDocument) => (b?: IDocument) => a?._id === b?._id;
const noIdMatch = (a?: IDocument) => (b?: IDocument) => a?._id !== b?._id;

const searchPerson = (search: string) => (user: IStrippedUserData) =>
  user.fullname.toLowerCase().includes(search) || user.username.toLowerCase().includes(search);

const searchGroup = (search: string) => (group: IGroup) =>
  group.name.toLowerCase().includes(search);

@Component({
  selector: 'app-add-compilation-wizard',
  templateUrl: './add-compilation-wizard.component.html',
  styleUrls: ['./add-compilation-wizard.component.scss'],
})
export class AddCompilationWizardComponent implements OnInit {
  public name = new FormControl('', {
    validators: [Validators.required, Validators.minLength(1)],
    nonNullable: true,
  });
  public description = new FormControl('', {
    validators: [Validators.required, Validators.minLength(1)],
    nonNullable: true,
  });
  public password = new FormControl('', { nonNullable: true });

  public whitelistEnabled = false;

  public whitelistedPersons$ = new BehaviorSubject<IStrippedUserData[]>([]);
  public whitelistedGroups$ = new BehaviorSubject<IGroup[]>([]);

  public accessMode$ = new BehaviorSubject<'solo' | 'everyone' | 'limited'>('solo');
  public limitedAccess$ = combineLatest([this.whitelistedPersons$, this.whitelistedGroups$]).pipe(
    map(([persons, groups]) => persons.length + groups.length),
  );

  public allEntities$ = new BehaviorSubject<IEntity[]>([]);
  public selectedEntities$ = new BehaviorSubject<IEntity[]>([]);
  public undoHistory$ = new BehaviorSubject<IEntity[]>([]);

  public availableEntities$ = combineLatest([this.selectedEntities$, this.allEntities$]).pipe(
    map(([selected, all]) =>
      selected.length > 0 ? all.filter(a => a && selected.find(noIdMatch(a))) : all,
    ),
    map(entities => entities.sort(sortEntitiesByName)),
  );

  public searchText = new FormControl('', { nonNullable: true });
  public searchText$ = this.searchText.valueChanges.pipe(startWith(''), debounceTime(250));

  public searchPersonCtrl = new FormControl('', { nonNullable: true });
  public searchGroupCtrl = new FormControl('', { nonNullable: true });

  public allPersons$ = from(this.backend.getAccounts());
  public allGroups$ = from(this.backend.getGroups());
  public strippedUser$ = this.account.strippedUser$;

  public filteredPersons$ = this.searchPersonCtrl.valueChanges.pipe(
    // Prepare search string
    startWith(''),
    filter(search => typeof search === 'string'),
    map(search => search.toLowerCase()),
    // Filter by name
    combineLatestWith(this.allPersons$),
    map(([search, persons]) => persons.filter(searchPerson(search))),
    // Remove already whitelisted
    combineLatestWith(this.whitelistedPersons$),
    map(([persons, whitelisted]) => persons.filter(a => !whitelisted.find(idMatch(a)))),
    // Sort
    map(persons => persons.sort((a, b) => a.fullname.localeCompare(b.fullname))),
  );

  public filteredGroups$ = this.searchGroupCtrl.valueChanges.pipe(
    // Prepare search string
    startWith(''),
    filter(search => typeof search === 'string'),
    map(search => search.toLowerCase()),
    // Filter by name
    combineLatestWith(this.allGroups$),
    map(([search, groups]) => groups.filter(searchGroup(search))),
    // Remove already whitelisted
    combineLatestWith(this.whitelistedGroups$),
    map(([groups, whitelisted]) => groups.filter(a => !whitelisted.find(idMatch(a)))),
    // Sort
    map(groups => groups.sort((a, b) => a.name.localeCompare(b.name))),
  );

  public persons$ = this.allPersons$.pipe(
    combineLatestWith(this.strippedUser$, this.whitelistedPersons$),
    map(([persons, user, whitelisted]) =>
      persons.filter(a => whitelisted.find(noIdMatch(a)) && noIdMatch(a)(user)),
    ),
  );
  public groups$ = this.allGroups$.pipe(
    combineLatestWith(this.whitelistedGroups$),
    map(([groups, whitelisted]) => groups.filter(a => whitelisted.find(noIdMatch(a)))),
  );

  public isSubmitting = false;
  public isSubmitted = false;

  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 20;
  public paginatorPageIndex = 0;
  public searchOffset$ = new BehaviorSubject(0);

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public isLoading = false;

  constructor(
    private backend: BackendService,
    private account: AccountService,
    // When opened as a dialog
    @Optional() public dialogRef: MatDialogRef<AddCompilationWizardComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private dialogData: ICompilation | string | undefined,
  ) {
    this.account.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) this.dialogRef.close('User is not authenticated');
    });

    combineLatest([this.searchText$, this.searchOffset$]).subscribe(([searchText, offset]) =>
      this.backend
        .explore({
          searchEntity: true,
          filters: { annotatable: false, annotated: false, restricted: false, associated: false },
          types: ['model', 'image', 'audio', 'video'],
          offset,
          searchText,
          reversed: false,
          sortBy: SortOrder.popularity,
        })
        .then(result => {
          if (!Array.isArray(result.array)) return;
          this.allEntities$.next(result.array as IEntity[]);
          if (result.array.length < 20) {
            this.paginatorLength = offset + result.array.length;
          }
        })
        .catch(e => console.error(e)),
    );

    this.accessMode$.subscribe(mode => {
      this.whitelistEnabled = mode !== 'solo';
    });
  }

  private async handleExistingData(data: string | IEntity | ICompilation) {
    // Creating a new collection with an entity
    if (typeof data === 'string' && ObjectId.isValid(data)) {
      // When creating a new compilation with an entity (e.g. on the explore page)
      // we can already add the entity here
      const entity = await this.backend.getEntity(data);
      if (entity) this.selectEntity(entity);
      return;
    }

    if (isEntity(data)) {
      return this.selectEntity(data);
    }

    if (isCompilation(data)) {
      if (data.password === true) {
        this.isLoading = true;
        const compilation = await this.backend.getCompilation(data._id);
        if (!compilation || !isCompilation(compilation)) return;
        data = compilation;
        this.isLoading = false;
      }

      this.name.patchValue(data.name);
      this.description.patchValue(data.description);
      if (typeof data.password === 'string') this.password.patchValue(data.password);
      const { enabled, persons, groups } = data.whitelist;
      const mode = enabled ? (persons.length + groups.length > 0 ? 'limited' : 'everyone') : 'solo';
      this.whitelistEnabled = enabled;
      this.whitelistedPersons$.next(persons);
      this.whitelistedGroups$.next(groups);
      this.accessMode$.next(mode);

      const entities = Object.values(data.entities).filter(e => isEntity(e)) as IEntity[];
      this.selectedEntities$.next(entities);
    }
  }

  ngOnInit() {
    // this.search('', 0);
    if (!this.dialogRef || !this.dialogData) return;
    this.handleExistingData(this.dialogData);
  }

  public changePage(event: PageEvent) {
    console.log(event);
    this.searchOffset$.next(event.pageIndex * this.paginatorPageSize);
    this.paginatorPageIndex = event.pageIndex;
  }

  public drop(event: CdkDragDrop<IEntity[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  public selectEntity(entity: IEntity, event?: MouseEvent) {
    // Escape early if we clicked on one of the icons of app-grid-element
    const el = event?.target as HTMLElement | undefined;
    if (el?.nodeName === 'MAT-ICON') return;
    this.allEntities$.next(this.allEntities$.getValue().filter(noIdMatch(entity)));
    this.selectedEntities$.next([entity, ...this.selectedEntities$.getValue()]);
    this.undoHistory$.next(this.undoHistory$.getValue().filter(noIdMatch(entity)));
  }

  public deselectEntity(entity: IEntity, event?: MouseEvent) {
    // Escape early if we clicked on one of the icons of app-grid-element
    const el = event?.target as HTMLElement | undefined;
    if (el?.nodeName === 'MAT-ICON') return;
    this.allEntities$.next(this.allEntities$.getValue().concat(entity));
    this.selectedEntities$.next(this.selectedEntities$.getValue().filter(noIdMatch(entity)));
    this.undoHistory$.next(this.undoHistory$.getValue().concat(entity));
  }

  public undo() {
    const history = this.undoHistory$.getValue();
    const entity = history.pop();
    if (!entity) return;
    this.undoHistory$.next(history);
    this.selectEntity(entity);
  }

  public selectAutocompletePerson(event: MatAutocompleteSelectedEvent) {
    const person = event.option.value as IStrippedUserData;
    this.searchPersonCtrl.patchValue('');
    this.whitelistedPersons$.next(this.whitelistedPersons$.getValue().concat(person));
  }

  public selectAutocompleteGroup(event: MatAutocompleteSelectedEvent) {
    const group = event.option.value as IGroup;
    this.searchGroupCtrl.patchValue('');
    this.whitelistedGroups$.next(this.whitelistedGroups$.getValue().concat(group));
  }

  public removePerson(person: IStrippedUserData) {
    const value = this.whitelistedPersons$.getValue();
    this.whitelistedPersons$.next(value.filter(noIdMatch(person)));
  }

  public removeGroup(group: IGroup) {
    const value = this.whitelistedGroups$.getValue();
    this.whitelistedGroups$.next(value.filter(noIdMatch(group)));
  }

  get namingValid() {
    return this.name.valid && this.description.valid;
  }

  get entitiesValid$() {
    return this.selectedEntities$.pipe(map(entities => entities.length > 0));
  }

  public tryFinish = async (stepper: MatStepper, finishStep: MatStep) => {
    this.isSubmitting = true;

    const existing = isCompilation(this.dialogData) ? this.dialogData : undefined;

    const mode = this.accessMode$.getValue();
    const compilation: ICompilation = {
      _id: existing?._id ?? '',
      name: this.name.value,
      description: this.description.value,
      password: this.password.value,
      entities: {},
      annotations: existing?.annotations ?? {},
      creator: existing?.creator ?? (await firstValueFrom(this.strippedUser$)),
      whitelist: {
        enabled: this.whitelistEnabled,
        persons: mode === 'limited' ? this.whitelistedPersons$.getValue() : [],
        groups: mode === 'limited' ? this.whitelistedGroups$.getValue() : [],
      },
    };

    // Patch from compEntities array to the entities object
    const selectedEntities = await firstValueFrom(this.selectedEntities$);
    for (const entity of selectedEntities) compilation.entities[entity._id.toString()] = entity;

    this.backend
      .pushCompilation(compilation)
      .then(result => {
        this.isSubmitting = false;
        this.isSubmitted = true;

        finishStep.completed = true;
        stepper.next();
        // Prevent user from going back
        stepper._steps.forEach(step => (step.editable = false));

        if (this.dialogRef) {
          this.dialogRef.close(result);
        }
      })
      .catch(e => {
        // TODO: inform user of failure
        this.isSubmitted = false;
        this.isSubmitting = false;
        console.error(e);
      });
  };

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }
}
