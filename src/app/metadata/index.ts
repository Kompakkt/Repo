import ObjectID from 'bson-objectid';
import {
  IAddress,
  IBaseEntity,
  IContact,
  ICreationTuple,
  IDescriptionValueTuple,
  IDigitalEntity,
  IDimensionTuple,
  IFile,
  IInstitution,
  IPerson,
  IPhysicalEntity,
  IPlaceTuple,
  IRelatedMap,
  isDigitalEntity,
  ITag,
  ITypeValueTuple,
} from 'src/common';

const getObjectId = () => new ObjectID().toString();

const empty = (value: string | number | unknown[]): boolean =>
  typeof value === 'number' ? value <= 0 : value.length === 0;
const emptyProps = (arr: unknown[], props?: string[]) =>
  !empty(arr) &&
  arr.find(el => {
    if (typeof el === 'object' && el !== null) {
      const keys = Object.keys(el);
      for (const prop of props ?? keys) if (empty(el[prop])) return true;
    }
    return false;
  });

class BaseEntity implements IBaseEntity {
  _id: string = getObjectId();

  title = '';
  description = '';

  externalId = new Array<ITypeValueTuple>();
  externalLink = new Array<IDescriptionValueTuple>();
  biblioRefs = new Array<IDescriptionValueTuple>();
  other = new Array<IDescriptionValueTuple>();
  metadata_files = new Array<IFile>();

  persons = new Array<Person>();
  institutions = new Array<Institution>();

