/* Workaround for
 * TSLint: Expression is always true */
export interface IInvalid {
  [key: string]: any | undefined;
}

// Metadata related
export interface IUnresolvedEntity {
  _id: string;
}

interface IMetaDataAddress {
  building: string;
  number: string;
  street: string;
  postcode: string;
  city: string;
  country: string;

  // Internal & only used to sort addresses
  creation_date: number;
}

interface IMetaDataContactReference {
  mail: string;
  phonenumber: string;
  note: string;

  // Internal & only used to sort contact references
  creation_date: number;
}

export interface IMetaDataPerson {
  _id: string;

  prename: string;
  name: string;

  // relatedEntityId refers to the _id
  // of the digital or physical entity
  // a person refers to
  roles: {
    [relatedEntityId: string]: string[];
  };
  institutions: {
    [relatedEntityId: string]: IMetaDataInstitution[];
  };
  contact_references: {
    [relatedEntityId: string]: IMetaDataContactReference;
  };
}

export interface IMetaDataInstitution {
  _id: string;

  name: string;
  university: string;

  // relatedEntityId refers to the _id
  // of the digital or physical entity
  // a person refers to
  roles: {
    [relatedEntityId: string]: string[];
  };
  notes: {
    [relatedEntityId: string]: string;
  };
  addresses: {
    [relatedEntityId: string]: IMetaDataAddress;
  };
}

export interface IMetaDataTag {
  _id: string;
  value: string;
}

interface IMetaDataBaseEntity {
  _id: string;
  title: string;
  description: string;
  externalId: Array<{
    type: string;
    value: string;
  }>;
  externalLink: Array<{
    description: string;
    value: string;
  }>;

  metadata_files: IFile[];

  persons: IMetaDataPerson[];
  institutions: IMetaDataInstitution[];
}

export interface IMetaDataPhysicalEntity extends IMetaDataBaseEntity {
  place: {
    name: string;
    geopolarea: string;
    address: IMetaDataAddress;
  };
  collection: string;
}

export interface IMetaDataDigitalEntity extends IMetaDataBaseEntity {
  type: string;
  licence: string;

  discipline: string[];
  tags: IMetaDataTag[] | string[];

  dimensions: Array<{
    type: string;
    value: string;
    name: string;
  }>;
  creation: Array<{
    technique: string;
    program: string;
    equipment: string;
    date: string;
  }>;
  files: IFile[];

  statement: string;
  objecttype: string;

  phyObjs: IMetaDataPhysicalEntity[];
}

// User related
export interface IUserData {
  fullname: string;
  username: string;
  _id: string;
}

export interface ILoginData {
  username: string;
  password: string;
}

export interface ILDAPData {
  _id: string;
  username: string;
  sessionID: string;
  fullname: string;
  prename: string;
  surname: string;
  rank: string;
  mail: string;
  role: string;

  data: {
    [key: string]: Array<string | null | IEntity | IAnnotation | ICompilation>;
  };
}

export interface IGroup {
  name: string;
  creator: IUserData;
  owners: IUserData[];
  members: IUserData[];
}

// Annotation related
export interface IAnnotation {
  _id: string;
  validated: boolean;

  identifier: string;
  ranking: number;
  creator: IAgent;
  created: string;
  generator: IAgent;
  generated?: string;
  motivation: string;
  lastModificationDate?: string;
  lastModifiedBy: IAgent;

  body: IBody;
  target: ITarget;
}

export interface IAgent {
  type: string;
  name: string;
  _id: string;
  homepage?: string;
}

export interface IBody {
  type: string;
  content: IContent;
}

export interface IContent {
  type: string;
  title: string;
  description: string;
  link?: string;
  relatedPerspective: ICameraPerspective;
  [key: string]: any;
}

export interface ICameraPerspective {
  cameraType: string;
  position: IVector;
  target: IVector;
  preview: string;
}

export interface IVector {
  x: number;
  y: number;
  z: number;
}

export interface ITarget {
  source: ISource;
  selector: ISelector;
}

export interface ISource {
  link?: string;
  relatedEntity: string;
  relatedCompilation?: string;
}

export interface ISelector {
  referencePoint: IVector;
  referenceNormal: IVector;
}

// Entity related
export interface IFile {
  file_name: string;
  file_link: string;
  file_size: number;
  file_format: string;
}

export interface IEntity {
  _id: string;
  annotationList: Array<IAnnotation | null>;
  name: string;
  files: IFile[] | null;
  finished: boolean;
  ranking?: number;
  relatedDigitalEntity?: IUnresolvedEntity | IMetaDataDigitalEntity;
  relatedEntityOwners?: IRelatedOwner[];
  online: boolean;
  isExternal?: boolean;
  externalService?: string;
  mediaType: string;
  dataSource: {
    isExternal: boolean;
    service?: string;
  };
  settings?: {
    preview?: string;
    cameraPositionInitial?: any;
    background?: any;
    lights?: any;
    rotation?: any;
    scale?: any;
  };
  processed?: {
    time?: {
      start: string;
      end: string;
      total: string;
    };
    low?: string;
    medium?: string;
    high?: string;
    raw?: string;
  };
}

interface IRelatedOwner {
  _id: string;
  username: string;
  fullname: string;
}

export interface ICompilation {
  _id: string;
  name: string;
  description: string;
  relatedOwner?: IRelatedOwner;
  password?: string;
  entities: Array<IEntity | null | IUnresolvedEntity>;
  annotationList: Array<IAnnotation | null>;

  whitelist: {
    enabled: boolean;
    persons: IUserData[];
    groups: IGroup[];
  };
}

// Socket related
export interface ISocketAnnotation {
  annotation: any;
  user: ISocketUser;
}

export interface ISocketMessage {
  message: string;
  user: ISocketUser;
}

export interface ISocketUser {
  _id: string;
  socketId: string;
  username: string;
  fullname: string;
  room: string;
}

export interface ISocketUserInfo {
  user: ISocketUser;
  annotations: any[];
}

export interface ISocketChangeRoom {
  newRoom: string;
  annotations: any[];
}

export interface ISocketChangeRanking {
  user: ISocketUser;
  oldRanking: any[];
  newRanking: any[];
}

export interface ISocketRoomData {
  requester: ISocketUserInfo;
  recipient: string;
  info: ISocketUserInfo;
}

// Misc
export interface ISizedEvent {
  width: number;
  height: number;
}

export interface IServerResponse {
  message?: string;
  status?: string;
}
