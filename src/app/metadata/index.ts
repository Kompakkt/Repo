import {
  IDigitalEntity,
  IPhysicalEntity,
  IBaseEntity,
  IPerson,
  IInstitution,
  ITag,
  IContact,
  IAddress,
  ITypeValueTuple,
  IDescriptionValueTuple,
  IDimensionTuple,
  ICreationTuple,
  IFile,
  IPlaceTuple,
  IRelatedMap,
  ObjectId,
} from '~common/interfaces';

const getObjectId = () => new ObjectId().toString();

const empty = (value: string | number | any[]): boolean =>
  typeof value === 'number' ? value <= 0 : value?.length === 0 ?? true;
const emptyProps = (arr: any[], props?: string[]) =>
  !empty(arr) &&
  arr.find(el => {
    for (const prop of props ?? Object.keys(el)) if (empty(el[prop])) return true;
    return false;
  });

class BaseEntity implements IBaseEntity {
  _id: string | ObjectId = getObjectId();

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

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore: "Abstract methods can only appear within an abstract class"
  abstract get isPhysical(): boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore: "Abstract methods can only appear within an abstract class"
  abstract get isDigital(): boolean;
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

  public static checkIsValid(entity: DigitalEntity): boolean {
    if (!BaseEntity.checkIsValid(entity)) return false;

    const { persons, institutions, _id, dimensions, creation, phyObjs } = entity;
    const combined = [...persons, ...institutions];

    // Either a person or an institution must be supplied per entity
    if (empty(combined)) return false;

    // Every entity needs atleast 1 rights owner person/institution
    if (!persons.find(p => Person.hasRole(p, _id, 'RIGHTS_OWNER')))
      if (!institutions.find(i => Institution.hasRole(i, _id, 'RIGHTS_OWNER'))) return false;

    // Every entity needs atleast 1 contact person
    const contact = persons.find(p => Person.hasRole(p, _id, 'CONTACT_PERSON'));
    if (!contact) return false;

    // Any added dimension needs all fields filled
    if (emptyProps(dimensions)) return false;

    // Any added creation information needs a technique and program
    if (emptyProps(creation, ['technique', 'program'])) return false;

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
  place: IPlaceTuple = {
    name: '',
    geopolarea: '',
    address: new Address(),
  };
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
          const place = value as IPlaceTuple;
          this.place = {
            ...place,
            address: new Address(place.address),
          };
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any)[key] = value;
      }
    }
  }

  public setAddress(address: Partial<IAddress>) {
    this.place.address = new Address(address);
  }

  public static checkIsValid(entity: PhysicalEntity): boolean {
    if (!BaseEntity.checkIsValid(entity)) return false;

    const { name, geopolarea, address } = entity.place;
    if (empty(name) && empty(geopolarea) && !Address.checkIsValid(address)) return false;

    return true;
  }

  get isPhysical() {
    return true;
  }

  get isDigital() {
    return false;
  }
}

class Person implements IPerson {
  _id: string | ObjectId = getObjectId();

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

  public addInstitution(inst: IInstitution, relatedId: string | ObjectId) {
    relatedId = relatedId.toString();
    if (!this.institutions[relatedId]) this.institutions[relatedId] = new Array<Institution>();
    (this.institutions[relatedId] as Institution[]).push(new Institution(inst));
  }

  public static getRelatedInstitutions(person: Person, relatedId: string | ObjectId) {
    return person.institutions[relatedId.toString()] ?? new Array<Institution>();
  }

  public setContactRef(contact: IContact, relatedId: string | ObjectId) {
    this.contact_references[relatedId.toString()] = new ContactReference(contact);
  }

  public static getRelatedContactRef(person: Person, relatedId: string | ObjectId) {
    return person.contact_references[relatedId.toString()] ?? new ContactReference();
  }

  public static getRelatedRoles(person: Person, relatedId: string | ObjectId) {
    return person.roles[relatedId.toString()] ?? new Array<string>();
  }

  public static hasRole(person: Person, relatedId: string | ObjectId, role: string) {
    return Person.getRelatedRoles(person, relatedId).includes(role);
  }

  public static checkIsValid(person: Person, relatedId: string | ObjectId): boolean {
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
    const institutions = Person.getRelatedInstitutions(person, relatedId);
    if (institutions.find(i => !Institution.checkIsValid(i, relatedId))) return false;

    return true;
  }
}

class Institution implements IInstitution {
  _id: string | ObjectId = getObjectId();

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

  public setAddress(inst: IAddress, relatedId: string | ObjectId) {
    relatedId = relatedId.toString();
    this.addresses[relatedId] = new Address(inst);
  }

  public static getRelatedAddress(inst: Institution, relatedId: string | ObjectId) {
    return inst.addresses[relatedId.toString()] ?? new Address();
  }

  public static getRelatedRoles(inst: Institution, relatedId: string | ObjectId) {
    return inst.roles[relatedId.toString()] ?? [];
  }

  public static hasRole(inst: Institution, relatedId: string | ObjectId, role: string) {
    return Institution.getRelatedRoles(inst, relatedId).includes(role);
  }

  public static checkIsValid(inst: Institution, relatedId: string | ObjectId): boolean {
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
  _id: string | ObjectId = getObjectId();

  value = '';

  constructor(obj: Partial<ITag> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }
}

class Address implements IAddress {
  _id: string | ObjectId = getObjectId();

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

  public static checkIsValid(address: Address): boolean {
    if (empty(address.street)) return false;
    if (empty(address.postcode)) return false;
    if (empty(address.city)) return false;
    if (empty(address.country)) return false;

    return true;
  }
}

class ContactReference implements IContact {
  _id: string | ObjectId = getObjectId();

  mail = '';
  phonenumber = '';
  note = '';

  // Internal & only used to sort contact references
  creation_date = Date.now();

  constructor(obj: Partial<ContactReference> = {}) {
    for (const [key, value] of Object.entries(obj)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key] = value;
    }
  }

  public static checkIsValid(contact: ContactReference): boolean {
    if (empty(contact.mail)) return false;

    return true;
  }
}

export { DigitalEntity, PhysicalEntity, Institution, Person, Tag, Address, ContactReference };
