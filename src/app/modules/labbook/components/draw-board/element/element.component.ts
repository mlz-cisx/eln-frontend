import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { LabBookElement } from '@joeseln/types';

@Component({
  selector: 'eworkbench-labbook-draw-board-element',
  templateUrl: './element.component.html',
  styleUrls: ['./element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardElementComponent {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public editable? = false;
}
