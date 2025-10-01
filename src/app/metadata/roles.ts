export const MetadataRoles = {
  RIGHTS_OWNER: 'Rightsowner',
  CREATOR: 'Creator',
  EDITOR: 'Editor',
  DATA_CREATOR: 'Data creator',
  CONTACT_PERSON: 'Contact person',
} as const;

type MetadataRoleKey = keyof typeof MetadataRoles;
type MetadataRoleValue = (typeof MetadataRoles)[MetadataRoleKey];

export const metadataRolesAsOptions = (): Array<{
  type: MetadataRoleKey;
  value: MetadataRoleValue;
  checked: boolean;
}> =>
  Object.entries(MetadataRoles).map(([key, value]) => ({
    type: key as MetadataRoleKey,
    value: value as MetadataRoleValue,
    checked: false,
  }));
