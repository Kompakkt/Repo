import ObjectID from 'bson-objectid';
import {
  IAddress,
  IBaseEntityResolved,
  IContact,
  ICreationTuple,
  IDescriptionValueTuple,
  IDigitalEntityResolved,
  IDimensionTuple,
  IFile,
  IInstitutionResolved,
  IPersonResolved,
  IPhysicalEntityResolved,
  IPlaceTuple,
  ITag,
  ITypeValueTuple,
} from '@kompakkt/common';
import { isFreeLicence } from './licences';
import {
  applyWhen,
  required,
  SchemaPathTree,
  validate,
  validateTree,
  ValidationError,
} from '@angular/forms/signals';

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

export const entityHasRole = (
  { persons, institutions, _id }: IBaseEntityResolved,
  role: string,
): boolean => {
  return [...persons, ...institutions].some(a => a.roles[_id.toString()].includes(role));
};

const emptyBaseEntity = (): IBaseEntityResolved =>
  ({
    _id: getObjectId(),
    extensions: {},
    title: '',
    description: '',
    externalId: [],
    externalLink: [],
    biblioRefs: [],
    other: [],
    metadata_files: [],
    persons: [],
    institutions: [],
  }) satisfies IBaseEntityResolved;
export const isBaseEntityValid = (entity: IBaseEntityResolved): boolean => {
  // Every entity needs a title
  if (empty(entity.title)) return false;

  // Every entity needs a description
  if (empty(entity.description)) return false;

  // Every person of an entity needs to be valid
  if (entity.persons.some(p => !isPersonValid(p, entity._id))) return false;

  // Every institution of an entity needs to be valid
  if (entity.institutions.some(i => !isInstitutionValid(i, entity._id))) return false;

  // Any existing external identifier needs all fields filled
  if (emptyProps(entity.externalId)) return false;

  // Any existing external link needs all fields filled
  if (emptyProps(entity.externalLink)) return false;

  // Any existing bibliographic reference needs a value
  if (emptyProps(entity.biblioRefs, ['value'])) return false;

  // Any additional information added as 'other' needs all fields filled
  if (emptyProps(entity.other)) return false;

  // Any added metadata file needs correctly filled fields
  if (emptyProps(entity.metadata_files)) return false;

  return true;
};

export const emptyDigitalEntity = (): IDigitalEntityResolved =>
  ({
    ...emptyBaseEntity(),
    type: '',
    licence: '',
    licenceAttribution: '',
    discipline: [],
    tags: [],
    dimensions: [],
    creation: [],
    files: [],
    statement: '',
    objecttype: '',
    phyObjs: [],
  }) satisfies IDigitalEntityResolved;
export const isDigitalEntityValid = (entity: IDigitalEntityResolved): boolean => {
  if (!isBaseEntityValid(entity)) return false;

  const { persons, institutions, phyObjs } = entity;
  const combined = [...persons, ...institutions];

  // Either a person or an institution must be supplied per entity
  if (empty(combined)) return false;

  // Every entity needs atleast 1 rights owner person/institution
  if (!entityHasRole(entity, 'RIGHTS_OWNER')) return false;

  // Every entity needs atleast 1 contact person
  if (!entityHasRole(entity, 'CONTACT_PERSON')) return false;

  // Every physical entity needs to be valid
  if (phyObjs.some(p => !isPhysicalEntityValid(p))) return false;

  // Every digital entity needs a licence with attribution if neccessary
  if (!entity.licence || (!isFreeLicence(entity.licence) && !entity.licenceAttribution?.trim()))
    return false;

  return true;
};

export const FormFieldGroups = {
  General: 'General information',
  Licence: 'Licence',
  RelatedAgents: 'Related persons and institutions',
  Creation: 'Creation',
  Identifiers: 'External Identifiers',
  Links: 'External Links',
  BiblioRefs: 'Bibliographic references',
  MetadataFiles: 'Metadata files',
  ReferenceObject: 'Reference object',
} as const;
export type FormFieldGroupsKeys = keyof typeof FormFieldGroups;
export type FormFieldGroupsValues = (typeof FormFieldGroups)[FormFieldGroupsKeys];
export const isFormFieldGroupValue = (key: string): key is FormFieldGroupsValues => {
  return (Object.values(FormFieldGroups) as string[]).includes(key);
};

