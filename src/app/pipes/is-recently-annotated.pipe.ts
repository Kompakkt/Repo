import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity } from '~common/interfaces';
import { isAnnotation } from '~common/typeguards';

@Pipe({
  name: 'isRecentlyAnnotated',
})
export class IsRecentlyAnnotatedPipe implements PipeTransform {
  transform(entity: IEntity, compilation: ICompilation): boolean {
    for (const id in compilation.annotations) {
      const anno = compilation.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno.target.source.relatedEntity !== entity?._id) continue;
      const date = new Date(parseInt(anno._id.toString().slice(0, 8), 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  }
}
