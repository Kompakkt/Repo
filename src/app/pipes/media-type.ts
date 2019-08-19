import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          name: 'mediaType',

      })
export class MediaTypePipe implements PipeTransform {
    // cases: entity, image, audio, video
    // TODO annotationList length, annotatable (bei entity nur, wenn ich in relatedEntityOwners bin)
    transform(
        items: any[],
        entity: boolean,
        image: boolean,
        audio: boolean,
        video: boolean,
        searchText?: string,
    ): any[] {
        if (!items) return [];
        const response: string[] = [];

        items.forEach(item => {
            if (searchText === '' || !searchText ||
                item.name && searchText && item.name.toLowerCase()
                .includes(searchText.toLowerCase())) {
                if (item.mediaType) {
                    switch (item.mediaType) {
                        case 'entity':
                        case 'model':
                            if (entity) {
                                response.push(item);
                            }
                            break;
                        case 'image':
                            if (image) {
                                response.push(item);
                            }
                            break;
                        case 'audio':
                            if (audio) {
                                response.push(item);
                            }
                            break;
                        case 'video':
                            if (video) {
                                response.push(item);
                            }
                            break;
                        default:
                            console.log('undefined');
                    }
                } else {
                    if (item.entities && item.entities.length > 0) {
                        let containsMediaType = false;
                        item.entities.forEach(i => {
                            switch (i.mediaType) {
                                case 'entity':
                                case 'model':
                                    if (entity) {
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
                            response.push(item);
                        }
                }
            }}
        });

        return response;
    }
}
