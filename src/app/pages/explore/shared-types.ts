import { ExploreFilterOption } from './explore-filter-option/explore-filter-option.component';
import { SortOrder } from 'src/app/services/backend.service';

export { SortOrder };

export const EXPLORE_CATEGORIES = ['objects', 'collections', 'institutions'] as const;
export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];
export const isExploreCategory = (value: string): value is ExploreCategory => {
  return (EXPLORE_CATEGORIES as readonly string[]).includes(value);
};

export const AvailableSortByOptions = {
  newest: {
    label: 'explore-filter-option-sort-by-newest',
    value: SortOrder.newest,
    default: true,
    exclusive: true,
    category: 'sortBy',
  },
  popularity: {
    label: 'explore-filter-option-sort-by-most-popular',
    value: SortOrder.popularity,
    exclusive: true,
    category: 'sortBy',
  },
  annotations: {
    label: 'explore-filter-option-sort-by-most-annotations',
    value: SortOrder.annotations,
    exclusive: true,
    category: 'sortBy',
  },
  nameAsc: {
    label: 'explore-filter-option-sort-by-alphabetical-ascending',
    value: SortOrder.name,
    exclusive: true,
    category: 'sortBy',
  },
  nameDesc: {
    label: 'explore-filter-option-sort-by-alphabetical-descending',
    value: SortOrder.name + '-reversed',
    exclusive: true,
    category: 'sortBy',
  },
} satisfies Record<string, ExploreFilterOption>;
export const SortByOptions: ExploreFilterOption[] = Object.values(AvailableSortByOptions);

export const AvailableMediaTypeOptions = {
  model: {
    label: 'explore-filter-option-media-type-model',
    value: 'model',
    exclusive: false,
    category: 'mediaType',
  },
  cloud: {
    label: 'explore-filter-option-media-type-cloud',
    value: 'cloud',
    exclusive: false,
    category: 'mediaType',
  },
  splat: {
    label: 'explore-filter-option-media-type-splat',
    value: 'splat',
    exclusive: false,
    category: 'mediaType',
  },
  image: {
    label: 'explore-filter-option-media-type-image',
    value: 'image',
    exclusive: false,
    category: 'mediaType',
  },
  video: {
    label: 'explore-filter-option-media-type-video',
    value: 'video',
    exclusive: false,
    category: 'mediaType',
  },
  audio: {
    label: 'explore-filter-option-media-type-audio',
    value: 'audio',
    exclusive: false,
    category: 'mediaType',
  },
} satisfies Record<string, ExploreFilterOption>;
export const MediaTypeOptions: ExploreFilterOption[] = Object.values(AvailableMediaTypeOptions);

export const AvailableAnnotationOptions = {
  withAnnotations: {
    label: 'explore-filter-option-annotation-with',
    value: 'with-annotations',
    category: 'annotation',
    exclusive: false,
  },
  withoutAnnotations: {
    label: 'explore-filter-option-annotation-without',
    value: 'without-annotations',
    category: 'annotation',
    exclusive: false,
  },
} satisfies Record<string, ExploreFilterOption>;
export const AnnotationOptions: ExploreFilterOption[] = Object.values(AvailableAnnotationOptions);

export const AvailableAccessOptions = {
  owner: { label: 'explore-filter-option-access-owner', value: 'owner', category: 'access' },
  editor: { label: 'explore-filter-option-access-editor', value: 'editor', category: 'access' },
  viewer: { label: 'explore-filter-option-access-viewer', value: 'viewer', category: 'access' },
} satisfies Record<string, ExploreFilterOption>;
export const AccessOptions: ExploreFilterOption[] = Object.values(AvailableAccessOptions);

export const AvailableMiscOptions = {
  downloadable: {
    label: 'explore-filter-option-misc-downloadable',
    value: 'downloadable',
    category: 'misc',
  },
} satisfies Record<string, ExploreFilterOption>;
export const MiscOptions: ExploreFilterOption[] = Object.values(AvailableMiscOptions);

export const AvailableLicenceOptions = {
  cc0: { label: 'explore-filter-option-licence-cc0', value: 'CC0', category: 'licence' },
  pdm: { label: 'explore-filter-option-licence-pdm', value: 'PDM', category: 'licence' },
  by4: { label: 'explore-filter-option-licence-by', value: 'BY', category: 'licence' },
  bysa4: { label: 'explore-filter-option-licence-by-sa', value: 'BYSA', category: 'licence' },
  bynd4: { label: 'explore-filter-option-licence-by-nd', value: 'BYND', category: 'licence' },
  bync4: { label: 'explore-filter-option-licence-by-nc', value: 'BYNC', category: 'licence' },
  byncsa4: {
    label: 'explore-filter-option-licence-by-nc-sa',
    value: 'BYNCSA',
    category: 'licence',
  },
  byncnd4: {
    label: 'explore-filter-option-licence-by-nc-nd',
    value: 'BYNCND',
    category: 'licence',
  },
  ar: {
    label: 'explore-filter-option-licence-all-rights-reserved',
    value: 'AR',
    category: 'licence',
  },
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
