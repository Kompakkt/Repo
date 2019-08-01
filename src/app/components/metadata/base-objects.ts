/**
 * This file is responsible for creating elements of the metadata entity form
 * and for setting fields required for validation.
 * Every property of an object is actually an object containing:
 * required: boolean - whether the property is required to be non-default
 * value: string | Array - the actual value of the property
 *
 * required strings need to be defined and not length 0
 * required Arrays need to be defined and not length 0
 */

const requiredString = () => ({
  required: true,
  value: '',
});

const optionalString = () => ({
  required: false,
  value: '',
});

const requiredArray = () => ({
  required: true,
  value: new Array(),
});

const optionalArray = () => ({
  required: false,
  value: new Array(),
});

export const baseExternalId = () => ({
  type: requiredString(),
  value: requiredString(),
});

export const baseExternalLink = () => ({
  description: requiredString(),
  value: requiredString(),
});

export const basePlace = () => ({
  name: optionalString(),
  geopolarea: optionalString(),
  address: { required: false, value: baseAddress() },
});

export const baseDimension = () => ({
  type: requiredString(),
  value: requiredString(),
  name: requiredString(),
});

export const baseCreation = () => ({
  technique: requiredString(),
  program: requiredString(),

  equipment: optionalString(),
  date: optionalString(),
});

export const baseAddress = () => ({
  building: optionalString(),

  number: requiredString(),
  street: requiredString(),
  postcode: requiredString(),
  city: requiredString(),
  country: requiredString(),
});

export const basePerson = () => ({
  name: requiredString(),
  prename: requiredString(),
  mail: requiredString(),
  role: requiredArray(),

  note: optionalString(),
  phonenumber: optionalString(),
  institution: optionalArray(),
});

export const baseInstitution = () => ({
  name: requiredString(),
  address: { required: true, value: baseAddress() },
  role: requiredArray(),

  university: optionalString(),
  note: optionalString(),
});

export const baseEntity = () => ({
  _id: optionalString(),

  title: requiredString(),
  description: requiredString(),

  externalId: optionalArray(),
  externalLink: optionalArray(),
  metadata_files: optionalArray(),

  persons: requiredArray(),
  institutions: requiredArray(),
});

export const baseDigital = () => ({
  type: requiredString(),
  licence: requiredString(),

  discipline: optionalArray(),
  tags: optionalArray(),

  dimensions: optionalArray(),
  creation: optionalArray(),
  files: optionalArray(),

  statement: optionalString(),
  objecttype: optionalString(),

  phyObjs: optionalArray(),
});

export const basePhysical = () => ({
  place: { required: false, value: basePlace() },
  collection: optionalString(),
});
