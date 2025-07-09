import { Component, computed, inject, input } from '@angular/core';
import { AccountService } from 'src/app/services';
import { IEntity, isDigitalEntity, isPhysicalEntity } from 'src/common';
import { DetailEntityComponent } from './detail-entity/detail-entity.component';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
  imports: [DetailEntityComponent],
})
export class EntityDetailComponent {
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
}
