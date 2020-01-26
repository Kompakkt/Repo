import { ICompilation, IEntity, IMetaDataDigitalEntity } from './interfaces';

export const isResolved = (obj: any): obj is IEntity => {
  return (
    obj &&
    obj.relatedDigitalEntity &&
    obj.relatedDigitalEntity.description !== undefined
  );
};

export const isEntity = (obj: any): obj is IEntity => {
  return obj && obj.mediaType !== undefined && obj.settings !== undefined;
};

export const isCompilation = (obj: any): obj is ICompilation => {
  return (
    obj && obj.entities && Array.isArray(obj.entities) && obj.name !== undefined
  );
};
