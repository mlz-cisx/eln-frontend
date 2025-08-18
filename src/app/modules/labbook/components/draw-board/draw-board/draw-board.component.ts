import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
} from '@angular/core';
import type { LabBookElementEvent } from '@joeseln/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-draw-board',
  templateUrl: './draw-board.component.html',
  styleUrls: ['./draw-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardComponent {
  @Input()
  public id!: string;


  @Input()
  public editable? = false;

  public created = new EventEmitter<LabBookElementEvent>();

  public refresh = new EventEmitter<boolean>();

  public onAddElement(event: LabBookElementEvent): void {
    this.created.next(event);
  }

  public onRefreshGrid(event: boolean): void {
    this.refresh.next(event);
  }
}
