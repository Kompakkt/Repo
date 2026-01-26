import { ExploreFilterOption } from './explore-filter-option/explore-filter-option.component';
import { SortOrder } from 'src/app/services/backend.service';

export { SortOrder };

export const EXPLORE_CATEGORIES = ['objects', 'collections', 'institutions'] as const;
export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];
export const isExploreCategory = (value: string): value is ExploreCategory => {
  return (EXPLORE_CATEGORIES as readonly string[]).includes(value);
};

export const AvailableSortByOptions = {
  popularity: {
    label: 'Most popular',
    value: SortOrder.popularity,
    default: true,
    category: 'sortBy',
    exclusive: true,
  },
  recency: { label: 'Latest', value: SortOrder.newest, category: 'sortBy', exclusive: true },
  name: { label: 'Name', value: SortOrder.name, category: 'sortBy', exclusive: true },
  annotations: {
    label: 'Annotations',
    value: SortOrder.annotations,
    category: 'sortBy',
    exclusive: true,
  },
} satisfies Record<string, ExploreFilterOption>;

export const SortByOptions: ExploreFilterOption[] = Object.values(AvailableSortByOptions);

export const AvailableMediaTypeOptions = {
  model: { label: '3D models', value: 'model', exclusive: false, category: 'mediaType' },
  cloud: { label: 'Point clouds', value: 'cloud', exclusive: false, category: 'mediaType' },
  splat: { label: '3D Gaussian splats', value: 'splat', exclusive: false, category: 'mediaType' },
  image: { label: 'Images', value: 'image', exclusive: false, category: 'mediaType' },
  video: { label: 'Videos', value: 'video', exclusive: false, category: 'mediaType' },
  audio: { label: 'Audio', value: 'audio', exclusive: false, category: 'mediaType' },
} satisfies Record<string, ExploreFilterOption>;

export const MediaTypeOptions: ExploreFilterOption[] = Object.values(AvailableMediaTypeOptions);

export const AvailableAnnotationOptions = {
  withAnnotations: {
    label: 'With annotations',
    value: 'with-annotations',
    category: 'annotation',
    exclusive: false,
  },
  withoutAnnotations: {
    label: 'Without annotations',
    value: 'without-annotations',
    category: 'annotation',
    exclusive: false,
  },
} satisfies Record<string, ExploreFilterOption>;

export const AnnotationOptions: ExploreFilterOption[] = Object.values(AvailableAnnotationOptions);

export const AvailableAccessOptions = {
  owner: { label: 'Owner', value: 'owner', category: 'access', exclusive: false },
  editor: { label: 'Editor', value: 'editor', category: 'access', exclusive: false },
  viewer: { label: 'Viewer', value: 'viewer', category: 'access', exclusive: false },
} satisfies Record<string, ExploreFilterOption>;

export const AccessOptions: ExploreFilterOption[] = Object.values(AvailableAccessOptions);

export const AvailableGroupRoleOptions = {
  creator: { label: 'Creator', value: 'creator', category: 'groupRole', exclusive: false },
  owner: { label: 'Owner', value: 'owner', category: 'groupRole', exclusive: false },
  member: { label: 'Member', value: 'member', category: 'groupRole', exclusive: false },
} satisfies Record<string, ExploreFilterOption>;

export const GroupRoleOptions: ExploreFilterOption[] = Object.values(AvailableGroupRoleOptions);

export const AvailableMiscOptions = {
  downloadable: {
    label: 'Downloadable',
    value: 'downloadable',
    category: 'misc',
    exclusive: false,
  },
  // TODO: animated: { label: 'Animated', value: 'animated', category: 'misc', exclusive: false },
} satisfies Record<string, ExploreFilterOption>;

export const MiscOptions: ExploreFilterOption[] = Object.values(AvailableMiscOptions);

export const AvailableLicenceOptions = {
  CC0: { label: 'CC0', value: 'CC0', category: 'licence', exclusive: false },
  PDM: { label: 'PDM 1.0', value: 'PDM', category: 'licence', exclusive: false },
  BY: { label: 'CC BY 4.0', value: 'BY', category: 'licence', exclusive: false },
  BYSA: { label: 'CC BY-SA 4.0', value: 'BYSA', category: 'licence', exclusive: false },
  BYND: { label: 'CC BY-ND 4.0', value: 'BYND', category: 'licence', exclusive: false },
  BYNC: { label: 'CC BY-NC 4.0', value: 'BYNC', category: 'licence', exclusive: false },
  BYNCSA: { label: 'CC BY-NC-SA 4.0', value: 'BYNCSA', category: 'licence', exclusive: false },
  BYNCND: { label: 'CC BY-NC-ND 4.0', value: 'BYNCND', category: 'licence', exclusive: false },
  AR: { label: 'All rights reserved', value: 'AR', category: 'licence', exclusive: false },
} satisfies Record<string, ExploreFilterOption>;

export const LicenceOptions: ExploreFilterOption[] = Object.values(AvailableLicenceOptions);

export const CombinedOptions = [
  ...SortByOptions,
  ...MediaTypeOptions,
  ...AnnotationOptions,
  ...AccessOptions,
  ...MiscOptions,
  ...LicenceOptions,
];

export const reduceExploreFilterOptions = (arr: ExploreFilterOption[]) =>
  arr.reduce(
    (acc, val) => {
      if (!acc[val.category]) acc[val.category] = [];
      acc[val.category]!.push(val.value);
      return acc;
    },
    {} as Record<ExploreFilterOption['category'], string[] | undefined>,
  );
