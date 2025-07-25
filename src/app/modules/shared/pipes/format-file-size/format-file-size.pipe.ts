import { Pipe, PipeTransform } from '@angular/core';
import filesize from 'filesize';

@Pipe({
  name: 'formatFileSize',
})
export class FormatFileSizePipe implements PipeTransform {
  public transform(value?: number): string {
    return value ? filesize(value) : '';
  }
}
