import {Component, Input, ViewEncapsulation} from '@angular/core';
import {MathjaxModule} from 'mathjax-angular';

@Component({
  selector: 'mlzeln-tex-preview',
  standalone: true,
  imports: [MathjaxModule],
  styleUrl: './tex-insert-dialog.css',
  encapsulation: ViewEncapsulation.None,
  template: '@if (formula) { <div [mathjax]="formula"></div> }'
})
export class TexPreviewComponent {
  @Input() public formula = '';
}
