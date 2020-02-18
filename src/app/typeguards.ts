import {
  ICompilation,
  IEntity,
  IMetaDataDigitalEntity,
  IMetaDataPerson,
  IMetaDataInstitution,
  IMetaDataTag,
  IMetaDataPhysicalEntity,
  IUnresolvedEntity,
  IGroup,
} from './interfaces';

export const isResolved = (obj: any): obj is IEntity => {
  return (
    obj &&
    obj.relatedDigitalEntity &&
    obj.relatedDigitalEntity.description !== undefined
  );
};

export const isUnresolved = (
  obj: IUnresolvedEntity | any,
): obj is IUnresolvedEntity => {
  return Object.keys(obj).length === 1 && obj._id !== undefined;
};

export const isGroup = (obj: IGroup | any): obj is IGroup => {
  return (
    obj &&
    obj.name !== undefined &&
    obj.creator !== undefined &&
    obj.owners !== undefined &&
    obj.members !== undefined
  );
};

export const isEntity = (obj: IEntity | any): obj is IEntity => {
  return obj && obj.mediaType !== undefined && obj.settings !== undefined;
};

export const isCompilation = (obj: ICompilation | any): obj is ICompilation => {
  return (
    obj && obj.entities && Array.isArray(obj.entities) && obj.name !== undefined
  );
};

export const isPerson = (
  obj: IMetaDataPerson | any,
): obj is IMetaDataPerson => {
  return obj && obj.name !== undefined && obj.prename !== undefined;
};

export const isInstitution = (
  obj: IMetaDataInstitution | any,
): obj is IMetaDataInstitution => {
  return obj && obj.name !== undefined && obj.addresses !== undefined;
};

export const isTag = (obj: IMetaDataTag | any): obj is IMetaDataTag => {
  return obj && obj.value !== undefined;
};

export const isMetadataEntity = (
  obj: IMetaDataDigitalEntity | IMetaDataPhysicalEntity | any,
): obj is IMetaDataDigitalEntity | IMetaDataPhysicalEntity => {
  return (
    obj &&
    obj.title !== undefined &&
    obj.description !== undefined &&
    obj.persons !== undefined &&
    obj.institutions !== undefined
  );
};
