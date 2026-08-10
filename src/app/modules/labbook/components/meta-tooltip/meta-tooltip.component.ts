import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {SafeHtml} from "@angular/platform-browser";


@Component({
  selector: 'meta-tooltip',
  templateUrl: './meta-tooltip.component.html',
  styleUrls: ['./meta-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class MetaTooltipComponent {
  @Input() content!: SafeHtml;
  @Input() useNowrap = false;

  @Input() htmlMode = false;
  @Input() canvasMode = false;

  @Input() pic_uuid: any;

  @Output() hoverState = new EventEmitter<'enter' | 'leave'>();


}
