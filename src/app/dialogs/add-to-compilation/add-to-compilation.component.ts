import { KeyValuePipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { FilterArrayByStringPipe } from 'src/app/pipes/filter-array-by-string.pipe';
import { ICompilation, IEntity, isCompilation } from '@kompakkt/common';
import { IsAnyEntityInCompilationPipe } from './is-any-entity-in-compilation.pipe';
import { PluralizePipe } from 'src/app/pipes/pluralize.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountService } from 'src/app/services/account.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';
import { BackendService } from 'src/app/services/backend.service';

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
    OutlinedInputComponent,
    NgxFluentPipe,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
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
  filterText = signal('');

  createdCompilation = signal<ICompilation | null>(null);
  userCompilations = computed(() => {
    const compilations = this.#account.compilations().filter(c => isCompilation(c));
    const newCompilation = this.createdCompilation();
    const selectedCompilations = this.selectedCompilations();
    const result = newCompilation
      ? [
          ...compilations.filter(compilation => compilation._id !== newCompilation._id),
          newCompilation,
        ]
      : compilations;
    return result.map(compilation => ({
      ...compilation,
      isSelected: selectedCompilations.has(compilation._id),
      isNew: compilation._id === newCompilation?._id,
    }));
  });

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
    const hasCreatedCompilation = this.createdCompilation();
    if (hasCreatedCompilation) return;

    const compilationData = await firstValueFrom(
      this.#helper.createOrEditCompilation().afterClosed(),
    );
    if (!compilationData) return;

    this.createdCompilation.set(compilationData);
    this.selectedCompilations.update(selected => new Set(selected).add(compilationData._id));
  }

  #aggregateChangeLog() {
    const compilations = this.userCompilations();
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
    const selectedCompilations = this.selectedCompilations();
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

    const changelog = this.#aggregateChangeLog();

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
