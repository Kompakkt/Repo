import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { ProfilePageHelpComponent } from 'src/app/pages/profile-page/profile-page-help.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { AddCompilationWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, isCompilation } from 'src/common';
import { IUserDataWithoutData } from 'src/common/interfaces';

@Component({
  selector: 'app-components-profile-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  standalone: true,
  imports: [
    MatExpansionModule,
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
export class CollectionsComponent implements OnInit {
  public userData: IUserDataWithoutData;

  public showPartakingCompilations = false;
  private __partakingCompilations: ICompilation[] = [];

  constructor(
    private translatePipe: TranslatePipe,
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private helper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.userData = this.route.snapshot.data.userData;

    this.account.user$.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;
      this.backend
        .findUserInCompilations()
        .then(compilations => (this.__partakingCompilations = compilations))
        .catch(e => console.error(e));
    });
  }

  userCompilations$ = this.account.compilations$.pipe(
    map(compilations => compilations.filter(isCompilation)),
  );

  get partakingCompilations(): ICompilation[] {
    return this.__partakingCompilations;
  }

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.account.updateTrigger$.next(Collection.compilation);
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        this.account.updateTrigger$.next(Collection.compilation);
      })
      .catch(e => console.error(e));
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Profile');
  }
}
