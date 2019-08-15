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

export const requiredString = () => ({
  required: true,
  value: '',
});

export const optionalString = () => ({
  required: false,
  value: '',
});

export const requiredArray = () => ({
  required: true,
  value: new Array(),
});

export const optionalArray = () => ({
  required: false,
  value: new Array(),
});

export const requiredObject = () => ({
  required: true,
  value: new Object({}),
});

export const optionalObject = () => ({
  required: false,
  value: new Object({}),
});

export const baseExternalId = () => ({
  type: requiredString(),
  value: requiredString(),
});

export const baseExternalLink = () => ({
  description: requiredString(),
  value: requiredString(),
});

export const baseBiblioRef = () => ({
  description: optionalString(),
  value: requiredString(),
});

export const baseOther = () => ({
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

  creation_date: { required: true, value: Date.now() },
});

export const baseTag = () => ({
  _id: optionalString(),
  value: requiredString(),
});

export const baseContactReference = () => ({
  mail: requiredString(),
  phonenumber: optionalString(),
  note: optionalString(),

  creation_date: { required: true, value: Date.now() },
});

export const basePerson = (relatedEntityId: string) => {
  const newPerson = {
    _id: optionalString(),

    prename: requiredString(),
    name: requiredString(),

    roles: requiredObject(),
    institutions: optionalObject(),
    contact_references: requiredObject(),
  };
  newPerson.roles.value[relatedEntityId] = requiredArray();
  newPerson.institutions.value[relatedEntityId] = optionalArray();
  newPerson.contact_references.value[relatedEntityId] = {
    required: true,
    value: { ...baseContactReference() },
  };
  return newPerson;
};

export const baseInstitution = (relatedEntityId: string) => {
  const newInstitution = {
    _id: optionalString(),

    name: requiredString(),
    university: optionalString(),

    addresses: requiredObject(),
    roles: requiredObject(),
    notes: optionalObject(),
  };
  newInstitution.addresses.value[relatedEntityId] = requiredObject();
  newInstitution.addresses.value[relatedEntityId].value = { ...baseAddress() };
  newInstitution.roles.value[relatedEntityId] = requiredArray();
  newInstitution.notes.value[relatedEntityId] = optionalString();
  return newInstitution;
};

export const baseEntity = () => ({
  _id: optionalString(),

  title: requiredString(),
  description: requiredString(),

  externalId: optionalArray(),
  externalLink: optionalArray(),
  biblioRefs: optionalArray(),
  other: optionalArray(),
  metadata_files: optionalArray(),

  persons: requiredArray(),
  institutions: requiredArray(),
});

export const baseDigital = () => ({
  type: optionalString(),
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
