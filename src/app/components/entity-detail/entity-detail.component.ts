import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AccountService, ClipboardService, SnackbarService } from 'src/app/services';
import { IDigitalEntity, IEntity, isDigitalEntity } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DetailEntityComponent } from './detail-entity/detail-entity.component';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
  standalone: true,
  imports: [MatButton, MatTooltip, MatIcon, DetailEntityComponent, AsyncPipe, TranslatePipe],
})
export class EntityDetailComponent implements AfterViewInit, OnChanges {
  @Input('entity')
  public entity: IEntity | undefined;

  private entitySubject = new BehaviorSubject<IEntity | undefined>(undefined);

  constructor(
    public account: AccountService,
    // private clipboard: ClipboardService,
    // private snackbar: SnackbarService,
  ) {}

  get entity$() {
    return this.entitySubject.asObservable();
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
