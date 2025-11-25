import {
  required,
  requiredError,
  SchemaFn,
  validate,
  validateTree,
  ValidationError,
} from '@angular/forms/signals';
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

const createBaseEntity = (): IBaseEntity<Record<string, unknown>, true> => ({
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
});

const baseEntitySchema: SchemaFn<IBaseEntity<Record<string, unknown>, true>> = fieldPath => {
  required(fieldPath.title, { message: 'Title is required' });
  required(fieldPath.description, { message: 'Description is required' });

  validate(fieldPath, ctx => {
    const { persons, institutions, _id } = ctx.value();
    const errors = new Array<ValidationError>();
    const combined = [...persons, ...institutions];

    if (combined.length === 0) {
      errors.push(requiredError({ message: 'At least one person or institution is required' }));
    }

    return errors.length > 0 ? errors : undefined;
  });

  validateTree(fieldPath.persons, ctx => {
    const persons = ctx.value();
    const errors = new Array<ValidationError>();
    for (const person of persons) {
      if (person.prename.length === 0) {
        errors.push(requiredError({ message: 'Prename is required' }));
      }
      if (person.name.length === 0) {
        errors.push(requiredError({ message: 'Name is required' }));
      }
    }
    return errors.length > 0 ? errors : undefined;
  });

  validateTree(fieldPath.institutions, ctx => {});
};

export const createDigitalEntity = (): IDigitalEntity<Record<string, unknown>, true> => ({
  ...createBaseEntity(),
  type: '',
  licence: '',
  discipline: [],
  tags: [],
  dimensions: [],
  creation: [],
  files: [],
  statement: '',
  objecttype: '',
  phyObjs: [],
});

export const digitalEntitySchema: SchemaFn<
  IDigitalEntity<Record<string, unknown>, true>
> = fieldPath => {
  baseEntitySchema(fieldPath);

  validate(fieldPath, ctx => {
    const { persons, institutions, _id } = ctx.value();
    const errors = new Array<ValidationError>();
    const combined = [...persons, ...institutions];

    if (
      !combined.some(c => {
        const roles = c.roles[_id] ?? [];
        return roles.includes('RIGHTS_OWNER');
      })
    ) {
      errors.push(
        requiredError({
          message: 'At least one rights owner is required in persons or institutions',
        }),
      );
    }

    if (
      !combined.some(c => {
        const roles = c.roles[_id] ?? [];
        return roles.includes('CONTACT_PERSON');
      })
    ) {
      errors.push(
        requiredError({
          message:
            'At least one contact person or institution is required in persons or institutions',
        }),
      );
    }

    return errors.length > 0 ? errors : undefined;
  });
};

export const createPhysicalEntity = (): IPhysicalEntity<Record<string, unknown>, true> => ({
  ...createBaseEntity(),
  place: createPlaceTuple(),
  collection: '',
});

export const createPerson = (): IPerson<true> => ({
  _id: getObjectId(),
  prename: '',
  name: '',
  roles: {},
  institutions: {},
  contact_references: {},
});

export const createInstitution = (): IInstitution<true> => ({
  _id: getObjectId(),
  name: '',
  university: '',
  roles: {},
  notes: {},
  addresses: {},
});

export const createTag = (): ITag => ({
  _id: getObjectId(),
  value: '',
});

export const createAddress = (): IAddress => ({
  _id: getObjectId(),
  building: '',
  number: '',
  street: '',
  postcode: '',
  city: '',
  country: '',
  creation_date: Date.now(),
});

export const createContactReference = (): IContact => ({
  _id: getObjectId(),
  mail: '',
  phonenumber: '',
  note: '',
  creation_date: Date.now(),
});

export const createDimensionTuple = (): IDimensionTuple => ({
  type: '',
  value: '',
  name: '',
});

export const createTypeValueTuple = (): ITypeValueTuple => ({
  type: '',
  value: '',
});

export const createCreationTuple = (): ICreationTuple => ({
  technique: '',
  program: '',
  equipment: '',
  date: '',
});

export const createDescriptionValueTuple = (): IDescriptionValueTuple => ({
  description: '',
  value: '',
});

export const createPlaceTuple = (): IPlaceTuple => ({
  name: '',
  geopolarea: '',
  address: createAddress(),
});

export const createFileTuple = (): IFile => ({
  file_name: '',
  file_link: '',
  file_size: 0,
  file_format: '',
});
