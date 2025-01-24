import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {
  IAddress,
  IDigitalEntity,
  IPhysicalEntity,
  isDigitalEntity,
  isInstitution,
  isPerson,
  isPhysicalEntity,
} from 'src/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DetailInstitutionComponent } from '../detail-institution/detail-institution.component';
import { DetailPersonComponent } from '../detail-person/detail-person.component';

interface ILicence {
  src: string;
  description: string;
  link: string;
}

type AnyEntity = IDigitalEntity | IPhysicalEntity;

// TODO: Kompakkt/Common typeguard
const isAddress = (obj: IAddress): obj is IAddress => {
  return (
    !!obj?.building ||
    !!obj?.city ||
    !!obj?.country ||
    !!obj?.number ||
    !!obj?.street ||
    !!obj?.postcode
  );
};

@Component({
    selector: 'app-detail-entity',
    templateUrl: './detail-entity.component.html',
    styleUrls: ['./detail-entity.component.scss'],
    imports: [
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatExpansionPanelDescription,
        DetailPersonComponent,
        DetailInstitutionComponent,
        AsyncPipe,
        TranslatePipe,
    ]
})
export class DetailEntityComponent implements OnChanges {
  @Input('digitalEntity')
  public digitalEntity: IDigitalEntity | undefined = undefined;

  @Input('physicalEntity')
  public physicalEntity: IPhysicalEntity | undefined = undefined;

  private entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  public Licenses: { [key: string]: ILicence } = {
    'BY': {
      src: 'assets/licence/BY.png',
      description: 'CC Attribution',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    'BY-SA': {
      src: 'assets/licence/BY-SA.png',
      description: 'CC Attribution-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    'BY-ND': {
      src: 'assets/licence/BY-ND.png',
      description: 'CC Attribution-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    'BYNC': {
      src: 'assets/licence/BYNC.png',
      description: 'CC Attribution-NonCommercial',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    'BYNCSA': {
      src: 'assets/licence/BYNCSA.png',
      description: 'CC Attribution-NonCommercial-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    'BYNCND': {
      src: 'assets/licence/BYNCND.png',
      description: 'CC Attribution-NonCommercial-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
  };

  get entity$() {
    return this.entitySubject.pipe(
      filter(entity => !!entity),
      map(entity => entity as AnyEntity),
    );
  }

  get persons$() {
    return this.entity$.pipe(map(entity => entity.persons.filter(p => isPerson(p))));
  }

  get institutions$() {
    return this.entity$.pipe(map(entity => entity.institutions.filter(i => isInstitution(i))));
  }

  get hasPersonsOrInstitutions$() {
    return combineLatest(this.persons$, this.institutions$).pipe(
      map(([persons, institutions]) => persons.length + institutions.length > 0),
    );
  }

  get digitalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => entity as IDigitalEntity),
    );
  }

  get physicalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isPhysicalEntity(entity)),
      map(entity => entity as IPhysicalEntity),
    );
  }

  get place$() {
    return this.physicalEntity$.pipe(map(physicalEntity => physicalEntity.place));
  }

  get address$() {
    return this.place$.pipe(
      map(place => place.address),
      filter(
        address => isAddress(address),
        map(address => address as IAddress),
      ),
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    const digitalEntity = changes.digitalEntity?.currentValue as IDigitalEntity | undefined;

    const physicalEntity = changes.physicalEntity?.currentValue as IPhysicalEntity | undefined;

    console.log(digitalEntity, physicalEntity);

    if (digitalEntity) this.entitySubject.next(digitalEntity);

    if (physicalEntity) this.entitySubject.next(physicalEntity);
  }
}
