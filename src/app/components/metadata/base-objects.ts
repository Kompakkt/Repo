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

import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

import {
  IMetaDataPerson,
  IMetaDataInstitution,
  IMetaDataDigitalEntity,
  IMetaDataPhysicalEntity,
  IMetaDataTag,
} from '../../interfaces';
import { ObjectIdService } from '../../services/object-id.service';
import { setMapping, getMapping } from '../../services/selected-id.service';

import {
  isEntity,
  isCompilation,
  isPerson,
  isInstitution,
  isTag,
  isMetadataEntity,
} from '../../typeguards';

const objectId = new ObjectIdService();

const optionalArray = () =>
  new FormArray(new Array<FormGroup>(), Validators.nullValidator);
const requiredArray = () =>
  new FormArray(new Array<FormGroup>(), Validators.required);

export const baseExternalId = () =>
  new FormGroup({
    type: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
  });

export const baseExternalLink = () =>
  new FormGroup({
    description: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
  });

export const baseBiblioRef = () =>
  new FormGroup({
    description: new FormControl(''),
    value: new FormControl('', Validators.required),
  });

export const baseOther = () =>
  new FormGroup({
    description: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
  });

export const baseDimension = () =>
  new FormGroup({
    type: new FormControl('', Validators.required),
    value: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
  });

export const baseCreation = () =>
  new FormGroup({
    technique: new FormControl('', Validators.required),
    program: new FormControl('', Validators.required),

    equipment: new FormControl(''),
    date: new FormControl(''),
  });

export const baseFile = () =>
  new FormGroup({
    file_name: new FormControl('', Validators.required),
    file_link: new FormControl('', Validators.required),
    file_size: new FormControl(0, Validators.min(1)),
    file_format: new FormControl('', Validators.required),
  });

export const baseAddress = (required = true) =>
  new FormGroup(
    {
      building: new FormControl('', null),

      number: new FormControl('', null),
      street: new FormControl('', required ? Validators.required : null),
      postcode: new FormControl('', required ? Validators.required : null),
      city: new FormControl('', required ? Validators.required : null),
      country: new FormControl('', required ? Validators.required : null),

      creation_date: new FormControl(Date.now(), Validators.required),
    },
    required ? Validators.required : null,
  );

export const baseTag = (existing?: IMetaDataTag) => {
  const tag = new FormGroup({
    _id: new FormControl(objectId.generateEntityId()),
    value: new FormControl('', Validators.required),
  });

  if (existing && isTag(existing)) {
    tag.patchValue(existing);
  }

  return tag;
};

export const baseContactReference = () =>
  new FormGroup({
    mail: new FormControl(''),
    phonenumber: new FormControl(''),
    note: new FormControl(''),

    creation_date: new FormControl(Date.now(), Validators.required),
  });

