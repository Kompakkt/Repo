import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogClose } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { BackendService, AccountService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData, isEntity } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BehaviorSubject, catchError, combineLatestWith, filter, from, map, of, startWith, switchMap, tap } from 'rxjs';

@Component({
  selector: 'visibility-and-access-dialog',
  templateUrl: './visibility-and-access-dialog.component.html',
  styleUrls: ['./visibility-and-access-dialog.component.scss'],
  standalone: true,
  imports: [
    MatSlideToggle,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatIconButton,
    MatIcon,
    MatButton,
    TranslatePipe,
    MatDividerModule,
    MatSelect,
    CommonModule,
    MatDialogClose,
  ],
}) 

export class VisibilityAndAccessDialogComponent implements OnInit {
  
private data = inject<IEntity | undefined>(MAT_DIALOG_DATA);
private backend = inject(BackendService);
private account = inject(AccountService);
private helper = inject(DialogHelperService);
public isEntity = isEntity;
public isSubmitting = false;
public published = this.element.online; 

public searchControl = new FormControl('');
public ownersForm = new FormGroup({});
public options = [{ value: 'owner', label: 'Owner' }, { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'View only' }];
public ownerRole = 'Owner';
public entity$ = new BehaviorSubject<IEntity | undefined>(undefined);
private entityOwnerChanges$ = new BehaviorSubject<
    {
      action: 'add' | 'remove';
      user: IStrippedUserData;
    }[]
  >([]);

public entityOwners$ = this.entity$.pipe(
    filter((obj): obj is IEntity => !!obj?._id),
    switchMap(({ _id }) => this.backend.findEntityOwners(_id.toString())),
    catchError(err => {
      console.error('Failed fetching entity owners', err);
      return of<IStrippedUserData[]>([]);
    }),
    tap(owners => console.log(owners)),

    combineLatestWith(this.entityOwnerChanges$),
    map(([owners, changes]) => {
      changes.forEach(({ action, user }) => {
        if (action === 'add') owners.push(user);
        else owners = owners.filter(_u => _u._id !== user._id);
      });
      return owners;
    }),
  );

public strippedUser$ = this.account.strippedUser$;
public accessPersons$ = new BehaviorSubject<{
  [id: string]: IStrippedUserData & { role: "owner" | "editor" | "viewer" };
} | undefined>(this.element.access);
public accessPersonsArray$ = this.accessPersons$.pipe(
  map(data => {
    if (data) {
      return Object.values(data);
    }
    return [];
  })
);

public allAccounts$ = from(this.backend.getAccounts()).pipe(
    catchError(err => {
      console.error('Failed fetching accounts', err);
      return of<IStrippedUserData[]>([]);
    }),
  );
  public filteredAccounts$ = this.allAccounts$.pipe(
    combineLatestWith(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => value?.toLowerCase().trim() ?? ''),
      ),
      this.entityOwners$,
    ),
    map(([accounts, search, currentOwners]) =>
      accounts
        .filter(account => !currentOwners.some(owner => owner._id === account._id))
        .filter(account => Object.values(account).join('').toLowerCase().includes(search)),
    ),
  );

  constructor(
    private dialogRef: MatDialogRef<VisibilityAndAccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public element: IEntity,
  ){
  }

  public async togglePublished(checked: boolean) { 
    if (!this.element || !isEntity(this.element)) return;
    this.published = checked; 
    console.log(this.published);
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    const newUser = event.option.value;
    newUser.role = "viewer";
    const currentAccess = this.accessPersons$.getValue();
    const updatedUser = {...currentAccess, [newUser._id]: newUser };
    this.accessPersons$.next(updatedUser);
  } 

  public updateUserRole(role: MatSelectChange, id: string) {
    const currentAccess = this.accessPersons$.getValue();
    console.log(role);
    const newRole = role.value;
    if (currentAccess && currentAccess[id]) {
      const updatedUser = {...currentAccess, [id]: {...currentAccess[id], role: newRole}};
      this.accessPersons$.next(updatedUser);
    }
  }

  public async removeUser(user: IStrippedUserData) {
    const userElement = this.accessPersons$.getValue();
    if (!userElement) return;
    delete userElement[user._id];
    this.accessPersons$.next(userElement);
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  public async save() {
    if (this.element) {
    const loginData = await this.helper.verifyAuthentication(
      'Validate login before saving',
    );
    if (!loginData) return;

      const access = this.accessPersons$.getValue();
      console.log(this.element);
      this.element.access = access;
      this.element.online = this.published; 
      this.dialogRef.disableClose = true;
      this.isSubmitting = true;
      this.backend
        .pushEntity(this.element)
        .then(result => {
          this.dialogRef.close(this.element);
        })
        .catch(e => {
          console.error(e);
        });
    }
  }


ngOnInit() {
  if (this.data) {
    this.entity$.next(this.data);
    this.accessPersons$.next(this.data.access);
  }

  this.accessPersonsArray$.subscribe(data => {
    const formControl ={};
    data.forEach(person => {
      formControl[person._id] = new FormControl(person.role);
    });
    this.ownersForm = new FormGroup(formControl);
  });
  }
}