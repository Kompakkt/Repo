import { AfterViewInit, Component, input, computed, inject } from '@angular/core';
import { AccountService } from 'src/app/services';
import { IEntity, isDigitalEntity, isPhysicalEntity } from 'src/common';
import { DetailEntityComponent } from './detail-entity/detail-entity.component';
import { PhysicalEntity } from 'src/app/metadata';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
  imports: [DetailEntityComponent],
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
    return digitalEntity ? digitalEntity.phyObjs.filter(isPhysicalEntity) : [];
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
