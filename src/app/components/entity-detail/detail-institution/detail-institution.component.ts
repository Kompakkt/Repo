import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { map, filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

import { IInstitution, IAddress } from 'src/common';

const firstKey = (obj: any) => Object.keys(obj)[0] ?? '';

@Component({
  selector: 'app-detail-institution',
  templateUrl: './detail-institution.component.html',
  styleUrls: ['./detail-institution.component.scss'],
})
export class DetailInstitutionComponent implements OnChanges {
  @Input('institution')
  public institution: IInstitution | undefined = undefined;

  private institutionSubject = new BehaviorSubject(this.institution);

  get institution$() {
    return this.institutionSubject.pipe(
      filter(institution => !!institution),
      map(institution => institution as IInstitution),
    );
  }

  get roles$() {
    return this.institution$.pipe(
      map(institution => institution.roles[firstKey(institution.roles)]),
      filter(roleArr => !!roleArr),
      map(roleArr => (roleArr as string[]).map(role => role.split('_').join(' ').toLowerCase())),
    );
  }

  get note$() {
    return this.institution$.pipe(
      map(institution => institution.notes[firstKey(institution.notes)]),
      filter(note => !!note),
      map(note => note as string),
    );
  }

  get address$() {
    return this.institution$.pipe(
      map(institution => institution.addresses[firstKey(institution.addresses)]),
      filter(address => !!address),
      map(address => address as IAddress),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const institution = changes.institution?.currentValue as IInstitution | undefined;
    if (institution) this.institutionSubject.next(institution);
  }
}
