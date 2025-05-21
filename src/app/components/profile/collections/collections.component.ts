import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import {
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import {
  AddCompilationWizardComponent,
} from 'src/app/wizards';
import {
  ICompilation,
  IUserData,
  isCompilation,
} from 'src/common';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { TranslatePipe as TranslatePipe_1 } from 'src/app/pipes/translate.pipe';
import { ProfilePageHelpComponent } from 'src/app/pages/profile-page/profile-page-help.component';

@Component({
  selector: 'app-components-profile-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatExpansionPanelContent,
    MatChipListbox,
    MatChipOption,
    GridElementComponent,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    RouterLink,
    MatExpansionPanelActionRow,
    MatButton,
    MatDivider,
    MatSlideToggle,
    FormsModule,
    TranslatePipe_1,
  ],
})

export class CollectionsComponent implements OnInit {
    public userData: IUserData;

    public showPartakingCompilations = false;
    private __partakingCompilations: ICompilation[] = [];

    public filter = {
        published: true,
        unpublished: false,
        restricted: false,
        unfinished: false,
      };

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
          this.updateFilter();
        });
      }

// Compilations
  get userCompilations(): ICompilation[] {
    return this.userData?.data?.compilation?.filter(comp => isCompilation(comp)) ?? [];
  }

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
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data.compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result);
          }
        }
      });
  }

  public async updateFilter(property?: string, paginator?: MatPaginator) {
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in this.filter) {
        (this.filter as any)[prop] = prop === property;
      }
    }

    if (paginator) paginator.firstPage();
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
        if (this.userData?.data?.compilation) {
          this.userData.data.compilation = (
            this.userData.data.compilation as ICompilation[]
          ).filter(comp => comp._id !== compilation._id);
        }
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