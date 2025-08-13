import { Component, computed, HostBinding, inject, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer, Meta, SafeResourceUrl, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, RouterModule } from '@angular/router';

import { TranslatePipe } from 'src/app/pipes';
import { SafePipe } from '../../pipes/safe.pipe';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { getViewerUrl } from 'src/app/util/get-viewer-url';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { filter, map, shareReplay, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GridElementComponent } from 'src/app/components';
import { Collection } from 'src/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
  imports: [
    ActionbarComponent,
    GridElementComponent,
    SafePipe,
    AsyncPipe,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
})
export class AnnotateComponent implements OnInit {
  #translatePipe = inject(TranslatePipe);
  #backend = inject(BackendService);
  #route = inject(ActivatedRoute);
  #titleService = inject(Title);
  #metaService = inject(Meta);
  account = inject(AccountService);
  dialogHelper = inject(DialogHelperService);

  routeParams$ = this.#route.paramMap.pipe(
    map(params => ({
      id: params?.get('id'),
      type: params?.get('type') as 'compilation' | 'entity' | null,
    })),
  );
  routeParams = toSignal(this.routeParams$, { initialValue: { id: null, type: null } });

  showDemo = computed(() => {
    const params = this.routeParams();
    return params.id === null || params.type === null;
  });

  @HostBinding('class.demo-mode')
  get isShowDemo() {
    return this.showDemo();
  }

  viewerUrl = computed(() => {
    const { id, type } = this.routeParams();
    if (!type || !id) return undefined;

    const data: Record<string, string> = { mode: 'annotation' };
    data[type] = id;

    const url = new URL(getViewerUrl());
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;
      url.searchParams.set(key, value);
    }
    return url.toString();
  });

  entity$ = this.routeParams$.pipe(
    filter(params => !!params.id && !!params.type),
    switchMap(({ id, type }) =>
      type === 'entity' ? this.#backend.getEntity(id!) : this.#backend.getCompilation(id!),
    ),
    map(entity => entity ?? undefined),
    shareReplay(1),
  );

  annotatedEntitiesAndCompilations$ = this.account.annotations$.pipe(
    map(annotations => {
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
      return items;
    }),
    switchMap(items =>
      Promise.all(
        Object.entries(items).map(([target, isCompilation]) =>
          isCompilation ? this.#backend.getCompilation(target) : this.#backend.getEntity(target),
        ),
      ),
    ),
    map(resolved => resolved.filter(v => !!v)),
    shareReplay(1),
  );

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#translatePipe.transform('Annotate'));
    this.#metaService.updateTag({
      name: 'description',
      content: 'Annotate object.',
    });
    this.account.updateTrigger$.next(Collection.annotation);
  }
}