export const validateDigitalEntity = (path: SchemaPathTree<IDigitalEntityResolved>) => {
  validateTree(path, ctx => {
    const value = ctx.value();
    const errors = new Array<ValidationError>();

    if (value.title.trim().length === 0)
      errors.push({
        kind: FormFieldGroups.General,
        message: 'Title is required',
      });

    if (value.description.trim().length === 0)
      errors.push({
        kind: FormFieldGroups.General,
        message: 'Description is required',
      });

    return errors;
  });

  validateTree(path, ctx => {
    const value = ctx.value();
    const licence = value.licence.trim();
    if (licence.length === 0)
      return {
        kind: FormFieldGroups.Licence,
        message: 'Licence is required',
      };

    if (!isFreeLicence(licence) && (value.licenceAttribution?.trim().length ?? 0) === 0)
      return {
        kind: FormFieldGroups.Licence,
        message: 'This licence requires an attribution',
      };
  });

  validateTree(path, ctx => {
    const value = ctx.value();
    const agents = [...value.persons, ...value.institutions];
    if (agents.length === 0)
      return {
        kind: FormFieldGroups.RelatedAgents,
        message: 'At least one agent is required',
      };

    const errors = new Array<ValidationError>();

    if (!entityHasRole(value, 'RIGHTS_OWNER'))
      errors.push({
        kind: FormFieldGroups.RelatedAgents,
        message: 'At least one rights owner is required',
      });

    if (!entityHasRole(value, 'CONTACT_PERSON'))
      errors.push({
        kind: FormFieldGroups.RelatedAgents,
        message: 'At least one contact person is required',
      });

    return errors;
  });

  validateTree(path, ctx => {
    const value = ctx.value().phyObjs.at(0);
    if (!value) return;
    const allEmpty = empty(value.title) && empty(value.description) && empty(value.place.name);
    if (allEmpty) return;
    const errors = new Array<ValidationError>();
    if (value.title.trim().length === 0)
      errors.push({
        kind: FormFieldGroups.ReferenceObject,
        message: 'Title is required',
      });

    if (value.description.trim().length === 0)
      errors.push({
        kind: FormFieldGroups.ReferenceObject,
        message: 'Description is required',
      });

    if (value.place.name.trim().length === 0)
      errors.push({
        kind: FormFieldGroups.ReferenceObject,
        message: 'Place requires at least a name',
      });

    return errors;
  });
};

export const emptyPhysicalEntity = (): IPhysicalEntityResolved =>
  ({
    ...emptyBaseEntity(),
    place: {
      name: '',
      geopolarea: '',
      address: {
        _id: getObjectId(),
        building: '',
        city: '',
        country: '',
        number: '',
        postcode: '',
        street: '',
        creation_date: Date.now(),
      },
    },
    collection: '',
    dimensions: [],
  }) satisfies IPhysicalEntityResolved;
export const isPhysicalEntityValid = (
  entity: IPhysicalEntityResolved,
  allowEmpty = true,
): boolean => {
  const { title, description, place } = entity;
  const allEmpty = empty(title) && empty(description) && empty(place.name);
  const someEmpty = empty(title) || empty(description) || empty(place.name);

  // Untouched
  if (allEmpty && allowEmpty) return true;

  // Touched
  if (someEmpty) return false;
  if (!isBaseEntityValid(entity)) return false;

  return true;
};

export const emptyPerson = (): IPersonResolved =>
  ({
    _id: getObjectId(),
    prename: '',
    name: '',
    roles: {},
    institutions: {},
    contact_references: {},
  }) satisfies IPersonResolved;
export const isPersonValid = (person: IPersonResolved, entityId: string) => {
  const { prename, name } = person;

  // Every person needs a prename
  if (empty(prename)) return false;

  // Every person needs a name
  if (empty(name)) return false;

  // Every person needs atleast 1 role
  const roles = person.roles[entityId] ?? [];
  if (empty(roles)) return false;

  // Contact persons need a mail address
  const contact = person.contact_references[entityId] as IContact | undefined;
  const mail = contact?.mail ?? '';
  if (roles?.includes('CONTACT_PERSON') && empty(mail)) return false;

  // Every institution attached to a person needs to be valid
  // Institutions in persons should only be shallow references, so they don't
  // actually need to be valid
  /*const institutions = Person.getRelatedInstitutions(person, entityId);
  if (institutions.find(i => !Institution.checkIsValid(i, entityId))) return false;*/

  return true;
};

const getMostRecentOf = <T extends { creation_date: number }>(
  agent: IPersonResolved | IInstitutionResolved,
  field: 'contact_references' | 'addresses',
): T | undefined => {
  const validityCheck = field === 'contact_references' ? isContactRefValid : isAddressValid;
  let mostRecent: T | undefined;
  for (const obj of Object.values(agent[field])) {
    if (
      typeof obj !== 'object' ||
      obj === null ||
      !('creation_date' in obj) ||
      typeof obj.creation_date !== 'number'
    )
      continue;
    if (!validityCheck(obj as any)) continue;
    if (obj.creation_date > (mostRecent?.creation_date ?? 0)) mostRecent = obj as T;
  }
  return mostRecent;
};

