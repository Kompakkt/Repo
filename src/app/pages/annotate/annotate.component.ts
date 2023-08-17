import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { IAnnotation, ICompilation, IEntity } from 'src/common';
import { AccountService, BackendService } from 'src/app/services';
import { map } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
})
export class AnnotateComponent implements OnInit {
  public entitiesAndCompilations$ = new ReplaySubject<Array<IEntity | ICompilation>>(0);
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private account: AccountService,
    private backend: BackendService,
  ) {}

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get userAnnotations$() {
    return this.account.user$.pipe(map(({ data }) => data.annotation as IAnnotation[]));
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Annotate`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Annotate object.',
    });

    this.userAnnotations$.subscribe(annotations => {
      // Multiple annotations can and will be on the same objects or collections
      // Using reverse mapping, we can narrow down the targets
      const items = Object.fromEntries(
        annotations
          .map(annotation => annotation.target.source)
          .map(({ relatedCompilation, relatedEntity }) => {
            {
              const isCompilation = typeof relatedCompilation === 'string' && !!relatedCompilation;
              const target = isCompilation ? relatedCompilation : relatedEntity;
              return [target, isCompilation];
            }
          }),
      );

      Promise.all(
        Object.entries(items).map(async ([target, isCompilation]) => {
          return isCompilation
            ? await this.backend.getCompilation(target)
            : await this.backend.getEntity(target);
        }),
      )
        .then(items => {
          return items.filter(item => !!item).map(item => item as IEntity | ICompilation);
        })
        .then(items => {
          this.entitiesAndCompilations$.next(Array.from(new Set(items)));
        });
    });
  }
}
