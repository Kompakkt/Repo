import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { AccountService, BackendService } from 'src/app/services';
import { ReplaySubject } from 'rxjs';
import { ICompilation, IGroup } from '~common/interfaces';

@Component({
  selector: 'app-collaborate',
  templateUrl: './collaborate.component.html',
  styleUrls: ['./collaborate.component.scss'],
})
export class CollaborateComponent implements OnInit {
  public userInGroups$ = new ReplaySubject<IGroup[]>(0);
  public userInCompilations$ = new ReplaySubject<ICompilation[]>(0);

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
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

    this.userInGroups$.next([]);
    this.userInCompilations$.next([]);

    this.account.user$.subscribe(() => {
      this.backend.findUserInGroups().then(groups => this.userInGroups$.next(groups));
      this.backend
        .findUserInCompilations()
        .then(compilations => this.userInCompilations$.next(compilations));
    });
  }
}
