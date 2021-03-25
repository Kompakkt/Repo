import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  IDigitalEntity,
  IPhysicalEntity,
  isPhysicalEntity,
  isDigitalEntity,
  IPerson,
  IAddress,
} from '~common/interfaces';
import { map, filter, find } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

interface ILicence {
  src: string;
  description: string;
  link: string;
}

type AnyEntity = IDigitalEntity | IPhysicalEntity;

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
    return this.entity$.pipe(map(entity => entity.persons));
  }

  get institutions$() {
    return this.entity$.pipe(map(entity => entity.institutions));
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
