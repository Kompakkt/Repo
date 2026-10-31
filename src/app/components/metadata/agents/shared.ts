export type RoleEntry = {
  type: string;
  value: string;
  checked: boolean;
};
export const emptyRoleEntry = (): RoleEntry => ({
  type: `EMPTY_CUSTOM-${Date.now()}`,
  value: '',
  checked: false,
});

export const DEFAULT_ROLES: RoleEntry[] = [
  { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
  { type: 'CONTACT_PERSON', value: 'Contact person', checked: false },
];

export const DEFAULT_ROLE_TYPES = DEFAULT_ROLES.map(r => r.type);

export const formatRoleLabel = (role: string): string => {
  return role.trim().replace(/\s+/g, ' ');
};
