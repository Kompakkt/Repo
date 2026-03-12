import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity } from 'src/common';

@Pipe({ name: 'isAnyEntityInCompilation' })
export class IsAnyEntityInCompilationPipe implements PipeTransform {
  transform(
    value: ICompilation,
    entities: IEntity[],
  ):
    | {
        value: 'all' | 'some' | 'none';
        type: 'array';
        disabled: boolean;
        icon: string;
        tooltip: string;
      }
    | {
        value: boolean;
        type: 'single';
        disabled: boolean;
        icon: string;
        tooltip: string;
      } {
    const length = entities.length;
    if (length > 1) {
      const all = entities.every(e => Object.hasOwn(value.entities, e._id));
      const some = entities.some(e => Object.hasOwn(value.entities, e._id));
      return {
        value: all ? 'all' : some ? 'some' : 'none',
        type: 'array',
        disabled: all,
        icon: all ? 'library_add_check' : some ? 'indeterminate_check_box' : 'library_add',
        tooltip: all
          ? 'All selected objects are already in this collection'
          : some
            ? 'Some selected objects are already in this collection. Selecting this will add the remaining objects'
            : 'No selected objects are in this collection. Selecting this will add all selected objects',
      };
    } else {
      const firstEntity = entities.at(0);
      if (!firstEntity) {
        return {
          value: false,
          type: 'single',
          disabled: true,
          icon: 'library_add_check',
          tooltip: 'No objects selected',
        };
      }
      const isInCompilation = Object.hasOwn(value.entities, firstEntity._id);
      return {
        value: isInCompilation,
        type: 'single',
        disabled: isInCompilation,
        icon: isInCompilation ? 'library_add_check' : 'library_add',
        tooltip: isInCompilation
          ? 'This object is already in this collection'
          : 'This object is not in this collection. Selecting this will add it',
      };
    }
  }
}
