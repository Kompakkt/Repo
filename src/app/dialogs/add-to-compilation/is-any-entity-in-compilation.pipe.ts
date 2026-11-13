import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity } from '@kompakkt/common';

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
          ? 'add-to-compilation-tooltip-all-in-collection'
          : some
            ? 'add-to-compilation-tooltip-some-in-collection'
            : 'add-to-compilation-tooltip-none-in-collection',
      };
    } else {
      const firstEntity = entities.at(0);
      if (!firstEntity) {
        return {
          value: false,
          type: 'single',
          disabled: true,
          icon: 'library_add_check',
          tooltip: 'add-to-compilation-tooltip-no-objects-selected',
        };
      }
      const isInCompilation = Object.hasOwn(value.entities, firstEntity._id);
      return {
        value: isInCompilation,
        type: 'single',
        disabled: isInCompilation,
        icon: isInCompilation ? 'library_add_check' : 'library_add',
        tooltip: isInCompilation
          ? 'add-to-compilation-tooltip-object-in-collection'
          : 'add-to-compilation-tooltip-object-not-in-collection',
      };
    }
  }
}
