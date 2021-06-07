import { Injectable } from '@angular/core';

import { BackendService } from './backend.service';
import { Person, Institution, Tag } from '~metadata';

import { filter, map } from 'rxjs/operators';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {
  // Existing server content
  private ServerPersons = new BehaviorSubject<Person[]>([]);
  private ServerInstitutions = new BehaviorSubject<Institution[]>([]);
  private ServerTags = new BehaviorSubject<Tag[]>([]);

  // Newly added content
  private LocalPersons = new BehaviorSubject<Person[]>([]);
  private LocalInstitutions = new BehaviorSubject<Institution[]>([]);
  // There are no cases where local tags are needed
  // private LocalTags = new BehaviorSubject<Tag[]>([]);

  constructor(private backend: BackendService) {
    this.updateContent();
  }

  get $Persons() {
    return combineLatest(this.ServerPersons, this.LocalPersons).pipe(
      map(([serverPersons, localPersons]) => serverPersons.concat(localPersons)),
    );
  }

  get $Institutions() {
    return combineLatest(this.ServerInstitutions, this.LocalInstitutions).pipe(
      map(([serverInstitutions, localInstitutions]) =>
        serverInstitutions.concat(localInstitutions),
      ),
    );
  }

  get $Tags() {
    return this.ServerTags.asObservable();
  }

  public async updateContent() {
    // TODO: refetch on some occasions, e.g. after wizard completion
    await Promise.all([this.updatePersons(), this.updateInstitutions(), this.updateTags()]);
  }

  public async updatePersons() {
    this.backend
      .getAllPersons()
      .then(result => {
        if (Array.isArray(result)) {
          this.ServerPersons.next(result.map(p => new Person(p)));
        }
      })
      .catch(() => {});
  }

  public async updateInstitutions() {
    this.backend
      .getAllInstitutions()
      .then(result => {
        if (Array.isArray(result)) {
          this.ServerInstitutions.next(result.map(i => new Institution(i)));
        }
      })
      .catch(() => {});
  }

  public async updateTags() {
    this.backend
      .getAllTags()
      .then(result => {
        const map = new Map<string, Tag>();
        for (const tag of result) {
          map.set(tag._id.toString(), new Tag(tag));
        }
        const tags = Array.from(map.values()).sort((a, b) => (a.value > b.value ? 1 : -1));
        this.ServerTags.next(tags);
      })
      .catch(() => {});
  }

  public addLocalPerson(person: Person) {
    this.LocalPersons.next(this.LocalPersons.value.concat(person));
    return this.LocalPersons.value[this.LocalPersons.value.length - 1];
  }

  public removeLocalPerson(person: Person) {
    const persons = [...this.LocalPersons.value];
    const index = persons.findIndex(p => p._id.toString() === person._id.toString());
    if (index >= 0) {
      persons.splice(index, 1);
      this.LocalPersons.next(persons);
    } else {
      console.warn(`Couldn't find person in LocalPersons`, person, persons);
    }
  }

  public addLocalInstitution(institution: Institution) {
    this.LocalInstitutions.next(this.LocalInstitutions.value.concat(institution));
    return this.LocalInstitutions.value[this.LocalInstitutions.value.length - 1];
  }

  public removeLocalInstitution(institution: Institution) {
    const institutions = [...this.LocalInstitutions.value];
    const index = institutions.findIndex(i => i._id.toString() === institution._id.toString());
    if (index >= 0) {
      institutions.splice(index, 1);
      this.LocalInstitutions.next(institutions);
    } else {
      console.warn(`Couldn't find institution in LocalInstitutions`, institution, institutions);
    }
  }
}
