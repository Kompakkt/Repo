import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { map, Observable, of, switchMap } from 'rxjs';
import { IGroup } from '~common/interfaces';

@Component({
  selector: 'app-collaborate',
  templateUrl: './collaborate.component.html',
  styleUrls: ['./collaborate.component.scss'],
})
export class CollaborateComponent implements OnInit {
  public groups$: Observable<Array<IGroup & { userOwned: boolean }>> = this.account.userData$.pipe(
    switchMap(user => {
      if (!user) return of({ user, groups: [] });
      return this.backend.findUserInGroups().then(groups => ({ user, groups }));
    }),
    map(({ user, groups }) => {
      if (!user) return [];
      return groups.map(group => ({
        ...group,
        userOwned:
          group.creator._id === user._id || group.owners.some(owner => owner._id === user._id),
      }));
    }),
  );

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
    public dialogHelper: DialogHelperService,
  ) {}

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Collaborate`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Work collaboratively.',
    });
  }
}
