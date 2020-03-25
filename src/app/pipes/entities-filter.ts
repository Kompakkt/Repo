import { Pipe, PipeTransform } from '@angular/core';

import {
  isEntity,
  isCompilation,
  ICompilation,
  IEntity,
} from '@kompakkt/shared';

@Pipe({
  name: 'entitiesfilter',
})
export class EntitiesFilter implements PipeTransform {
  transform(
    items: Array<ICompilation | IEntity>,
    annotated: boolean,
    restricted: boolean,
    model: boolean,
    image: boolean,
    audio: boolean,
    video: boolean,
    searchText: string,
    entities: boolean,
  ): any[] {
    if (!items) return [];
    const response = new Array<ICompilation | IEntity>();

    if (!entities) {
      for (const compilation of items) {
        if (!isCompilation(compilation)) continue;

        const isAnnotated = Object.keys(compilation.annotations).length > 0;
        if (!annotated && isAnnotated) continue;

        const includesSearch =
          searchText &&
          compilation.name.toLowerCase().includes(searchText.toLowerCase());
        if (searchText !== '' && !includesSearch) continue;

        const isRestricted =
          compilation.whitelist.enabled || compilation.password === '';
        if (restricted && !isRestricted) continue;

        let containsMediaType = false;
        for (const entity of Object.values(compilation.entities)) {
          if (!isEntity(entity)) continue;
          switch (entity.mediaType) {
            case 'entity':
            case 'model':
              if (model) containsMediaType = true;
              break;
            case 'image':
              if (image) containsMediaType = true;
              break;
            case 'audio':
              if (audio) containsMediaType = true;
              break;
            case 'video':
              if (video) containsMediaType = true;
              break;
            default:
              console.log('undefined');
          }
        }
        if (containsMediaType) {
          response.push(compilation);
        }
      }
    }

    if (entities) {
      for (const entity of items) {
        if (!isEntity(entity)) continue;

        const isAnnotated = Object.keys(entity.annotations).length > 0;
        if (!annotated && isAnnotated) continue;

        const includesSearch = entity.name
          .toLowerCase()
          .includes(searchText.toLowerCase());
        if (searchText !== '' && !includesSearch) continue;

        switch (entity.mediaType) {
          case 'entity':
          case 'model':
            if (model) response.push(entity);
            break;
          case 'image':
            if (image) response.push(entity);
            break;
          case 'audio':
            if (audio) response.push(entity);
            break;
          case 'video':
            if (video) response.push(entity);
            break;
          default:
            console.log('undefined');
        }
      }
    }
    return response;
  }
}
