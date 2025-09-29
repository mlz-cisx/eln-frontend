import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'safeHTML',
    standalone: false
})
export class SafeHtmlPipe implements PipeTransform {
  public constructor(private readonly sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
