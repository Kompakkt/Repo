export const baseAddress = {
  building: '',
  number: '',
  street: '',
  postcode: '',
  city: '',
  country: '',
};

export const basePerson = {
  name: '',
  prename: '',
  mail: '',
  role: [],
  note: '',
  phonenumber: '',
  // TODO: Nest institution
  // institution:
};

export const baseInstitution = {
  name: '',
  address: { ...baseAddress },
  university: '',
  role: [],
  note: '',
};

export const baseEntity = {
  _id: '',
  title: '',
  description: '',
  // Can occur multiple times
  externalId: [],
  externalLink: [],
  metadata_files: [],

  persons: [],
  institutions: [],
}

export const baseDigital = {
  type: '',
  licence: '',
  discipline: [],
  tags: [],
  objecttype: '',

  dimensions: [],
  creation: [],
  files: [],
  statement: '',

  phyObjs: [],
}

export const basePhysical = {
  place: '',
  collection: '',
  address: { ...baseAddress }
}
