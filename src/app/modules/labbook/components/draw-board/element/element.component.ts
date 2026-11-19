import { ChangeDetectionStrategy, Component, computed, Input, viewChild } from '@angular/core';
import type {LabBookDrawBoardNoteComponent} from '../note/note.component';
import type {LabBookDrawBoardFileComponent} from '../file/file.component';
import type {LabBookDrawBoardPictureComponent} from '../picture/picture.component';
import type { LabBookElement } from '@joeseln/types';

@Component({
    selector: 'mlzeln-labbook-draw-board-element',
    templateUrl: './element.component.html',
    styleUrls: ['./element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LabBookDrawBoardElementComponent {
  private readonly child = viewChild<
    LabBookDrawBoardNoteComponent | LabBookDrawBoardFileComponent | LabBookDrawBoardPictureComponent
  >('elementComponent');

  public readonly contentReady = computed(() => this.child()?.contentReady() ?? false);

  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public editable? = false;
}
