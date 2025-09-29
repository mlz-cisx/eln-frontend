import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { LabBookElement } from '@joeseln/types';

@Component({
    selector: 'mlzeln-labbook-draw-board-element',
    templateUrl: './element.component.html',
    styleUrls: ['./element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LabBookDrawBoardElementComponent {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public editable? = false;
}
