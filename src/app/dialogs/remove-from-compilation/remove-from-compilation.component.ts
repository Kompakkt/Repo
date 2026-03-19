import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { from, of, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { TranslatePipe } from 'src/app/pipes';
import { BackendService, DialogHelperService, SnackbarService } from 'src/app/services';
import { SelectionService } from 'src/app/services/selection.service';
import { ICompilation, IEntity, isEntity } from '@kompakkt/common';

export type RemoveFromCompilationResult = {
  hasSavedChanges: boolean;
  removedEntityIds: string[];
};

@Component({
  selector: 'app-remove-from-compilation',
  imports: [
    GridElementComponent,
    SelectionContainerComponent,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    TranslatePipe,
  ],
  templateUrl: './remove-from-compilation.component.html',
  styleUrl: './remove-from-compilation.component.scss',
})
export class RemoveFromCompilationComponent implements AfterViewInit {
  #dialog = inject(MatDialog);
  #helper = inject(DialogHelperService);
  #dialogRef =
    inject<MatDialogRef<RemoveFromCompilationComponent, RemoveFromCompilationResult>>(MatDialogRef);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);

  data = inject<ICompilation | undefined>(MAT_DIALOG_DATA);
  entities = computed(() => {
    const compilation = this.data;
    if (!compilation) return [];
    return Object.values(compilation.entities).filter(isEntity);
  });

  selectedEntities = signal<Set<string>>(new Set());

  ngAfterViewInit(): void {
    if (!this.data) {
      this.#snackbar.showMessage('Compilation not found', 5);
      this.#dialogRef.close();
    }
  }

  toggleSelection(entity: IEntity) {
    this.selectedEntities.update(current => {
      const newSet = new Set(current);
      if (newSet.has(entity._id)) newSet.delete(entity._id);
      else newSet.add(entity._id);
      return newSet;
    });
  }

  isSelected(entity: IEntity) {
    return this.selectedEntities().has(entity._id);
  }

  async save() {
    const selectedEntities = this.selectedEntities();
    console.log('Selected entities to remove', selectedEntities);

    const compilation = this.data!;
    const isEmptyAfterRemoval = Object.keys(compilation.entities).length === selectedEntities.size;

    if (isEmptyAfterRemoval) {
      const confirmed = await this.#helper.confirm(
        'Deleting all entities will remove the collection. Do you want to proceed?',
      );
      if (!confirmed) return;
    }

    const result = await this.#backend
      .removeFromCompilation({
        compilationId: compilation._id,
        entityIds: Array.from(selectedEntities),
      })
      .catch(err => {
        console.error('Failed to remove entities from compilation', err);
        this.#snackbar.showMessage('Failed to remove entities from compilation', 5);
      });

    if (result) {
      this.#dialogRef.close({
        hasSavedChanges: true,
        removedEntityIds: Array.from(selectedEntities),
      });
    }
  }
}
