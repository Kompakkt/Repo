import { Component, computed, inject, OnInit, input, resource } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { SafePipe } from '../../pipes/safe.pipe';
import { getViewerUrl } from 'src/app/util/get-viewer-url';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { BackendService } from 'src/app/services/backend.service';
import { AccountService } from 'src/app/services/account.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
  imports: [
    ActionbarComponent,
    GridElementComponent,
    SafePipe,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
  host: {
    '[class.demo-mode]': 'showDemo()',
  },
})
export class AnnotateComponent implements OnInit {
  #NgxFluentPipe = inject(NgxFluentPipe);
  #backend = inject(BackendService);
  #titleService = inject(Title);
  #metaService = inject(Meta);
  account = inject(AccountService);
  dialogHelper = inject(DialogHelperService);

  // Route input bindings, optional for this component
  type = input<'entity' | 'compilation' | undefined>();
  id = input<string | undefined>();

  routeParams = computed(() => ({ type: this.type(), id: this.id() }));

  #elementResource = resource({
    params: () => {
      const { type, id } = this.routeParams();
      if (!type || !id) return undefined;
      return { type, id };
    },
    loader: async ({ params: { type, id } }) => {
      return type === 'entity' ? this.#backend.getEntity(id) : this.#backend.getCompilation(id);
    },
  });
  element = computed(() =>
    this.#elementResource.hasValue() ? this.#elementResource.value() : undefined,
  );

  showDemo = computed(() => {
    const params = this.routeParams();
    return !params.id && !params.type;
  });

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

  #annotatedEntitiesAndCompilationsResource = resource({
    params: () => {
      const annotations = this.account.annotations();
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
    },
    loader: ({ params }) =>
      Promise.all(
        Object.entries(params).map(([target, isCompilation]) =>
          isCompilation ? this.#backend.getCompilation(target) : this.#backend.getEntity(target),
        ),
      ),
  });
  annotatedEntitiesAndCompilations = computed(() => {
    const results = this.#annotatedEntitiesAndCompilationsResource.hasValue()
      ? this.#annotatedEntitiesAndCompilationsResource.value()
      : [];
    return results.filter(v => !!v);
  });

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#NgxFluentPipe.transform('Annotate'));
    this.#metaService.updateTag({
      name: 'description',
      content: 'Annotate object.',
    });
  }
}
