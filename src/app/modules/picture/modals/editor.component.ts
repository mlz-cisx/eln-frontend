import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import { PicturesService } from '@joeseln/services';
import type { Picture } from '@joeseln/types';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-picture-editor-modal',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureEditorModalComponent implements OnInit {
  public initialState?: Picture = this.modalRef.data?.initialState;

  public state = ModalState.Unchanged;

  public privileges = this.modalRef.data?.privileges;

  public constructor(public readonly modalRef: DialogRef, public readonly picturesService: PicturesService) {
  }

  ngOnInit() {
    // other possibility
    // Object(this.modalRef)['config']['enableClose']['backdrop'] = false
  }
}
