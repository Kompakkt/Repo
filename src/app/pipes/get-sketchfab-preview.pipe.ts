import { Pipe, PipeTransform } from '@angular/core';
import { SketchfabModel } from '../services/backend.service';

@Pipe({ name: 'getSketchfabPreview' })
export class GetSketchfabPreviewPipe implements PipeTransform {
  transform(value: SketchfabModel): string {
    const desiredWidth = 720;
    let closestImage = value.thumbnails.images.at(0);
    if (value.thumbnails.images.length > 1) {
      let closestDiff = Math.abs((closestImage?.width ?? 0) - desiredWidth);
      for (const img of value.thumbnails.images) {
        const diff = Math.abs((img.width ?? 0) - desiredWidth);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestImage = img;
        }
      }
    }
    return closestImage?.url ?? '';
  }
}
