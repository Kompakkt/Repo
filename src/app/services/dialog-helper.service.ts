import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { firstValueFrom } from 'rxjs';
import { AuthDialogComponent } from 'src/app/components';
import {
  ConfirmationDialogComponent,
  EditEntityDialogComponent,
  PasswordProtectedDialogComponent,
  RegisterDialogComponent,
  VisibilityAndAccessDialogComponent,
} from 'src/app/dialogs';
import { ProfilePageEditComponent } from 'src/app/dialogs/profile-page-edit/profile-page-edit.component';
import { Collection, ICompilation, IEntity } from '@kompakkt/common';
import { IPublicProfile } from '@kompakkt/common/interfaces';
import { AuthDialogData } from '../components/auth-dialog/auth-dialog.component';
import { EntityDownloadDialogComponent } from '../dialogs/entity-download-dialog/entity-download-dialog.component';
import {
  ViewerDialogComponent,
  ViewerDialogData,
} from '../dialogs/viewer-dialog/viewer-dialog.component';
import { AccountService, EventsService } from './';
import { IDownloadOptions } from './backend.service';
import { CreateNewCompilationComponent } from '../dialogs/create-new-compilation/create-new-compilation.component';
import { CreateNewEntityComponent } from '../dialogs/create-new-entity/create-new-entity.component';
import {
  AddToCompilationComponent,
  AddToCompilationResult,
} from '../dialogs/add-to-compilation/add-to-compilation.component';
import {
  RemoveFromCompilationComponent,
  RemoveFromCompilationResult,
} from '../dialogs/remove-from-compilation/remove-from-compilation.component';

@Injectable({
  providedIn: 'root',
})
export class DialogHelperService {
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #events = inject(EventsService);

  public openPasswordProtectedDialog() {
    return this.#dialog.open(PasswordProtectedDialogComponent, {
      disableClose: true,
    });
  }

  public openLoginDialog() {
    const ref = this.#dialog.open(AuthDialogComponent);

    firstValueFrom(ref.afterClosed()).then(() => {
      this.#events.updateSearchEvent();
    });

    return ref;
  }

  public openRegisterDialog() {
    return this.#dialog.open(RegisterDialogComponent);
  }

  public openViewerDialog(data: ViewerDialogData) {
    return this.#dialog.open<ViewerDialogComponent, ViewerDialogData>(ViewerDialogComponent, {
      data,
      id: 'viewer-dialog',
    });
  }

  public removeFromCompilation(data: ICompilation) {
    const ref = this.#dialog.open<
      RemoveFromCompilationComponent,
      ICompilation,
      RemoveFromCompilationResult
    >(RemoveFromCompilationComponent, {
      data,
      disableClose: true,
    });
    firstValueFrom(ref.afterClosed()).then(() => {
      this.#account.updateTrigger$.next(Collection.compilation);
      this.#events.updateSearchEvent();
    });
    return ref;
  }

  public addToCompilation(data?: IEntity[]) {
    const ref = this.#dialog.open<AddToCompilationComponent, IEntity[], AddToCompilationResult>(
      AddToCompilationComponent,
      { data, disableClose: true },
    );
    firstValueFrom(ref.afterClosed()).then(() => {
      this.#account.updateTrigger$.next(Collection.compilation);
      this.#events.updateSearchEvent();
    });
    return ref;
  }

  public editSettingsInViewer(element: IEntity | undefined) {
    if (!element) return;
    return this.#dialog.open(EditEntityDialogComponent, {
      data: element,
      id: 'explore-entity-dialog',
      disableClose: true,
    });
  }

  public editEntity(element?: IEntity) {
    const ref = this.#dialog.open(CreateNewEntityComponent, {
      data: element,
      disableClose: !!element,
    });
    firstValueFrom(ref.afterClosed()).then(() => {
      this.#account.updateTrigger$.next(Collection.entity);
      this.#events.updateSearchEvent();
    });

    return ref;
  }

  public editVisibilityAndAccess(element: IEntity) {
    const ref = this.#dialog.open(VisibilityAndAccessDialogComponent, {
      data: element,
      disableClose: true,
    });

    return ref;
  }

  public editProfile(profile?: Partial<IPublicProfile>) {
    const ref = this.#dialog.open<
      ProfilePageEditComponent,
      Partial<IPublicProfile> | undefined,
      IPublicProfile
    >(ProfilePageEditComponent, {
      width: '800px',
      data: profile,
    });

    firstValueFrom(ref.afterClosed()).then(updatedProfile => {
      if (!updatedProfile) return;
      this.#account.updateTrigger$.next('profile');
    });

    return ref;
  }

  public async openEntityDownloadDialog(entity: IEntity, downloadOptions: IDownloadOptions) {
    const ref = this.#dialog.open(EntityDownloadDialogComponent, {
      data: {
        entity,
        downloadOptions,
      },
    });

    return ref;
  }

  public async confirm(data: string) {
    const confirmDialog = this.#dialog.open<ConfirmationDialogComponent, string, void | boolean>(
      ConfirmationDialogComponent,
      { data },
    );

    const result = await firstValueFrom(confirmDialog.afterClosed());
    const confirmed = !!result;
    return confirmed;
  }

  public async verifyAuthentication(text: string) {
    const user = await this.#account.getUserDataSnapshot();
    const loginDialog = this.#dialog.open<
      AuthDialogComponent,
      AuthDialogData,
      { username: string; password: string }
    >(AuthDialogComponent, {
      data: { concern: text, username: user?.username },
      disableClose: true,
    });

    const result = await firstValueFrom(loginDialog.afterClosed());
    return result;
  }

  public async confirmWithAuth(confirmText: string, authText: string) {
    // Get confirmation
    const confirmed = await this.confirm(confirmText);
    if (!confirmed) return undefined;

    // Get and cache login data
    const loginData = await this.verifyAuthentication(authText);
    return loginData;
  }
}
