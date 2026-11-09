import { Component, computed, inject, input } from '@angular/core';
import { IEntity, isDigitalEntity, isPhysicalEntity, isTag } from '@kompakkt/common';
import { DetailEntityComponent } from './detail-entity/detail-entity.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
  imports: [DetailEntityComponent, MatChipsModule, MatDividerModule, MatIconModule],
})
export class EntityDetailComponent {
  account = inject(AccountService);

  entity = input.required<IEntity>();
  digitalEntity = computed(() => {
    const { relatedDigitalEntity } = this.entity();
    return isDigitalEntity(relatedDigitalEntity) ? relatedDigitalEntity : undefined;
  });

  physicalEntities = computed(() => {
    const digitalEntity = this.digitalEntity();
    return digitalEntity ? digitalEntity.phyObjs.filter(isPhysicalEntity) : [];
  });

  hasTags = computed(() => {
    return this.tags().length > 0;
  });

  tags = computed(() => {
    const entity = this.digitalEntity();
    return entity?.tags.filter(isTag) ?? [];
  });
}
