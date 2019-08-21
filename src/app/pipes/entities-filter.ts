import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          name: 'entitiesfilter',

      })
export class EntitiesFilter implements PipeTransform {

    transform(
        items: any[],
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
        const response: string[] = [];

        if (!entities) {
            items.forEach(compilation => {
                if (!restricted || (restricted &&
                    (compilation.whitelist.enabled || compilation.password)) &&
                (!annotated || annotated && compilation.annotationList.length > 0) &&
                 (searchText === '' || !searchText ||
                     compilation.name && searchText && compilation.name.toLowerCase()
                                .includes(searchText.toLowerCase()))) {

                    if (compilation.entities && compilation.entities.length > 0) {
                        let containsMediaType = false;
                        compilation.entities.forEach(i => {
                            switch (i.mediaType) {
                                case 'entity':
                                case 'model':
                                    if (model) {
                                        containsMediaType = true;
                                    }
                                    break;
                                case 'image':
                                    if (image) {
                                        containsMediaType = true;
                                    }
                                    break;
                                case 'audio':
                                    if (audio) {
                                        containsMediaType = true;
                                    }
                                    break;
                                case 'video':
                                    if (video) {
                                        containsMediaType = true;
                                    }
                                    break;
                                default:
                                    console.log('undefined');
                            }
                        });
                        if (containsMediaType) {
                            response.push(compilation);
                        }
                    }
                }
            });
        }

        if (entities) {
            items.forEach(entity => {
                if ((!annotated || annotated && entity.annotationList.length > 0) &&
                    (searchText === '' || !searchText ||
                        entity.name && searchText && entity.name.toLowerCase()
                            .includes(searchText.toLowerCase()))) {
                        switch (entity.mediaType) {
                            case 'entity':
                            case 'model':
                                if (model) {
                                    response.push(entity);
                                }
                                break;
                            case 'image':
                                if (image) {
                                    response.push(entity);
                                }
                                break;
                            case 'audio':
                                if (audio) {
                                    response.push(entity);
                                }
                                break;
                            case 'video':
                                if (video) {
                                    response.push(entity);
                                }
                                break;
                            default:
                                console.log('undefined');
                        }
                }
            });
        }
        return response;
    }
}
