import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TranslatePipe } from 'src/app/pipes';
import { FilterArrayByStringPipe } from 'src/app/pipes/filter-array-by-string.pipe';
import { ObservableValuePipe } from 'src/app/pipes/observable-value';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { ICompilation, IEntity } from '@kompakkt/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { IsAnyEntityInCompilationPipe } from './is-any-entity-in-compilation.pipe';
import { PluralizePipe } from 'src/app/pipes/pluralize.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

export type AddToCompilationResult = {
  hasSavedChanges: boolean;
  compilationIds: string[];
};

type CompilationChangeLogEntry = {
  compilationName: string;
  count: number;
  changesMade: boolean;
  isNew: boolean;
};

@Component({
  selector: 'app-add-to-compilation',
  imports: [
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
    MatTooltipModule,
    AsyncPipe,
    ObservableValuePipe,
    KeyValuePipe,
    FilterArrayByStringPipe,
    IsAnyEntityInCompilationPipe,
    PluralizePipe,
  ],
  templateUrl: './add-to-compilation.component.html',
  styleUrl: './add-to-compilation.component.scss',
})
export class AddToCompilationComponent {
  dialogData = inject<IEntity[]>(MAT_DIALOG_DATA);
  #account = inject(AccountService);
  #helper = inject(DialogHelperService);
  #backend = inject(BackendService);
  result = signal<AddToCompilationResult | undefined>(undefined);
  changelog = signal<CompilationChangeLogEntry[]>([]);
  isSaving = signal(false);

  selectedCompilations = signal(new Set<string>());
  #selectedCompilations$ = toObservable(this.selectedCompilations);

  filterText = signal('');

  createdCompilation$ = new BehaviorSubject<ICompilation | null>(null);
  userCompilations$: Observable<Array<ICompilation & { isSelected?: boolean; isNew?: boolean }>> =
    combineLatest([
      this.#account.compilations$,
      this.createdCompilation$,
      this.#selectedCompilations$,
    ]).pipe(
      map(([compilations, newCompilation, selectedCompilations]) => {
        const result = newCompilation ? [...compilations, newCompilation] : compilations;
        return result.map(compilation => ({
          ...compilation,
          isSelected: selectedCompilations.has(compilation._id),
          isNew: compilation._id === newCompilation?._id,
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
      this.#helper.createOrEditCompilation().afterClosed(),
    );
    if (!compilationData) return;

    this.createdCompilation$.next(compilationData);
    this.selectedCompilations.update(selected => new Set(selected).add(compilationData._id));
  }

  async #aggregateChangeLog() {
    const compilations = await firstValueFrom(this.userCompilations$);
    const selectedCompilations = compilations.filter(c => c.isSelected);

    const entityIds = this.dialogData.map(e => e._id);

    const changelog = new Array<CompilationChangeLogEntry>();

    // Count how many entities are being added to each compilation
    for (const compilation of selectedCompilations) {
      const missing = Object.keys(compilation.entities).filter(entityId =>
        entityIds.includes(entityId),
      );
      const count = compilation.isNew ? entityIds.length : missing.length;
      changelog.push({
        compilationName: compilation.name,
        count,
        changesMade: compilation.isNew ? true : missing.length > 0,
        isNew: !!compilation.isNew,
      });
    }

    return changelog;
  }

  async save() {
    this.isSaving.set(true);
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

    const changelog = await this.#aggregateChangeLog();

    this.isSaving.set(false);
    if (!result) {
      // TODO: Show error message
      return;
    }

    this.changelog.set(changelog);

    this.result.set({
      hasSavedChanges: true,
      compilationIds,
    });
  }
}
