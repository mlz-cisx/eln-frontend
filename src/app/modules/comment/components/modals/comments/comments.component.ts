import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DialogRef} from '@ngneat/dialog';
import {UntilDestroy} from '@ngneat/until-destroy';
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";

@UntilDestroy()
@Component({
  selector: 'mlzeln-comments-modal',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsModalComponent {
  public element: any = this.modalRef.data.element;

  public service: any = this.modalRef.data.service;

  public create: any = this.modalRef.data.create;

  public constructor(public readonly modalRef: DialogRef, private readonly drawboardGridComponent: LabBookDrawBoardGridComponent) {
  }


  public on_click() {
    this.modalRef.close()
  }
}
