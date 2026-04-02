import { AfterViewInit, Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Data, NavigationEnd, Params, Router } from '@angular/router';
import { zip, of, firstValueFrom, combineLatest } from 'rxjs';
import { filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  AccountService,
  BackendService,
  DialogHelperService,
  SelectHistoryService,
} from 'src/app/services';
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
import { ExtenderSlotDirective } from '@kompakkt/plugins/extender';
import ObjectID from 'bson-objectid';
import { toSignal } from '@angular/core/rxjs-interop';
import { IsEntityPipe } from 'src/app/pipes/is-entity.pipe';
import { IsCompilationPipe } from 'src/app/pipes/is-compilation.pipe';
import { TranslatePipe } from 'src/app/pipes';
import { GridElementComponent } from 'src/app/components';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type DataWithType = {
  type: 'entity' | 'compilation';
};
const isDataWithType = (data: Data): data is DataWithType => {
  return data && data.type && (data.type === 'entity' || data.type === 'compilation');
};

type ParamsWithId = {
  id: string;
};
const isParamsWithId = (params: Params): params is ParamsWithId => {
  return params && params.id && typeof params.id === 'string' && ObjectID.isValid(params.id);
};

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    ActionbarComponent,
    EntityDetailComponent,
    CompilationDetailComponent,
    GridElementComponent,
    SafePipe,
    ExtenderSlotDirective,
    IsEntityPipe,
    IsCompilationPipe,
    TranslatePipe,
    SlicePipe,
  ],
  host: {
    '[class.is-entity]': 'elementType() === "entity"',
    '[class.is-compilation]': 'elementType() === "compilation"',
    '(window:resize)': 'onResize()',
  },
})
export class DetailPageComponent implements AfterViewInit {
  private baseURL = `${environment.viewer_url}`;

  #routeInfo$ = combineLatest([
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)),
    this.route.params,
    this.route.data,
  ]).pipe(
    map(([_, params, data]) => {
      if (!isParamsWithId(params) || !isDataWithType(data)) {
        console.error('Invalid data or params in DetailPageComponent', { data, params });
        return { params: undefined, data: undefined };
      }
      return { params, data };
    }),
    tap(arr => console.log('routeInfo', arr)),
  );

  element$ = combineLatest([
    this.#routeInfo$,
    this.account.updateTrigger$.pipe(
      filter(
        trigger =>
          trigger === 'all' || trigger === Collection.entity || trigger === Collection.compilation,
      ),
    ),
  ]).pipe(
    switchMap(([{ params, data }]) => {
      if (!params?.id || !data.type) {
        console.error('Invalid route info in DetailPageComponent', { params, data });
        return of(undefined);
      }

      if (data.type === 'entity') {
        return this.fetchEntity(params.id);
      } else {
        return this.fetchCompilation(params.id);
      }
    }),
    shareReplay(),
  );
  element = toSignal(this.element$);
  elementType = computed(() => {
    const element = this.element();
    if (isEntity(element)) return 'entity';
    if (isCompilation(element)) return 'compilation';
    return undefined;
  });

  viewerUrl$ = combineLatest([this.#routeInfo$, this.element$]).pipe(
    tap(arr => console.log('viewerUrl', arr)),
    filter(([info, element]) => {
      return !!info.data?.type && !!info.params?.id && !!element;
    }),
    map(([info]) => {
      return `${this.baseURL}?${info.data!.type}=${info.params!.id}&mode=open`;
    }),
  );
  viewerUrl = toSignal(this.viewerUrl$);

  usedInCompilations$ = this.element$.pipe(
    filter(isEntity),
    switchMap(entity => this.backend.countEntityUses(entity._id)),
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
      ? -1
      : this.compilationGridOffset() + this.compilationGridColumns(),
  );

  onResize() {
    this.#compilationGridUpdateTrigger.update(n => n + 1);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendService,
    private selectHistory: SelectHistoryService,
    private titleService: Title,
    private metaService: Meta,
    private dialog: DialogHelperService,
    private account: AccountService,
  ) {
    this.element$.subscribe(element => {
      if (!element) return;
      this.updatePageMetadata(element);
    });
  }

  private async fetchEntity(id: string) {
    const entity = await this.backend.getEntity(id);
    if (!entity || !isEntity(entity)) return console.error('Failed getting entity');
    console.log('Fetched entity', entity);
    return entity;
  }

  private async fetchCompilation(id: string, password?: string) {
    const compilation = await this.backend.getCompilation(id, password);
    if (!compilation || !isCompilation(compilation)) {
      const password = await this.passwordConfirmation();
      if (!password) {
        console.error('Failed getting compilation, no password provided');
        return;
      }
      return await this.backend.getCompilation(id, password).then(result => {
        if (!result || !isCompilation(result)) {
          console.error('Failed getting compilation with password');
          return;
        }
        console.log('Fetched compilation with password', result);
        return result;
      });
    } else {
      return compilation;
    }
  }

  private async passwordConfirmation() {
    return firstValueFrom(this.dialog.openPasswordProtectedDialog().afterClosed()).then(
      password => {
        if (!password || typeof password !== 'string') return undefined;
        return password;
      },
    );
  }

  private async updatePageMetadata(element: IEntity | ICompilation) {
    this.titleService.setTitle(`Kompakkt – ${element.name}`);

    const description =
      isEntity(element) && isDigitalEntity(element.relatedDigitalEntity)
        ? element.relatedDigitalEntity.description
        : isCompilation(element)
          ? element.description
          : '';

    this.metaService.updateTag({
      name: 'description',
      content: description,
    });

    this.selectHistory.select(element);
  }

  ngAfterViewInit(): void {
    this.usedInCompilations$.subscribe(() => {
      requestAnimationFrame(() => {
        this.#compilationGridUpdateTrigger.update(n => n + 1);
      });
    });
  }
}
