import { Pipe, PipeTransform } from '@angular/core';
import { DataTuple, IDescriptionValueTuple, IDimensionTuple } from '@kompakkt/common';

@Pipe({ name: 'dataTupleKeyValue' })
export class DataTupleKeyValuePipe implements PipeTransform {
  transform(value: DataTuple): Array<{ key: string; value: unknown }> {
    return Object.entries(value).map(([key, value]) => ({ key, value }));
  }
}

@Pipe({ name: 'isDimensionTuple' })
export class IsDimensionTuple implements PipeTransform {
  transform(value: DataTuple): value is IDimensionTuple {
    return (
      value && typeof value === 'object' && 'type' in value && 'value' in value && 'name' in value
    );
  }
}

@Pipe({ name: 'isDescriptionValueTuple' })
export class IsDescriptionValueTuple implements PipeTransform {
  transform(value: DataTuple): value is IDescriptionValueTuple {
    return value && typeof value === 'object' && 'description' in value && 'value' in value;
  }
}
