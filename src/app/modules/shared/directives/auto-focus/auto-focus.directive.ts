import { AfterContentInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[autoFocus]',
})
export class AutoFocusDirective implements AfterContentInit {
  public constructor(private readonly el: ElementRef<HTMLElement>) {}

  public ngAfterContentInit(): void {
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 1);
  }
}
