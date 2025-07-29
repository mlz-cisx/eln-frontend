import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'mlzeln-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ModalComponent {
  @Input()
  public className = 'modal-wrap';

  @Input()
  public modalFooter = true;

  @Input()
  public closeButton = true;

  @Input()
  public noPadding = false;

  public constructor(public readonly modalRef: DialogRef) {}
}
