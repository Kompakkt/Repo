import {
  AfterViewInit,
  Component,
  input,
  computed,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
  imports: [MatButton, MatTooltip, MatIcon, DetailEntityComponent, AsyncPipe, TranslatePipe],
})
export class EntityDetailComponent implements AfterViewInit {
  account = inject(AccountService);

  entity = input.required<IEntity>();
  public digitalEntity = computed(() => {
    const { relatedDigitalEntity } = this.entity();
    return isDigitalEntity(relatedDigitalEntity) ? relatedDigitalEntity : undefined;
  });
  public physicalEntities = computed(() => {
    const digitalEntity = this.digitalEntity();
    return digitalEntity ? digitalEntity.phyObjs : [];
  });

  ngAfterViewInit() {
    // TODO: Check if this is still necessary
    // Workaround for https://github.com/angular/components/issues/11478
    const interval = setInterval(
      () => document.querySelectorAll('mat-tooltip-component').forEach(item => item.remove()),
      50,
    );

    setTimeout(() => clearInterval(interval), 500);
  }
}
