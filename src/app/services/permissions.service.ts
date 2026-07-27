import { inject, Injectable } from '@angular/core';
import { EntityAccessRole, ICompilation, IEntity } from '@kompakkt/common';
import { AccountService } from './account.service';
import { SelectionService } from './selection.service';
import { toSignal } from '@angular/core/rxjs-interop';

type AccessTarget = IEntity | ICompilation;

export enum Permission {
  EditMetaData = 'editMetadata',
  EditAnnotation = 'editAnnotation',
  EditVisibilityAndAccess = 'editVisibilityAndAccess',
  ViewVisibilityAndAccess = 'viewVisibilityAndAccess',
  TransferOwnership = 'transferOwnership',
  DeleteCompletely = 'deleteCompletely',
  ViewWhenUnpublished = 'viewWhenUnpublished',

  EditEntitySettings = 'editEntitySettings',
  EditCompilationObjects = 'editCollection',
}

export const Permissions: Record<Permission, EntityAccessRole[]> = {
  [Permission.EditMetaData]: [EntityAccessRole.owner, EntityAccessRole.editor],
  [Permission.EditAnnotation]: [EntityAccessRole.owner, EntityAccessRole.editor],
  [Permission.EditVisibilityAndAccess]: [EntityAccessRole.owner],
  [Permission.ViewVisibilityAndAccess]: [
    EntityAccessRole.owner,
    EntityAccessRole.editor,
    EntityAccessRole.viewer,
  ],
  [Permission.TransferOwnership]: [EntityAccessRole.owner],
  [Permission.DeleteCompletely]: [EntityAccessRole.owner],
  [Permission.ViewWhenUnpublished]: [
    EntityAccessRole.owner,
    EntityAccessRole.editor,
    EntityAccessRole.viewer,
  ],
  [Permission.EditCompilationObjects]: [EntityAccessRole.owner, EntityAccessRole.editor],
  [Permission.EditEntitySettings]: [EntityAccessRole.owner, EntityAccessRole.editor],
};

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private account = inject(AccountService);
  private selection = inject(SelectionService);

  private user = toSignal(this.account.user$);

  private readonly rolePriority = [
    EntityAccessRole.viewer,
    EntityAccessRole.editor,
    EntityAccessRole.owner,
  ] as const;

  public getRole(element: AccessTarget) {
    const userId = this.user()?._id;
    if (!userId || !element.access) return EntityAccessRole.viewer;

    return element.access.find(user => user._id === userId)?.role ?? EntityAccessRole.viewer;
  }

  getLowestRole(targets: AccessTarget[]): EntityAccessRole {
    if (!targets.length) return EntityAccessRole.viewer;

    const roles = targets.map(target => this.getRole(target));

    return this.rolePriority.find(role => roles.includes(role)) ?? EntityAccessRole.owner;
  }

  hasPermission(permission: Permission, target?: AccessTarget | AccessTarget[]): boolean {
    let role: EntityAccessRole;

    if (target) {
      role = Array.isArray(target) ? this.getLowestRole(target) : this.getRole(target);
    } else {
      const selectedElements = this.selection.selectedElements();
      role = this.getLowestRole(selectedElements);
    }

    const allowedRoles = Permissions[permission];
    return allowedRoles?.includes(role) ?? false;
  }

  canEditMetaData(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.EditMetaData, target);
  }

  canEditEntitySettings(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.EditEntitySettings, target);
  }

  canEditAnnotation(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.EditAnnotation, target);
  }

  canEditVisibilityAndAccess(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.EditVisibilityAndAccess, target);
  }

  canViewVisibilityAndAccess(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.ViewVisibilityAndAccess, target);
  }

  canTransferOwnership(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.TransferOwnership, target);
  }

  canDeleteCompletely(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.DeleteCompletely, target);
  }

  canViewWhenUnpublished(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.ViewWhenUnpublished, target);
  }

  canEditCompilationObjects(target?: AccessTarget | AccessTarget[]): boolean {
    return this.hasPermission(Permission.EditCompilationObjects, target);
  }
}
