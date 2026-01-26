import { AsyncPipe, CommonModule, KeyValuePipe } from '@angular/common';
import { Component, inject, Pipe, PipeTransform, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, combineLatest, first, firstValueFrom, map, Observable } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TranslatePipe } from 'src/app/pipes';
import { FilterArrayByStringPipe } from 'src/app/pipes/filter-array-by-string.pipe';
import { ObservableValuePipe } from 'src/app/pipes/observable-value';
import { AccountService } from 'src/app/services';
import { ICompilation, IEntity } from 'src/common';
import {
  CreateNewCollectionComponent,
  CreateNewCollectionResult,
} from '../create-new-collection/create-new-collection.component';
import { toObservable } from '@angular/core/rxjs-interop';

@Pipe({ name: 'isAnyEntityInCollection' })
class IsAnyEntityInCollectionPipe implements PipeTransform {
  transform(
    value: ICompilation,
    entities: IEntity[],
  ):
    | {
        value: 'all' | 'some' | 'none';
        type: 'array';
        disabled: boolean;
        icon: string;
      }
    | {
        value: boolean;
        type: 'single';
        disabled: boolean;
        icon: string;
      } {
    const length = entities.length;
    if (length > 1) {
      const all = entities.every(e => Object.hasOwn(value.entities, e._id));
      const some = entities.some(e => Object.hasOwn(value.entities, e._id));
      return {
        value: all ? 'all' : some ? 'some' : 'none',
        type: 'array',
        disabled: all,
        icon: all ? 'library_add_check' : some ? 'indeterminate_check_box' : 'library_add',
      };
    } else {
      const firstEntity = entities.at(0);
      if (!firstEntity) {
        return {
          value: false,
          type: 'single',
          disabled: true,
          icon: 'library_add_check',
        };
      }
      const isInCollection = Object.hasOwn(value.entities, firstEntity._id);
      return {
        value: isInCollection,
        type: 'single',
        disabled: isInCollection,
        icon: isInCollection ? 'library_add_check' : 'library_add',
      };
    }
  }
}

@Component({
  selector: 'app-add-to-collection',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OutlinedInputComponent,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressBarModule,
    AsyncPipe,
    ObservableValuePipe,
    KeyValuePipe,
    FilterArrayByStringPipe,
    IsAnyEntityInCollectionPipe,
  ],
  templateUrl: './add-to-collection.component.html',
  styleUrl: './add-to-collection.component.scss',
})
export class AddToCollectionComponent {
  dialogData = inject<IEntity[]>(MAT_DIALOG_DATA);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);

  selectedCollections = signal(new Set<string>());
  #selectedCollections$ = toObservable(this.selectedCollections);

  filterText = signal('');

  createdCollection$ = new BehaviorSubject<ICompilation | null>(null);
  userCollections$: Observable<Array<ICompilation & { isSelected?: boolean }>> = combineLatest([
    this.#account.compilations$,
    this.createdCollection$,
    this.#selectedCollections$,
  ]).pipe(
    map(([collections, newCollection, selectedCollections]) => {
      const result = newCollection ? [...collections, newCollection] : collections;
      return result.map(collection => ({
        ...collection,
        isSelected: selectedCollections.has(collection._id),
      }));
    }),
  );

  toggleSelection(collection: ICompilation) {
    this.selectedCollections.update(selected => {
      const clone = new Set(selected);
      const isSelected = clone.has(collection._id);
      if (isSelected) {
        clone.delete(collection._id);
      } else {
        clone.add(collection._id);
      }
      return clone;
    });
  }

  async createNewCollection() {
    const hasCreatedCollection = await firstValueFrom(this.createdCollection$);
    if (hasCreatedCollection) return;

    const compilationData = await firstValueFrom(
      this.#dialog
        .open<
          CreateNewCollectionComponent,
          void,
          CreateNewCollectionResult
        >(CreateNewCollectionComponent)
        .afterClosed(),
    );
    if (!compilationData) return;
    // TODO: Create new compilation
  }
}
