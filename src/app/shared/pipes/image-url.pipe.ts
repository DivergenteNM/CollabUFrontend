import { Pipe, PipeTransform } from '@angular/core';
import { resolveImageUrl } from '../utils/image.utils';

@Pipe({
  name: 'imageUrl',
  standalone: true,
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null {
    return resolveImageUrl(value);
  }
}