  constructor(obj: Partial<IBaseEntity> = {}) {
    this._id = obj._id ?? this._id;

    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      switch (key) {
        case 'persons':
          (value as IPerson[]).forEach(p => this.addPerson(p));
          break;
        case 'institutions':
          (value as IInstitution[]).forEach(i => this.addInstitution(i));
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  get properties() {
    return Object.keys(this);
  }

  public addPerson(person: Partial<IPerson> = {}) {
    this.persons.push(new Person(person));
  }

  public addInstitution(institution: Partial<IInstitution> = {}) {
    this.institutions.push(new Institution(institution));
  }

  public static checkIsValid(entity: BaseEntity): boolean {
    const {
      title,
      description,
      persons,
      institutions,
      externalId,
      externalLink,
      biblioRefs,
      other,
      metadata_files,
      _id,
    } = entity;

    // Every entity needs a title
    if (empty(title)) return false;

    // Every entity needs a description
    if (empty(description)) return false;

    // Every person of an entity needs to be valid
    if (persons.find(p => !Person.checkIsValid(p, _id))) return false;

    // Every institution of an entity needs to be valid
    if (institutions.find(i => !Institution.checkIsValid(i, _id))) return false;

    // Any existing external identifier needs all fields filled
    if (emptyProps(externalId)) return false;

    // Any existing external link needs all fields filled
    if (emptyProps(externalLink)) return false;

    // Any existing bibliographic reference needs a value
    if (emptyProps(biblioRefs, ['value'])) return false;

    // Any additional information added as 'other' needs all fields filled
    if (emptyProps(other)) return false;

    // Any added metadata file needs correctly filled fields
    if (emptyProps(metadata_files)) return false;

    return true;
  }

  public static rightsOwnerList(entity: AnyEntity): (Person | Institution)[] {
    const { persons, institutions, _id } = entity;
    const filteredPersons = persons.filter(p => Person.hasRole(p, _id, 'RIGHTS_OWNER'));
    const filteredInstitutions = institutions.filter(i =>
      Institution.hasRole(i, _id, 'RIGHTS_OWNER'),
    );

    return [...filteredPersons, ...filteredInstitutions];
  }

  public static contactPersonList(entity: AnyEntity): (Person | Institution)[] {
    const { persons, institutions, _id } = entity;
    const filteredPersons = persons.filter(p => Person.hasRole(p, _id, 'CONTACT_PERSON'));
    const filteredInstitutions = institutions.filter(i =>
      Institution.hasRole(i, _id, 'CONTACT_PERSON'),
    );

    return [...filteredPersons, ...filteredInstitutions];
  }

  public static creatorList(entity: AnyEntity): (Person | Institution)[] {
    const { persons, institutions, _id } = entity;
    const filteredPersons = persons.filter(p => Person.hasRole(p, _id, 'CREATOR'));
    const filteredInstitutions = institutions.filter(i => Institution.hasRole(i, _id, 'CREATOR'));

    return [...filteredPersons, ...filteredInstitutions];
  }

  public static editorList(entity: AnyEntity): (Person | Institution)[] {
    const { persons, institutions, _id } = entity;
    const filteredPersons = persons.filter(p => Person.hasRole(p, _id, 'EDITOR'));
    const filteredInstitutions = institutions.filter(i => Institution.hasRole(i, _id, 'EDITOR'));

    return [...filteredPersons, ...filteredInstitutions];
  }

  public static dataCreatorList(entity: AnyEntity): (Person | Institution)[] {
    const { persons, institutions, _id } = entity;
    const filteredPersons = persons.filter(p => Person.hasRole(p, _id, 'DATA_CREATOR'));
    const filteredInstitutions = institutions.filter(i =>
      Institution.hasRole(i, _id, 'DATA_CREATOR'),
    );

    return [...filteredPersons, ...filteredInstitutions];
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore: "Abstract methods can only appear within an abstract class"
  abstract get isPhysical(): this is IDigitalEntity;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore: "Abstract methods can only appear within an abstract class"
  abstract get isDigital(): this is IPhysicalEntity;
}

class DigitalEntity extends BaseEntity implements IDigitalEntity {
  type = '';
  licence = '';

  discipline = new Array<string>();
  tags = new Array<Tag>();

  dimensions = new Array<IDimensionTuple>();
  creation = new Array<ICreationTuple>();
  files = new Array<IFile>();

  statement = '';
  objecttype = '';

  phyObjs = new Array<PhysicalEntity>();

  constructor(obj: Partial<IDigitalEntity> = {}) {
    super(obj);
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      switch (key) {
        case 'persons':
        case 'institutions':
          break;
        case 'tags':
          (value as ITag[]).forEach(t => this.addTag(t));
          break;
        case 'phyObjs':
          (value as IPhysicalEntity[]).forEach(p => this.addPhysicalEntity(p));
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  public addPhysicalEntity(physical: Partial<IPhysicalEntity>) {
    this.phyObjs.push(new PhysicalEntity(physical));
  }

  public addTag(tag: Partial<ITag>) {
    this.tags.push(new Tag(tag));
  }

  public static hasRightsOwner(entity: AnyEntity): boolean {
    const { persons, institutions, _id } = entity;
    if (!persons.find(p => Person.hasRole(p, _id, 'RIGHTS_OWNER')))
      if (!institutions.find(i => Institution.hasRole(i, _id, 'RIGHTS_OWNER'))) return false;
    return true;
  }

  public static hasContactPerson(entity: DigitalEntity): boolean {
    const { persons, institutions, _id } = entity;
    if (!persons.find(p => Person.hasRole(p, _id, 'CONTACT_PERSON')))
      if (!institutions.find(i => Institution.hasRole(i, _id, 'CONTACT_PERSON'))) return false;
    return true;
  }

  public static hasCreator(entity: DigitalEntity): boolean {
    const { persons, institutions, _id } = entity;
    if (!persons.find(p => Person.hasRole(p, _id, 'CREATOR')))
      if (!institutions.find(i => Institution.hasRole(i, _id, 'CREATOR'))) return false;
    return true;
  }

  public static getRightOwnersList(entity) {
    return BaseEntity.rightsOwnerList(entity);
  }

  public static getContactPersonList(entity) {
    return BaseEntity.contactPersonList(entity);
  }

  public static getCreatorList(entity) {
    return BaseEntity.creatorList(entity);
  }

  public static getEditorList(entity) {
    return BaseEntity.editorList(entity);
  }

  public static getDataCreatorList(entity) {
    return BaseEntity.dataCreatorList(entity);
  }

  public static checkIsValid(entity: DigitalEntity): boolean {
    if (!BaseEntity.checkIsValid(entity)) return false;

    const { persons, institutions, dimensions, creation, phyObjs } = entity;
    const combined = [...persons, ...institutions];

    // Either a person or an institution must be supplied per entity
    if (empty(combined)) return false;

    // Every entity needs atleast 1 rights owner person/institution
    if (!DigitalEntity.hasRightsOwner(entity)) return false;

    // Every entity needs atleast 1 contact person
    if (!DigitalEntity.hasContactPerson(entity)) return false;

    // Any added dimension needs all fields filled
    if (emptyProps(dimensions)) return false;

    // Every physical entity needs to be valid
    if (phyObjs.find(p => !PhysicalEntity.checkIsValid(p))) return false;

    return true;
  }

  get isPhysical() {
    return false;
  }

  get isDigital() {
    return true;
  }
}

class PhysicalEntity extends BaseEntity implements IPhysicalEntity {
  place = new PlaceTuple();
  collection = '';

  constructor(obj: Partial<IPhysicalEntity> = {}) {
    super(obj);
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      switch (key) {
        case 'persons':
        case 'institutions':
          break;
        case 'place':
          this.place = new PlaceTuple(value as IPlaceTuple);
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  public setAddress(address: Partial<IAddress>) {
    this.place.setAddress(address);
  }

  public static checkIsValid(entity: PhysicalEntity): boolean {
    return (
      (entity.title === '' &&
        entity.description === '' &&
        entity.place.name === ''
        // (entity.persons.length ?? 0) === 0
      ) ||
      (entity.title !== '' &&
        entity.description !== '' &&
        entity.place.name !== ''
        // (entity.persons.length ?? 0) !== 0
      )
    );
  }

  get isPhysical() {
    return true;
  }

  get isDigital() {
    return false;
  }

  public static getRightOwnersList(entity) {
    return BaseEntity.rightsOwnerList(entity);
  }

  public static getContactPersonList(entity) {
    return BaseEntity.contactPersonList(entity);
  }

  public static getCreatorList(entity) {
    return BaseEntity.creatorList(entity);
  }

  public static getEditorList(entity) {
    return BaseEntity.editorList(entity);
  }

  public static getDataCreatorList(entity) {
    return BaseEntity.dataCreatorList(entity);
  }
}

class Person implements IPerson {
  _id: string = getObjectId();

  prename = '';
  name = '';

  roles: IRelatedMap<string[]> = {};
  institutions: IRelatedMap<Institution[]> = {};
  contact_references: IRelatedMap<IContact> = {};

  constructor(obj: Partial<IPerson> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      switch (key) {
        case 'institutions':
          for (const [id, insts] of Object.entries(value as IRelatedMap<Institution[]>)) {
            insts?.forEach(i => this.addInstitution(i, id));
          }
          break;
        case 'contact_references':
          for (const [id, contact] of Object.entries(value as IRelatedMap<IContact>)) {
            if (!contact) continue;
            this.setContactRef(contact, id);
          }
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  get fullName() {
    return `${this.prename} ${this.name}`;
  }

  public addInstitution(inst: IInstitution, relatedId: string) {
    relatedId = relatedId.toString();
    if (!this.institutions[relatedId]) this.institutions[relatedId] = new Array<Institution>();
    (this.institutions[relatedId] as Institution[]).push(new Institution(inst));
  }

  public static getRelatedInstitutions(person: Person, relatedId: string) {
    return person.institutions[relatedId.toString()] ?? new Array<Institution>();
  }

  public static getMostRecentContactRef(person: Person) {
    let mostRecent: ContactReference | undefined;
    for (const contact of Object.values(person.contact_references)) {
      if (!contact) continue;
      const patched = new ContactReference(contact);
      if (!ContactReference.checkIsValid(contact)) continue;
      if (patched.creation_date > (mostRecent?.creation_date ?? 0)) mostRecent = patched;
    }
    return mostRecent ? mostRecent : new ContactReference();
  }

  public static getValidContactRefs(person: Person) {
    const map = new Map<string, ContactReference>();
    for (const contact of Object.values(person.contact_references)) {
      if (!contact) continue;
      const patched = new ContactReference(contact);
      if (!ContactReference.checkIsValid(contact)) continue;
      map.set(patched._id.toString(), patched);
    }
    return Array.from(map.values());
  }

  public setContactRef(contact: IContact, relatedId: string) {
    this.contact_references[relatedId.toString()] = new ContactReference(contact);
  }

  public static getRelatedContactRef(person: Person, relatedId: string) {
    return person.contact_references[relatedId.toString()] ?? new ContactReference();
  }

  public static getRelatedRoles(person: Person, relatedId: string) {
    return person.roles[relatedId.toString()] ?? new Array<string>();
  }

  public static hasRole(person: Person, relatedId: string, role: string) {
    return Person.getRelatedRoles(person, relatedId).includes(role);
  }

  public setRoles(roles: string[], relatedId: string) {
    relatedId = relatedId.toString();
    this.roles[relatedId] = roles;
  }

  public static checkIsValid(person: Person, relatedId: string): boolean {
    // console.log('Index meta => ', person, relatedId);
    const { prename, name } = person;

    // Every person needs a prename
    if (empty(prename)) return false;

    // Every person needs a name
    if (empty(name)) return false;

    // Every person needs atleast 1 role
    const roles = Person.getRelatedRoles(person, relatedId);
    if (empty(roles)) return false;

    // Contact persons need a mail address
    const contact = Person.getRelatedContactRef(person, relatedId);
    const mail = contact?.mail ?? '';
    if (roles?.includes('CONTACT_PERSON') && empty(mail)) return false;

    // Every institution attached to a person needs to be valid
    // Institutions in persons should only be shallow references, so they don't
    // actually need to be valid
    /*const institutions = Person.getRelatedInstitutions(person, relatedId);
    if (institutions.find(i => !Institution.checkIsValid(i, relatedId))) return false;*/

    return true;
  }
}

class Institution implements IInstitution {
  _id: string = getObjectId();

  name = '';
  university = '';

  roles: IRelatedMap<string[]> = {};
  notes: IRelatedMap<string> = {};
  addresses: IRelatedMap<Address> = {};

  constructor(obj: Partial<IInstitution> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      switch (key) {
        case 'addresses':
          for (const [id, addr] of Object.entries(value as IRelatedMap<Address>)) {
            if (!addr) continue;
            this.setAddress(addr, id);
          }
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  public setAddress(inst: IAddress, relatedId: string) {
    relatedId = relatedId.toString();
    this.addresses[relatedId] = new Address(inst);
  }

  public setRoles(roles: string[], relatedId: string) {
    relatedId = relatedId.toString();
    this.roles[relatedId] = roles;
  }

  public static getMostRecentAddress(inst: Institution) {
    let mostRecent: Address | undefined;
    for (const address of Object.values(inst.addresses)) {
      if (!address) continue;
      const patched = new Address(address);
      if (!Address.checkIsValid(address)) continue;
      if (patched.creation_date > (mostRecent?.creation_date ?? 0)) mostRecent = patched;
    }
    return mostRecent ? mostRecent : new Address();
  }

  public static getValidAddresses(inst: Institution) {
    const map = new Map<string, Address>();
    for (const address of Object.values(inst.addresses)) {
      if (!address) continue;
      const patched = new Address(address);
      if (!Address.checkIsValid(address)) continue;
      map.set(patched._id.toString(), patched);
    }
    return Array.from(map.values());
  }

  public static getRelatedAddress(inst: Institution, relatedId: string) {
    return inst.addresses[relatedId.toString()] ?? new Address();
  }

  public static getRelatedRoles(inst: Institution, relatedId: string) {
    return inst.roles[relatedId.toString()] ?? [];
  }

  public static hasRole(inst: Institution, relatedId: string, role: string) {
    return Institution.getRelatedRoles(inst, relatedId).includes(role);
  }

  public static checkIsValid(inst: Institution, relatedId: string): boolean {
    // Every institution needs a name
    if (empty(inst.name)) return false;

    relatedId = relatedId.toString();
    // Every institution needs atleast 1 role
    const roles = Institution.getRelatedRoles(inst, relatedId);
    if (empty(roles)) return false;

    // Every institution needs a valid address
    const address = Institution.getRelatedAddress(inst, relatedId);
    if (!Address.checkIsValid(address)) return false;

    return true;
  }
}

class Tag implements ITag {
  _id: string = getObjectId();

  value = '';

  constructor(obj: Partial<ITag> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get isValid() {
    return Tag.checkIsValid(this);
  }

  public static checkIsValid(tag: ITag): boolean {
    if (empty(tag.value)) return false;

    return true;
  }
}

class Address implements IAddress {
  _id: string = getObjectId();

  building = '';
  number = '';
  street = '';
  postcode = '';
  city = '';
  country = '';
  // Internal & only used to sort addresses
  creation_date = Date.now();

  constructor(obj: Partial<IAddress> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get infoString() {
    const joined = [this.country, this.postcode, this.city, this.street, this.number, this.building]
      .filter(_ => _)
      .join(' ');
    return joined.trim().length === 0 ? 'Empty address' : joined;
  }

  get isValid() {
    return Address.checkIsValid(this);
  }

  public static checkIsValid(address: IAddress): boolean {
    if (empty(address.street)) return false;
    if (empty(address.postcode)) return false;
    if (empty(address.city)) return false;

    return true;
  }
}

class ContactReference implements IContact {
  _id: string = getObjectId();

  mail = '';
  phonenumber = '';
  note = '';

  // Internal & only used to sort contact references
  creation_date = Date.now();

  constructor(obj: Partial<IContact> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get infoString() {
    const joined = [this.mail, this.phonenumber, this.note].filter(_ => _).join(' ');
    return joined.trim().length === 0 ? 'Empty contact reference' : joined;
  }

  get isValid() {
    return ContactReference.checkIsValid(this);
  }

  public static checkIsValid(contact: IContact): boolean {
    if (empty(contact.mail)) return false;

    return true;
  }
}

class DimensionTuple implements IDimensionTuple {
  type = '';
  value = '';
  name = '';

  constructor(obj: Partial<IDimensionTuple> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get isValid() {
    return DimensionTuple.checkIsValid(this);
  }

  public static checkIsValid(dimension: IDimensionTuple): boolean {
    if (empty(dimension.type)) return false;
    if (empty(dimension.value)) return false;
    if (empty(dimension.name)) return false;

    return true;
  }
}

class TypeValueTuple implements ITypeValueTuple {
  type = '';
  value = '';

  constructor(obj: Partial<ITypeValueTuple> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get isValid() {
    return TypeValueTuple.checkIsValid(this);
  }

  public static checkIsValid(obj: ITypeValueTuple): boolean {
    if (empty(obj.type)) return false;
    if (empty(obj.value)) return false;

    return true;
  }
}

class CreationTuple implements ICreationTuple {
  technique = '';
  program = '';
  equipment = '';
  date = '';

  constructor(obj: Partial<ICreationTuple> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get isValid() {
    return CreationTuple.checkIsValid(this);
  }

  public static checkIsValid(obj: ICreationTuple): boolean {
    if (empty(obj.technique) && empty(obj.program) && empty(obj.equipment) && empty(obj.date))
      return false;

    return true;
  }
}

class DescriptionValueTuple implements IDescriptionValueTuple {
  description = '';
  value = '';

  constructor(obj: Partial<IDescriptionValueTuple> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  get isValid() {
    return DescriptionValueTuple.checkIsValid(this);
  }

  public static checkIsValid(obj: IDescriptionValueTuple, requireDescription = true): boolean {
    if (requireDescription && empty(obj.description)) return false;
    // if (empty(obj.value)) return false;

    return true;
  }
}

class PlaceTuple implements IPlaceTuple {
  name = '';
  geopolarea = '';
  address = new Address();

  constructor(obj: Partial<IPlaceTuple> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      switch (key) {
        case 'address':
          this.address = new Address(value as IAddress);
          break;
        default:
          (this as any)[key] = value;
      }
    }
  }

  public setAddress(address: Partial<IAddress>) {
    this.address = new Address(address);
  }

  get isValid() {
    return PlaceTuple.checkIsValid(this);
  }

  public static checkIsValid(place: IPlaceTuple): boolean {
    if (empty(place.name) && empty(place.geopolarea) && !Address.checkIsValid(place.address))
      return false;

    return true;
  }
}

class FileTuple implements IFile {
  file_name = '';
  file_link = '';
  file_size = 0;
  file_format = '';

  constructor(obj: Partial<IFile> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  public static checkIsValid(file: IFile): boolean {
    if (empty(file.file_name)) return false;
    if (empty(file.file_link)) return false;

    return true;
  }
}

type AnyEntity = DigitalEntity | PhysicalEntity;

export {
  Address,
  AnyEntity,
  ContactReference,
  CreationTuple,
  DescriptionValueTuple,
  DigitalEntity,
  DimensionTuple,
  FileTuple,
  Institution,
  Person,
  PhysicalEntity,
  PlaceTuple,
  Tag,
  TypeValueTuple,
};
