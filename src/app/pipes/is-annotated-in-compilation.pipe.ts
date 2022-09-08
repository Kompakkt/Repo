import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity } from '~common/interfaces';
import { isAnnotation } from '~common/typeguards';

@Pipe({
  name: 'isAnnotatedInCollection',
})
export class IsAnnotatedInCompilationPipe implements PipeTransform {
  transform(entity: IEntity, compilation: ICompilation): unknown {
    const _id = entity._id;
    for (const id in compilation.annotations) {
      const anno = compilation.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno?.target?.source?.relatedEntity === _id) return true;
    }
    return false;
  }
}
