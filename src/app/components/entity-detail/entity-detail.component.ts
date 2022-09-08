import { Component, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { isDigitalEntity, IEntity, IDigitalEntity, ICompilation } from 'src/common';
import {
  AccountService,
  SnackbarService,
  ClipboardService,
  SelectHistoryService,
  AllowAnnotatingService,
  DialogHelperService,
  QuickAddService,
  BackendService,
} from 'src/app/services';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
})
export class EntityDetailComponent implements AfterViewInit, OnChanges {
  @Input('entity')
  public entity: IEntity | undefined;

  private entitySubject = new BehaviorSubject<IEntity | undefined>(undefined);

  constructor(
    public account: AccountService,
    private clipboard: ClipboardService,
    private snackbar: SnackbarService,
    private selectHistory: SelectHistoryService,
    private allowAnnotatingHelper: AllowAnnotatingService,
    public dialogHelper: DialogHelperService,
    private quickAdd: QuickAddService,
    private backend: BackendService,
  ) {}

  get entity$() {
    return this.entitySubject.asObservable();
  }

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get digitalEntity$() {
    return this.entity$.pipe(
      map(entity => entity?.relatedDigitalEntity),
      filter(digitalEntity => isDigitalEntity(digitalEntity)),
      map(digitalEntity => digitalEntity as IDigitalEntity),
    );
  }

  get physicalEntites$() {
    return this.digitalEntity$.pipe(map(digitalEntity => digitalEntity.phyObjs));
  }

  get isUsedInCompilations() {
    return this.selectHistory.usedInCompilations.compilations.length > 0;
  }

  get usedInCompilations() {
    return this.selectHistory.usedInCompilations.compilations;
  }

  get isUserOwner$() {
    return this.entity$.pipe(
      map(entity => (entity ? this.allowAnnotatingHelper.isUserOwner(entity) : false)),
    );
  }

  get userCompilations$(): Observable<ICompilation[]> {
    return this.account.user$.pipe(map(user => user?.data?.compilation ?? []));
  }

  public copyEmbed(title: string) {
    const iframe = document.querySelector('.iframe-container > iframe') as
      | HTMLIFrameElement
      | undefined;
    if (!iframe) return this.snackbar.showMessage('Could not find viewer');
    const embedHTML = `
<iframe
  name="${title}"
  src="${iframe.src}"
  allowfullscreen
  loading="lazy"
></iframe>`.trim();
    this.clipboard.copy(embedHTML);
  }

  public copyId() {
    const _id = this.entitySubject.value?._id;
    if (!_id) return this.snackbar.showMessage('Could not copy id');
    this.clipboard.copy(_id.toString());
  }

  public downloadMetadata(digitalEntity: IDigitalEntity) {
    const blob = new Blob([JSON.stringify(digitalEntity)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `${digitalEntity.title}.json`;

    document.body.appendChild(link);
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    document.body.removeChild(link);
  }

  public quickAddToCompilation(comp: ICompilation, entity: IEntity) {
    this.quickAdd.quickAddToCompilation(comp, entity._id.toString());
  }

  public async togglePublished(entity: IEntity) {
    this.backend
      .pushEntity({ ...entity, online: !entity.online })
      .then(result => {
        console.log('Toggled?:', result);
        this.entitySubject.next(result);
      })
      .catch(error => console.error(error));
  }

  ngAfterViewInit() {
    // Workaround for https://github.com/angular/components/issues/11478
    const interval = setInterval(
      () => document.querySelectorAll('mat-tooltip-component').forEach(item => item.remove()),
      50,
    );

    setTimeout(() => clearInterval(interval), 500);
  }

  ngOnChanges(changes: SimpleChanges) {
    const entity = changes.entity?.currentValue as IEntity | undefined;
    if (entity) this.entitySubject.next(entity);
  }
}