export const basePerson = (
  relatedEntityId: string,
  existing?: IMetaDataPerson,
) => {
  const person = new FormGroup(
    {
      _id: new FormControl(objectId.generateEntityId()),

      prename: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),

      roles: new FormGroup({}, Validators.nullValidator),
      institutions: new FormGroup({}, Validators.nullValidator),
      contact_references: new FormGroup({}, Validators.nullValidator),
    },
    pers_ctrl => {
      const {
        prename,
        name,
        _id,
        roles,
        contact_references,
      } = (pers_ctrl as FormGroup).controls;
      const role_arr_id = getMapping(_id.value, 'roles') || relatedEntityId;
      const role_arr = (roles as FormGroup).controls[role_arr_id];
      const con_ref_id =
        getMapping(_id.value, 'contact_references') || relatedEntityId;
      const con_ref = (contact_references as FormGroup).controls[con_ref_id];

      const errors: any = {};
      if (prename.value.length === 0) {
        errors['pers_pre'] = `Every person needs a prename`;
      }
      if (name.value.length === 0) {
        errors['pers_name'] = `Every person needs a name`;
      }
      if (!role_arr || (role_arr as FormArray).controls.length === 0) {
        errors['pers_role'] = `Every person needs atleast 1 role`;
      }

      if (
        role_arr &&
        (role_arr as FormArray).value.includes('CONTACT_PERSON') &&
        (!con_ref || (con_ref as FormGroup).controls.mail.value.length === 0)
      ) {
        errors['pers_con_ref'] = `Contact persons need a mail address`;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  );
  const contact_references = () =>
    person.controls.contact_references as FormGroup;
  const roles = () => person.controls.roles as FormGroup;
  const institutions = () => person.controls.institutions as FormGroup;

  contact_references().controls[relatedEntityId] = baseContactReference();
  institutions().controls[relatedEntityId] = optionalArray();
  roles().controls[relatedEntityId] = requiredArray();

  // Patch existing person
  if (existing && isPerson(existing)) {
    person.patchValue(existing);
    for (const id in existing.roles) {
      if (!existing.roles.hasOwnProperty(id)) continue;
      roles().controls[id] = optionalArray();
      existing.roles[id].forEach(role =>
        (roles().controls[id] as FormArray).push(new FormControl(role)),
      );
    }
    for (const id in existing.contact_references) {
      if (!existing.contact_references.hasOwnProperty(id)) continue;
      contact_references().controls[id] = baseContactReference();
      contact_references().controls[id].patchValue(
        existing.contact_references[id],
      );
    }
    if (existing.institutions[relatedEntityId]) {
      existing.institutions[relatedEntityId].forEach(inst =>
        (institutions().controls[relatedEntityId] as FormArray).push(
          baseInstitution(relatedEntityId, inst),
        ),
      );
    }
  }

  setMapping(person.value._id, 'contact_references', relatedEntityId);
  setMapping(person.value._id, 'roles', relatedEntityId);

  return person;
};

export const baseInstitution = (
  relatedEntityId: string,
  existing?: IMetaDataInstitution,
  roleRequired = true,
) => {
  const institution = new FormGroup(
    {
      _id: new FormControl(objectId.generateEntityId()),

      name: new FormControl('', Validators.required),
      university: new FormControl(''),

      addresses: new FormGroup({}, Validators.nullValidator),
      roles: new FormGroup({}, Validators.nullValidator),
      notes: new FormGroup({}, Validators.nullValidator),
    },
    inst_ctrl => {
      const { _id, name, addresses, roles } = (inst_ctrl as FormGroup).controls;
      const errors: any = {};

      const role_arr_id = getMapping(_id.value, 'roles') || relatedEntityId;
      const role_arr = (roles as FormGroup).controls[role_arr_id] as FormArray;

      const addr_id = getMapping(_id.value, 'addresses') || relatedEntityId;
      const addr = (addresses as FormGroup).controls[addr_id] as FormGroup;

      if (name.value.length === 0) {
        errors['inst_name'] = `Every institution needs a name`;
      }
      if (roleRequired && (!role_arr || role_arr.value.length === 0)) {
        errors['inst_role'] = `Every institution needs atleast 1 role`;
      }
      if (!addr || !addr.valid) {
        errors['inst_addr'] = `Every institution needs a valid address`;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  );

  const addresses = () => institution.controls.addresses as FormGroup;
  const roles = () => institution.controls.roles as FormGroup;
  const notes = () => institution.controls.notes as FormGroup;

  addresses().controls[relatedEntityId] = baseAddress();
  roles().controls[relatedEntityId] = requiredArray();
  notes().controls[relatedEntityId] = new FormControl('');

  if (existing && isInstitution(existing)) {
    institution.patchValue(existing);
    for (const id in existing.roles) {
      if (!existing.roles.hasOwnProperty(id)) continue;
      roles().controls[id] = optionalArray();
      existing.roles[id].forEach(role =>
        (roles().controls[id] as FormArray).push(new FormControl(role)),
      );
    }
    for (const id in existing.addresses) {
      if (!existing.addresses.hasOwnProperty(id)) continue;
      addresses().controls[id] = baseAddress();
      addresses().controls[id].patchValue(existing.addresses[id]);
    }
    for (const id in existing.notes) {
      if (!existing.notes.hasOwnProperty(id)) continue;
      notes().controls[id] = new FormControl(existing.notes[id]);
    }
  }

  setMapping(institution.value._id, 'addresses', relatedEntityId);
  setMapping(institution.value._id, 'roles', relatedEntityId);
  setMapping(institution.value._id, 'notes', relatedEntityId);

  return institution;
};

export const baseEntity = (
  existing?: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
) => {
  const entity = new FormGroup(
    {
      _id: new FormControl(objectId.generateEntityId()),

      title: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),

      externalId: optionalArray(),
      externalLink: optionalArray(),
      biblioRefs: optionalArray(),
      other: optionalArray(),
      metadata_files: optionalArray(),

      persons: new FormArray(new Array<FormGroup>()),
      institutions: new FormArray(new Array<FormGroup>()),
    },
    ctrl_ent => {
      const {
        title,
        description,
        persons,
        institutions,
        _id: ent_id,
      } = (ctrl_ent as FormGroup).controls;

      const errors: any = {};

      // No title
      if (!title.valid) {
        errors['title'] = 'Every entity needs a title';
      }
      // No description
      if (!description.valid) {
        errors['desc'] = 'Every entity needs a description';
      }

      // No empty persons & institutions
      const person_len = (persons as FormArray).length;
      const inst_len = (institutions as FormArray).length;
      if (person_len + inst_len === 0) {
        errors['pers_inst'] =
          'Either a person or an institution must be supplied per entity';
      }
      // Atleast 1 RIGHTS_OWNER && 1 CONTACT_PERSON
      if (person_len + inst_len > 0) {
        let contact_persons = 0;
        let rights_owners = 0;
        // Combine persons and institutions FormGroups
        const elements = ((persons as FormArray)
          .controls as FormGroup[]).concat(
          (institutions as FormArray).controls as FormGroup[],
        );

        // Find roles in each
        for (const control of elements) {
          const { _id, roles } = control.value;
          const role_arr_id = getMapping(_id, 'roles') || ent_id.value;
          const role_arr = roles[role_arr_id];
          if (!role_arr) continue;
          if ((role_arr as string[]).includes('RIGHTS_OWNER')) {
            rights_owners++;
          }
          if ((role_arr as string[]).includes('CONTACT_PERSON')) {
            contact_persons++;
          }
        }

        if (contact_persons === 0) {
          errors[
            'pers_inst_contact'
          ] = `Every entity needs atleast 1 contact person. Check the necessary roles`;
        }

        if (rights_owners === 0) {
          errors[
            'pers_inst_rights'
          ] = `Every entity needs atleast 1 rights owner person/institution. Check the necessary roles`;
        }
      }
      return Object.keys(errors).length > 0 ? errors : null;
    },
  );

  if (existing && isMetadataEntity(existing)) {
    entity.patchValue(existing);
    // complex
    for (const person of existing.persons) {
      (entity.get('persons') as FormArray).push(
        basePerson(entity.value._id, person),
      );
    }
    for (const inst of existing.institutions) {
      (entity.get('institutions') as FormArray).push(
        baseInstitution(entity.value._id, inst),
      );
    }
    // simple
    existing.externalId.forEach(obj => {
      const base = baseExternalId();
      base.patchValue(obj);
      (entity.get('externalId') as FormArray).push(base);
    });
    existing.externalLink.forEach(obj => {
      const base = baseExternalLink();
      base.patchValue(obj);
      (entity.get('externalLink') as FormArray).push(base);
    });
    existing.biblioRefs.forEach(obj => {
      const base = baseBiblioRef();
      base.patchValue(obj);
      (entity.get('biblioRefs') as FormArray).push(base);
    });
    existing.other.forEach(obj => {
      const base = baseOther();
      base.patchValue(obj);
      (entity.get('other') as FormArray).push(base);
    });
    existing.metadata_files.forEach(obj => {
      const base = baseFile();
      base.patchValue(obj);
      (entity.get('metadata_files') as FormArray).push(base);
    });
  }

  return entity;
};

export const baseDigital = (existing?: IMetaDataDigitalEntity) => {
  const entity = new FormGroup({
    type: new FormControl(''),
    licence: new FormControl('', lic_ctrl =>
      lic_ctrl.value.length === 0
        ? { lic: `A digital entity needs a licence` }
        : null,
    ),

    discipline: new FormArray(new Array<FormControl>()),
    tags: optionalArray(),

    dimensions: optionalArray(),
    creation: optionalArray(),
    files: optionalArray(),

    statement: new FormControl(''),
    objecttype: new FormControl(''),

    phyObjs: optionalArray(),
  });

  if (existing && isMetadataEntity(existing)) {
    entity.patchValue(existing);

    // complex
    for (const phyObj of existing.phyObjs) {
      const base = baseEntity(phyObj);
      base.controls = { ...base.controls, ...basePhysical(phyObj).controls };
      (entity.get('phyObjs') as FormArray).push(base);
    }

    // simple
    existing.dimensions.forEach(obj => {
      const base = baseDimension();
      base.patchValue(obj);
      (entity.get('dimensions') as FormArray).push(base);
    });
    existing.creation.forEach(obj => {
      const base = baseCreation();
      base.patchValue(obj);
      (entity.get('creation') as FormArray).push(base);
    });
    existing.files.forEach(obj => {
      const base = baseFile();
      base.patchValue(obj);
      (entity.get('files') as FormArray).push(base);
    });
    existing.tags.forEach(obj => {
      const base = baseTag(obj);
      (entity.get('tags') as FormArray).push(base);
    });
    existing.discipline.forEach(obj =>
      (entity.get('discipline') as FormArray).push(new FormControl(obj)),
    );
  }

  return entity;
};

export const basePhysical = (existing?: IMetaDataPhysicalEntity) => {
  const entity = new FormGroup({
    place: new FormGroup(
      {
        name: new FormControl(''),
        geopolarea: new FormControl(''),
        address: baseAddress(false),
      },
      place_ctrl => {
        const name = place_ctrl.get('name') as FormControl;
        const geopol = place_ctrl.get('geopolarea') as FormControl;
        const addr = place_ctrl.get('address') as FormGroup;

        const isNameValid = name.value.length > 0;
        const isGeoPolValid = geopol.value.length > 0;
        // Checks if all 5 required properties of address are valid
        const isAddressValid =
          ['number', 'street', 'postcode', 'city', 'country']
            .map(prop => addr.value[prop])
            .filter(str => str.length > 0).length === 5;

        if (!(isNameValid || isGeoPolValid || isAddressValid)) {
          return {
            phyent_place: `Physical entities need atleast 1 place name, geopolitical area or filled address`,
          };
        }

        return null;
      },
    ),
    collection: new FormControl(''),
  });

  if (existing && isMetadataEntity(existing)) {
    entity.patchValue(existing);
  }

  return entity;
};
