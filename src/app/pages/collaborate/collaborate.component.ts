import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Meta, Title } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafePipe, TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';

import { AsyncPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-collaborate',
  templateUrl: './collaborate.component.html',
  styleUrls: ['./collaborate.component.scss'],
  imports: [AsyncPipe, MatProgressBarModule, MatButtonModule, MatIconModule, RouterModule],
})
export class CollaborateComponent implements OnInit {
  #translatePipe = inject(TranslatePipe);

  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #titleService = inject(Title);
  #metaService = inject(Meta);
  dialogHelper = inject(DialogHelperService);
  account = inject(AccountService);

  groups$ = this.account.userData$.pipe(
    switchMap(user => {
      if (!user) return of({ user, groups: [] });
      return this.#backend.findUserInGroups().then(groups => ({ user, groups }));
    }),
    map(({ user, groups }) => {
      if (!user) return [];
      return groups.map(group => ({
        ...group,
        userOwned:
          group.creator._id === user._id || group.owners.some(owner => owner._id === user._id),
        uniqueMembers: new Set([...group.members, ...group.owners].map(m => m._id)).size,
      }));
    }),
  );

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#translatePipe.transform('Collaborate'));
    this.#metaService.updateTag({
      name: 'description',
      content: 'Work collaboratively.',
    });
  }
}
