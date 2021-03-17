import { IMetaDataDigitalEntity, IMetaDataPhysicalEntity, IMetaDataBaseEntity } from '~interfaces';

class BaseEntity implements IMetaDataBaseEntity {}

class DigitalEntity extends BaseEntity implements IMetaDataDigitalEntity {}

class PhysicalEntity extends BaseEntity implements IMetaDataPhysicalEntity {}

export { DigitalEntity, PhysicalEntity };
