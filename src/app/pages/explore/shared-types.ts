import { ExploreFilterOption } from './explore-filter-option/explore-filter-option.component';
import { SortOrder } from 'src/app/services/backend.service';

export { SortOrder };

export type ExploreCategory = 'objects' | 'collections' | 'institutions';

export const SortOrderDirection: Record<SortOrder, [string, string]> = {
  [SortOrder.name]: ['A-Z', 'Z-A'],
  [SortOrder.popularity]: ['Most to least', 'Least to most'],
  [SortOrder.usage]: ['Most to least', 'Least to most'],
  [SortOrder.annotations]: ['Most to least', 'Least to most'],
  [SortOrder.newest]: ['Newest', 'Oldest'],
};

export const SortByOptions: ExploreFilterOption[] = [
  { label: 'Most popular', value: SortOrder.popularity, default: true },
  { label: 'Least popular', value: SortOrder.popularity + '-reversed' },
  { label: 'Most recent', value: SortOrder.newest },
  { label: 'Oldest', value: SortOrder.newest + '-reversed' },
  { label: 'Alphabetical (A-Z)', value: SortOrder.name },
  { label: 'Alphabetical (Z-A)', value: SortOrder.name + '-reversed' },
  { label: 'Most annotations', value: SortOrder.annotations },
  { label: 'Fewest annotations', value: SortOrder.annotations + '-reversed' },
  // TODO: Decide if these should be added back in
  // { label: 'Usage in collections', value: SortOrder.usage },
].map(v => ({ ...v, exclusive: true, category: 'sortBy' }));

export const MediaTypeOptions: ExploreFilterOption[] = [
  { label: '3D models', value: 'model', default: true },
  { label: 'Point clouds', value: 'cloud' },
  { label: '3D Gaussian splats', value: 'splat' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
  { label: 'Audio', value: 'audio' },
].map(v => ({ ...v, exclusive: false, category: 'mediaType' }));

export const AnnotationOptions: ExploreFilterOption[] = [
  { label: 'With annotations', value: 'with-annotations' },
  { label: 'Without annotations', value: 'without-annotations' },
].map(v => ({ ...v, category: 'annotation', exclusive: true }));

export const AccessOptions: ExploreFilterOption[] = [
  { label: 'Owner', value: 'owner' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
].map(v => ({ ...v, category: 'access' }));

export const MiscOptions: ExploreFilterOption[] = [
  { label: 'Downloadable', value: 'downloadable' },
  // TODO: { label: 'Animated', value: 'animated' },
].map(v => ({ ...v, category: 'misc' }));

export const LicenceOptions: ExploreFilterOption[] = [
  { label: 'No Rights Reserved (CC0)', value: 'CC0' },
  { label: 'Public Domain Mark 1.0 Universal (PDM 1.0)', value: 'PDM' },
  { label: 'Attribution (CC BY 4.0)', value: 'BY' },
  { label: 'Attribution-ShareAlike (CC BY-SA 4.0)', value: 'BYSA' },
  { label: 'Attribution-NoDerivatives (CC BY-ND 4.0)', value: 'BYND' },
  { label: 'Attribution-NonCommercial (CC BY-NC 4.0)', value: 'BYNC' },
  {
    label: 'Attribution-NonCommercial-ShareAlike (CC BY-NC-SA 4.0)',
    value: 'BYNCSA',
  },
  {
    label: 'Attribution-NonCommercial-NoDerivatives (CC BY-NC-ND 4.0)',
    value: 'BYNCND',
  },
  { label: 'All rights reserved', value: 'AR' },
].map(v => ({ ...v, category: 'licence' }));

export const CombinedOptions = [
  ...SortByOptions,
  ...MediaTypeOptions,
  ...AnnotationOptions,
  ...AccessOptions,
  ...MiscOptions,
  ...LicenceOptions,
];
