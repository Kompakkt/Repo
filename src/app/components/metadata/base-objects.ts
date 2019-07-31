export const baseDimension = () => ({
  type: '',
  value: '',
  name: '',
});

export const baseCreation = () => ({
  technique: '',
  program: '',
  equipment: '',
  date: '',
});

export const baseAddress = () => ({
  building: '',
  number: '',
  street: '',
  postcode: '',
  city: '',
  country: '',
});

export const basePerson = () => ({
  name: '',
  prename: '',
  mail: '',
  role: new Array(),
  note: '',
  phonenumber: '',
  // TODO: Nest institution
  // institution:
});

export const baseInstitution = () => ({
  name: '',
  address: { ...baseAddress() },
  university: '',
  role: new Array(),
  note: '',
});

export const baseEntity = () => ({
  _id: '',
  title: '',
  description: '',
  // Can occur multiple times
  externalId: new Array(),
  externalLink: new Array(),
  metadata_files: new Array(),

  persons: new Array(),
  institutions: new Array(),
});

export const baseDigital = () => ({
  type: '',
  licence: '',
  discipline: new Array(),
  tags: new Array(),
  objecttype: '',

  dimensions: new Array(),
  creation: new Array(),
  files: new Array(),
  statement: '',

  phyObjs: new Array(),
});

export const basePhysical = () => ({
  place: {
    name: '',
    geopolarea: '',
    address: { ...baseAddress() },
  },
  collection: '',
});
