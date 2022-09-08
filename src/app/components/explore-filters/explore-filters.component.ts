import { Component, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { SortOrder } from 'src/app/services/backend.service';

export const mediaTypes = {
  model: '3D Models',
  audio: 'Audio',
  video: 'Video',
  image: 'Images',
};

const compilationFilters = {
  annotatable: {
    name: 'Annotatable',
    help: 'Only show collections you are allowed to annotate',
  },
  annotated: {
    name: 'Annotated',
    help: 'Only show collections that have been annotated',
  },
  restricted: {
    name: 'Restricted',
    help: 'Only show collections that are not public, but where you have access',
  },
};

const entityFilters = {
  annotatable: {
    name: 'Annotatable',
    help: 'Only show entities you are allowed to annotate',
  },
  annotated: {
    name: 'Annotated',
    help: 'Only show entities that have been annotated',
  },
  restricted: {
    name: 'Restricted',
    help: 'Only show entities that are not public, but where you have access',
  },
  associated: {
    name: 'Associated',
    help: 'Only show entities where you are mentioned in metadata',
  },
};

const sortOrder = [
  {
    name: 'Popularity',
    value: SortOrder.popularity,
    help: 'Sort by most visited',
  },
  {
    name: 'Usage',
    value: SortOrder.usage,
    help: 'Sort by amount of compilations containing an object',
  },
  {
    name: 'Name',
    value: SortOrder.name,
    help: 'Sort alphabetically',
  },
  {
    name: 'Annotations',
    value: SortOrder.annotations,
    help: 'Sort by number of annotations on an object',
  },
  {
    name: 'Newest',
    value: SortOrder.newest,
    help: 'Sort by creation date',
  },
];

export interface IExploreFilters {
  query: string;
  type: 'objects' | 'compilations';
  filters: string[];
  mediaTypes: string[];
  sortOrder: SortOrder;
}

@Component({
  selector: 'app-explore-filters',
  templateUrl: './explore-filters.component.html',
  styleUrls: ['./explore-filters.component.scss'],
})
export class ExploreFiltersComponent implements AfterViewInit {
  @Output('filtersChanged')
  public filtersChanged = new EventEmitter<IExploreFilters>();

  public options = {
    mediaTypes,
    compilationFilters,
    entityFilters,
    sortOrder,
  };

  public formGroup = new FormGroup({
    query: new FormControl(''),
    type: new FormControl(''),
    filters: new FormControl(new Array<string>()),
    mediaTypes: new FormControl(new Array<string>()),
    sortOrder: new FormControl(''),
  });

  constructor() {
    this.formGroup.valueChanges.subscribe(group => {
      this.filtersChanged.emit(group);
    });
  }

  get type() {
    return this.formGroup.get('type')!;
  }

  get isTypeEntity() {
    return this.type.value === 'objects';
  }

  get isTypeEntity$(): Observable<boolean> {
    return this.type.valueChanges.pipe(map(type => type === 'objects'));
  }

  ngAfterViewInit(): void {
    this.formGroup.setValue({
      query: '',
      type: 'objects',
      filters: [],
      mediaTypes: Object.keys(this.options.mediaTypes),
      sortOrder: SortOrder.popularity,
    });
  }
}
