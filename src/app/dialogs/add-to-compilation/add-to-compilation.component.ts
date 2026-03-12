import { AsyncPipe, CommonModule, KeyValuePipe } from '@angular/common';
import { Component, inject, Pipe, PipeTransform, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, combineLatest, first, firstValueFrom, map, Observable } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TranslatePipe } from 'src/app/pipes';
import { FilterArrayByStringPipe } from 'src/app/pipes/filter-array-by-string.pipe';
import { ObservableValuePipe } from 'src/app/pipes/observable-value';
import { AccountService, BackendService } from 'src/app/services';
import { ICompilation, IEntity } from 'src/common';
import { CreateNewCompilationComponent } from '../create-new-compilation/create-new-compilation.component';
import { toObservable } from '@angular/core/rxjs-interop';

export type AddToCompilationResult = {
  hasSavedChanges: boolean;
  compilationIds: string[];
};

@Pipe({ name: 'isAnyEntityInCompilation' })
class IsAnyEntityInCompilationPipe implements PipeTransform {
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
      const isInCompilation = Object.hasOwn(value.entities, firstEntity._id);
      return {
        value: isInCompilation,
        type: 'single',
        disabled: isInCompilation,
        icon: isInCompilation ? 'library_add_check' : 'library_add',
      };
    }
  }
}

@Component({
  selector: 'app-add-to-compilation',
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
    IsAnyEntityInCompilationPipe,
  ],
  templateUrl: './add-to-compilation.component.html',
  styleUrl: './add-to-compilation.component.scss',
})
export class AddToCompilationComponent {
  dialogData = inject<IEntity[]>(MAT_DIALOG_DATA);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #dialogRef =
    inject<MatDialogRef<AddToCompilationComponent, AddToCompilationResult>>(MatDialogRef);
  #backend = inject(BackendService);

  selectedCompilations = signal(new Set<string>());
  #selectedCompilations$ = toObservable(this.selectedCompilations);

  filterText = signal('');

  createdCompilation$ = new BehaviorSubject<ICompilation | null>(null);
  userCompilations$: Observable<Array<ICompilation & { isSelected?: boolean }>> = combineLatest([
    this.#account.compilations$,
    this.createdCompilation$,
    this.#selectedCompilations$,
  ]).pipe(
    map(([compilations, newCompilation, selectedCompilations]) => {
      const result = newCompilation ? [...compilations, newCompilation] : compilations;
      return result.map(compilation => ({
        ...compilation,
        isSelected: selectedCompilations.has(compilation._id),
      }));
    }),
  );

  toggleSelection(compilation: ICompilation) {
    this.selectedCompilations.update(selected => {
      const clone = new Set(selected);
      const isSelected = clone.has(compilation._id);
      if (isSelected) {
        clone.delete(compilation._id);
      } else {
        clone.add(compilation._id);
      }
      return clone;
    });
  }

  async createNewCompilation() {
    const hasCreatedCompilation = await firstValueFrom(this.createdCompilation$);
    if (hasCreatedCompilation) return;

    const compilationData = await firstValueFrom(
      this.#dialog
        .open<CreateNewCompilationComponent, void, ICompilation>(CreateNewCompilationComponent)
        .afterClosed(),
    );
    if (!compilationData) return;

    this.createdCompilation$.next(compilationData);
    this.selectedCompilations.update(selected => new Set(selected).add(compilationData._id));
  }

  async save() {
    const selectedCompilations = await firstValueFrom(this.#selectedCompilations$);
    const compilationIds = Array.from(selectedCompilations);
    const entityIds = this.dialogData.map(e => e._id);

    const result = await this.#backend
      .addToCompilations({
        compilationIds,
        entityIds,
      })
      .catch(err => {
        console.error('Failed to add entities to compilations', err);
        return;
      });

    if (!result) {
      return;
    }

    this.#dialogRef.close({
      hasSavedChanges: true,
      compilationIds,
    });
  }
}
