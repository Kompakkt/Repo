import { ExploreFilterOption } from './explore-filter-option/explore-filter-option.component';
import { SortOrder } from 'src/app/services/backend.service';

export { SortOrder };

export const EXPLORE_CATEGORIES = ['objects', 'collections', 'institutions'] as const;
export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];
export const isExploreCategory = (value: string): value is ExploreCategory => {
  return (EXPLORE_CATEGORIES as readonly string[]).includes(value);
};

export const SortOrderDirection: Record<SortOrder, [string, string]> = {
  [SortOrder.name]: ['A-Z', 'Z-A'],
  [SortOrder.popularity]: ['Most to least', 'Least to most'],
  [SortOrder.usage]: ['Most to least', 'Least to most'],
  [SortOrder.annotations]: ['Most to least', 'Least to most'],
  [SortOrder.newest]: ['Newest', 'Oldest'],
};

export const AvailableSortByOptions = {
  newest: { label: 'Most recent', value: SortOrder.newest, default: true, exclusive: true, category: 'sortBy' },
  popularity: { label: 'Most popular', value: SortOrder.popularity, exclusive: true, category: 'sortBy' },
  annotations: { label: 'Most annotations', value: SortOrder.annotations, exclusive: true, category: 'sortBy' },
  nameAsc: { label: 'Alphabetical (A-Z)', value: SortOrder.name, exclusive: true, category: 'sortBy' },
  nameDesc: { label: 'Alphabetical (Z-A)', value: SortOrder.name + '-reversed', exclusive: true, category: 'sortBy' },
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
  withAnnotations: { label: 'With annotations', value: 'with-annotations', category: 'annotation', exclusive: false },
  withoutAnnotations: { label: 'Without annotations', value: 'without-annotations', category: 'annotation', exclusive: false },
} satisfies Record<string, ExploreFilterOption>;
export const AnnotationOptions: ExploreFilterOption[] = Object.values(AvailableAnnotationOptions);

export const AvailableAccessOptions = {
  owner: { label: 'Owner', value: 'owner', category: 'access' },
  editor: { label: 'Editor', value: 'editor', category: 'access' },
  viewer: { label: 'Viewer', value: 'viewer', category: 'access' },
} satisfies Record<string, ExploreFilterOption>;
export const AccessOptions: ExploreFilterOption[] = Object.values(AvailableAccessOptions);

export const AvailableMiscOptions = {
  downloadable: { label: 'Downloadable', value: 'downloadable', category: 'misc' },
} satisfies Record<string, ExploreFilterOption>;
export const MiscOptions: ExploreFilterOption[] = Object.values(AvailableMiscOptions);

export const AvailableLicenceOptions = {
  cc0: { label: 'CC0', value: 'CC0', category: 'licence' },
  pdm: { label: 'PDM 1.0', value: 'PDM', category: 'licence' },
  by4: { label: 'CC BY 4.0', value: 'BY', category: 'licence' },
  bysa4: { label: 'CC BY-SA 4.0', value: 'BYSA', category: 'licence' },
  bynd4: { label: 'CC BY-ND 4.0', value: 'BYND', category: 'licence' },
  bync4: { label: 'CC BY-NC 4.0', value: 'BYNC', category: 'licence' },
  byncsa4: { label: 'CC BY-NC-SA 4.0', value: 'BYNCSA', category: 'licence' },
  byncnd4: { label: 'CC BY-NC-ND 4.0', value: 'BYNCND', category: 'licence' },
  ar: { label: 'All rights reserved', value: 'AR', category: 'licence' },
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
