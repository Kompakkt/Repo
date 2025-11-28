import { AsyncPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { CacheManagerService } from 'src/app/services/cache-manager.service';
import { AddCompilationWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, isCompilation } from 'src/common';

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
    RouterLink,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
  ],
})
export class ProfileCompilationsComponent {
  #cache = inject(CacheManagerService);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #helper = inject(DialogHelperService);

  showPartakingCompilations = signal(false);
  showPartakingCompilations$ = toObservable(this.showPartakingCompilations);

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);

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

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.#dialog.open(AddCompilationWizardComponent, {
      data: compilation,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.#account.updateTrigger$.next(Collection.compilation);
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.#helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.#backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        this.#account.updateTrigger$.next(Collection.compilation);
      })
      .catch(e => console.error(e));
  }
}
