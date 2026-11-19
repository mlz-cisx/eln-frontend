import {LabBookDrawBoardGridComponent} from '../grid/grid.component';
import {ChangeDetectionStrategy, Component, Input, ViewChild,} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-draw-board',
  templateUrl: './draw-board.component.html',
  styleUrls: ['./draw-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LabBookDrawBoardComponent {
  @ViewChild(LabBookDrawBoardGridComponent)
  public grid?: LabBookDrawBoardGridComponent;

  @Input()
  public id!: string;


  @Input()
  public editable? = false;

  @Input()
  public restorable? = false;

}
