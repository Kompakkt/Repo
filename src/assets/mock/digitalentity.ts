import { IDigitalEntity } from 'src/common';

export const mockDigitalEntity: IDigitalEntity = {
  _id: '5e78f5b7bd2980492e0373cd',
  biblioRefs: [
    {
      description: '',
      value:
        'Blom-Böer, I. 1999: Aegyptiaca Coloniensia. Katalog der ägyptischen Objekte des Seminars für Ägyptologie der Universität zu Köln, Köln, 23-27.',
    },
  ],
  creation: [
    {
      technique: 'Structure from Motion',
      program: 'Agisoft Photoscan',
      equipment: 'Nikon D200',
      date: '20.10.2017',
    },
  ],
  description:
    'The ushabti is 24,7 cm high, made of limestone and painted. It dates into the New Kingdom, 18th dynasty (ar. 1532-1292 BCE). The figurine was made for the deceased, in order to take over painful work in the afterworld.\n\nThis model was processed with the Structure from Motion technique provided by Agisoft Photoscan. The images were taken with the kind permission of the Egyptology department of the University of Cologne.',
  dimensions: [
    {
      type: 'cm',
      value: '24,7',
      name: 'Height',
    },
  ],
  discipline: ['Archaeology', 'Egyptology'],
  externalId: [],
  externalLink: [],
  files: [],
  institutions: [
    {
      _id: '5e46819f4dd0839e20685ef4',
      addresses: {
        '5e78f5b7bd2980492e0373cd': {
          _id: '6053f6d56f1b1ffe718a1481',
          building: '125',
          city: 'Cologne',
          country: 'Germany',
          creation_date: 1581679007040,
          number: '30',
          postcode: '50937',
          street: 'Kerpener Straße',
        },
      },
      name: 'Institute of Archaeology',
      notes: {},
      roles: {
        '5e78f5b7bd2980492e0373cd': ['CREATOR', 'EDITOR', 'DATA_CREATOR', 'CONTACT_PERSON'],
      },
      university: 'University of Cologne',
    },
  ],
  licence: 'BYNCND',
  metadata_files: [],
  objecttype: 'model',
  other: [],
  persons: [
    {
      _id: '5e4681d54dd0839e20685ef5',
      contact_references: {
        '5e78f5b7bd2980492e0373cd': {
          _id: '6053f6d56f1b1ffe718a171f',
          creation_date: 1581679061881,
          mail: 's.hageneuer@uni-koeln.de',
          note: '',
          phonenumber: '+49-(0)221-470 5228',
        },
      },
      institutions: {
        '5e78f5b7bd2980492e0373cd': [
          {
            _id: '5e46819f4dd0839e20685ef4',
            addresses: {
              '5e78f5b7bd2980492e0373cd': {
                _id: '6053f6d56f1b1ffe718a1481',
                building: '125',
                city: 'Cologne',
                country: 'Germany',
                creation_date: 1581679007040,
                number: '30',
                postcode: '50937',
                street: 'Kerpener Straße',
              },
            },
            name: 'Institute of Archaeology',
            notes: {},
            roles: {
              '5e78f5b7bd2980492e0373cd': ['CREATOR', 'EDITOR', 'DATA_CREATOR', 'CONTACT_PERSON'],
            },
            university: 'University of Cologne',
          },
        ],
      },
      name: 'Hageneuer',
      prename: 'Sebastian',
      roles: {
        '5e78f5b7bd2980492e0373cd': [
          'RIGHTS_OWNER',
          'CREATOR',
          'EDITOR',
          'DATA_CREATOR',
          'CONTACT_PERSON',
        ],
      },
    },
  ],
  phyObjs: [],
  statement: '',
  tags: [
    {
      _id: '5e4682271ba8f3627ab03118',
      value: 'Archaeology',
    },
    {
      _id: '5e78f84ee49048e628747ae6',
      value: 'Egyptology',
    },
    {
      _id: '5e78f84ee49048e628747aea',
      value: 'Uschabti',
    },
    {
      _id: '5e78f84ee49048e628747aee',
      value: 'Figurine',
    },
    {
      _id: '5e4682271ba8f3627ab03124',
      value: 'SfM',
    },
    {
      _id: '5e4682271ba8f3627ab0311c',
      value: 'Terracotta',
    },
  ],
  title: 'Ushabti in form of a mummy for Djehutihotep',
  type: '',
};
