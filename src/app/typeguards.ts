import { ICompilation, IEntity, IMetaDataDigitalEntity } from './interfaces';

export const isResolved = (obj: any): obj is IEntity => {
  return (
    obj !== undefined &&
    obj.relatedDigitalEntity !== undefined &&
    // obj.relatedDigitalEntity.title !== undefined &&
    obj.relatedDigitalEntity.description !== undefined
  );
};

export const isEntity = (obj: any): obj is IEntity => {
  return (
    obj !== undefined &&
    obj.mediaType !== undefined &&
    obj.settings !== undefined
  );
};

export const isCompilation = (obj: any): obj is ICompilation => {
  return (
    obj !== undefined && obj.entities !== undefined && obj.name !== undefined
  );
};
