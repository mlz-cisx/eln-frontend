import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({ selector: '[ellipsis]' })
export class EllipsisDirective implements OnInit {
  public constructor(private readonly el: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    if (this.el.nativeElement.closest('td')) {
      (this.el.nativeElement.closest('td') as any).style.maxWidth = '0';
    }
    this.el.nativeElement.classList.add('mlzeln-ellipsis');
  }
}
