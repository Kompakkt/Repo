import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { IContact, IInstitution, IPerson } from 'src/common';
import { DetailInstitutionComponent } from '../detail-institution/detail-institution.component';

const firstKey = (obj: any) => Object.keys(obj)[0] ?? '';

@Component({
  selector: 'app-detail-person',
  templateUrl: './detail-person.component.html',
  styleUrls: ['./detail-person.component.scss'],
  standalone: true,
  imports: [MatChipListbox, MatChipOption, DetailInstitutionComponent, AsyncPipe],
})
export class DetailPersonComponent implements OnChanges {
  @Input('person')
  public person: IPerson | undefined = undefined;

  private personSubject = new BehaviorSubject(this.person);

  get person$() {
    return this.personSubject.pipe(
      filter(person => !!person),
      map(person => person as IPerson),
    );
  }

  get contact$() {
    return this.person$.pipe(
      map(person => person.contact_references[firstKey(person.contact_references)]),
      filter(contact => !!contact),
      map(contact => contact as IContact),
    );
  }

  get roles$() {
    return this.person$.pipe(
      map(person => person.roles[firstKey(person.roles)]),
      filter(roleArr => !!roleArr),
      map(roleArr => (roleArr as string[]).map(role => role.split('_').join(' ').toLowerCase())),
    );
  }

  get institutions$() {
    return this.person$.pipe(
      map(person => person.institutions[firstKey(person.institutions)]),
      filter(instArr => !!instArr),
      map(instArr => instArr as IInstitution[]),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const person = changes.person?.currentValue as IPerson | undefined;
    if (person) this.personSubject.next(person);
  }
}
