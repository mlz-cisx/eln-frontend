import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'stripHTML',
    standalone: false
})
export class StripHTMLPipe implements PipeTransform {
  public transform(value?: string | null): string {
    return value ? String(value).replace(/<[^>]+>/gm, '') : '';
  }
}
