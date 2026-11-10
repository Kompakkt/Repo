import { Component, computed, ElementRef, signal, viewChild, input, resource } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from 'src/environment';
import {
  Collection,
  ICompilation,
  IEntity,
  isCompilation,
  isDigitalEntity,
  isEntity,
} from '@kompakkt/common';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { CompilationDetailComponent } from '../../components/compilation-detail/compilation-detail.component';
import { EntityDetailComponent } from '../../components/entity-detail/entity-detail.component';
import { SafePipe } from '../../pipes/safe.pipe';
import { ExtenderSlotManager } from '@kompakkt/plugins/extender';
import { toObservable } from '@angular/core/rxjs-interop';
import { IsEntityPipe } from 'src/app/pipes/is-entity.pipe';
import { IsCompilationPipe } from 'src/app/pipes/is-compilation.pipe';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { inject } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { effect } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BackendService } from 'src/app/services/backend.service';
import { SelectHistoryService } from 'src/app/services/select-history.service';
import { AccountService } from 'src/app/services/account.service';
import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { UploadedByComponent } from 'src/app/components/uploaded-by/uploaded-by.component';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    ActionbarComponent,
    EntityDetailComponent,
    CompilationDetailComponent,
    GridElementComponent,
    SafePipe,
    IsEntityPipe,
    IsCompilationPipe,
    NgxFluentPipe,
    SlicePipe,
    MatProgressSpinnerModule,
    UploadedByComponent,
    DatePipe,
  ],
  host: {
    '[class.is-entity]': 'elementType() === "entity"',
    '[class.is-compilation]': 'elementType() === "compilation"',
    '(window:resize)': 'onResize()',
  },
})
export class DetailPageComponent implements OnDestroy {
  #backend = inject(BackendService);
  #selectHistory = inject(SelectHistoryService);
  #titleService = inject(Title);
  #metaService = inject(Meta);
  #account = inject(AccountService);

  // Route input bindings
  type = input.required<'entity' | 'compilation'>();
  id = input.required<string>();

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

  isLoading = computed(() => this.#elementResource.isLoading());
  _updateTrigger = effect(() => {
    const trigger = this.#account.updateTrigger();
    if (trigger === 'all' || trigger === Collection.entity || trigger === Collection.compilation) {
      this.#elementResource.reload();
    }
  });

  #element$ = toObservable(this.element);
  elementType = computed(() => {
    const element = this.element();
    if (isEntity(element)) return 'entity';
    if (isCompilation(element)) return 'compilation';
    return undefined;
  });
  viewerUrl = computed(() => {
    const type = this.type();
    const id = this.id();
    const element = this.element();
    if (!element || !type || !id) return undefined;
    return `${environment.viewer_url}?${type}=${id}&mode=open`;
  });

  detailSlotRef = viewChild<ElementRef<HTMLDivElement>>('detailSlot');
  #viewContainerRef = inject(ViewContainerRef);
  #registerSlotEffectRef = effect(() => {
    const elementType = this.elementType();
    if (!elementType) return;
    const elementRef = this.detailSlotRef();
    if (!elementRef) return console.error('Detail slot element ref not found');
    ExtenderSlotManager.registerSlot({
      slotName: `${elementType}-detail`,
      slotBehaviour: 'replace',
      elementRef: elementRef,
      viewContainerRef: this.#viewContainerRef,
      dataObservable: this.#element$,
    });
  });

  ngOnDestroy(): void {
    this.#registerSlotEffectRef.destroy();
    const elementType = this.elementType();
    if (!elementType) return;
    ExtenderSlotManager.unregisterSlot(`${elementType}-detail`);
  }

  #userInCompilationsResource = resource({
    params: () => {
      const element = this.element();
      if (!element || !isEntity(element)) return undefined;
      return element._id.toString();
    },
    loader: ({ params }) => this.#backend.countEntityUses(params),
  });
  usedInCompilations = computed(() =>
    this.#userInCompilationsResource.hasValue()
      ? this.#userInCompilationsResource.value()
      : undefined,
  );

  #compilationGridUpdateTrigger = signal(0);
  compilationGrid = viewChild<ElementRef<HTMLDivElement>>('compilationGrid');
  compilationGridColumns = computed<number>(() => {
    const _forcedUpdate = this.#compilationGridUpdateTrigger();
    const el = this.compilationGrid()?.nativeElement;
    if (!el) return 4;
    const columnCount = getComputedStyle(el)?.['grid-template-columns']?.split(/\s+/).length;
    return columnCount || 4;
  });
  compilationGridExpanded = signal(false);
  compilationGridOffset = signal(0);
  compilationGridStart = computed(() =>
    this.compilationGridExpanded() ? 0 : this.compilationGridOffset(),
  );
  compilationGridEnd = computed(() =>
    this.compilationGridExpanded()
      ? this.usedInCompilations()?.occurences || Number.MAX_SAFE_INTEGER
      : this.compilationGridOffset() + this.compilationGridColumns(),
  );

  onResize() {
    this.#compilationGridUpdateTrigger.update(n => n + 1);
  }

  constructor() {
    effect(() => {
      console.log(this.type(), this.id());
    });
    effect(() => {
      const element = this.element();
      if (!element) return;
      return this.#updatePageMetadata(element);
    });
    effect(() => {
      const usedInCompilations = this.usedInCompilations();
      if (usedInCompilations) {
        requestAnimationFrame(() => {
          this.#compilationGridUpdateTrigger.update(n => n + 1);
        });
      }
    });
  }

  async #updatePageMetadata(element: IEntity | ICompilation) {
    this.#titleService.setTitle(`Kompakkt – ${element.name}`);

    const description =
      isEntity(element) && isDigitalEntity(element.relatedDigitalEntity)
        ? element.relatedDigitalEntity.description
        : isCompilation(element)
          ? element.description
          : '';

    this.#metaService.updateTag({
      name: 'description',
      content: description,
    });

    await this.#selectHistory.select(element);
  }

  scrollToElementBottom(el: HTMLDivElement) {
    console.log(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