export const getMostRecentContactRef = (person: IPersonResolved): IContact | undefined =>
  getMostRecentOf(person, 'contact_references');
export const getMostRecentAddress = (institution: IInstitutionResolved): IAddress | undefined =>
  getMostRecentOf(institution, 'addresses');

export const emptyInstitution = (): IInstitutionResolved =>
  ({
    _id: getObjectId(),
    name: '',
    university: '',
    roles: {},
    notes: {},
    addresses: {},
  }) satisfies IInstitutionResolved;
export const isInstitutionValid = (institution: IInstitutionResolved, entityId: string) => {
  // Every institution needs a name
  if (empty(institution.name)) return false;

  // Every institution needs atleast 1 role
  const roles = institution.roles[entityId] ?? [];
  if (empty(roles)) return false;

  // Every institution needs a valid address
  const address = institution.addresses[entityId] as IAddress | undefined;
  if (!address || !isAddressValid(address)) return false;

  return true;
};

export const emptyTag = (): ITag =>
  ({
    _id: getObjectId(),
    value: '',
  }) satisfies ITag;
export const isTagValid = (tag: ITag): boolean => tag.value.trim().length > 0;

export const emptyAddress = (): IAddress =>
  ({
    _id: getObjectId(),
    building: '',
    number: '',
    street: '',
    postcode: '',
    city: '',
    country: '',
    creation_date: Date.now(),
  }) satisfies IAddress;
export const formatAddress = (address: IAddress) => {
  const lines = [
    [address.country],
    [address.postcode, address.city],
    [address.street, address.number],
    [address.building],
  ]
    .map(s => s.join(' ').trim())
    .filter(_ => _);
  return lines.every(line => line.length === 0) ? 'Empty address' : lines.join('\n');
};
export const isAddressValid = (address: IAddress): boolean => {
  if (empty(address.street)) return false;
  if (empty(address.postcode)) return false;
  if (empty(address.city)) return false;
  return true;
};

export const emptyContactRef = (): IContact =>
  ({
    _id: getObjectId(),
    mail: '',
    phonenumber: '',
    note: '',
    creation_date: Date.now(),
  }) satisfies IContact;
export const formatContactRef = (ref: IContact) => {
  const joined = [ref.mail, ref.phonenumber, ref.note].filter(_ => _).join(' ');
  return joined.trim().length === 0 ? 'Empty contact reference' : joined;
};
export const isContactRefValid = (ref: IContact): boolean => {
  if (empty(ref.mail)) return false;
  return true;
};

export const emptyTypeValueTuple = (): ITypeValueTuple =>
  ({
    type: '',
    value: '',
  }) satisfies ITypeValueTuple;
export const isTypeValueTupleValid = (tuple: ITypeValueTuple) => {
  if (empty(tuple.type)) return false;
  if (empty(tuple.value)) return false;
  return true;
};

export const emptyDimensionTuple = (): IDimensionTuple =>
  ({
    ...emptyTypeValueTuple(),
    name: '',
  }) satisfies IDimensionTuple;
export const isDimensionTupleValid = (tuple: IDimensionTuple) => {
  if (!isTypeValueTupleValid(tuple)) return false;
  if (empty(tuple.name)) return false;
  return true;
};

export const emptyCreationTuple = (): ICreationTuple =>
  ({
    technique: '',
    program: '',
    equipment: '',
    date: '',
  }) satisfies ICreationTuple;
export const isCreationTupleValid = (tuple: ICreationTuple): boolean => {
  if (empty(tuple.technique) && empty(tuple.program) && empty(tuple.equipment) && empty(tuple.date))
    return false;
  return true;
};

export const emptyDescriptionValueTuple = (): IDescriptionValueTuple =>
  ({
    description: '',
    value: '',
  }) satisfies IDescriptionValueTuple;
export const isDescriptionValueTupleValid = (
  tuple: IDescriptionValueTuple,
  requireDescription = true,
) => {
  if (requireDescription && empty(tuple.description)) return false;
  // if (empty(obj.value)) return false;

  return true;
};

export const emptyPlaceTuple = (): IPlaceTuple => ({
  name: '',
  geopolarea: '',
  address: emptyAddress(),
});
export const isPlaceTupleValid = (tuple: IPlaceTuple) => {
  if (empty(tuple.name) && empty(tuple.geopolarea) && !isAddressValid(tuple.address)) return false;
  return true;
};

export const emptyFileTuple = (): IFile =>
  ({
    file_name: '',
    file_link: '',
    file_size: 0,
    file_format: '',
  }) satisfies IFile;
export const isFileTupleValid = (tuple: IFile) => {
  if (empty(tuple.file_name)) return false;
  if (empty(tuple.file_link)) return false;
  return true;
};

export type AnyEntity = IDigitalEntityResolved | IPhysicalEntityResolved;
