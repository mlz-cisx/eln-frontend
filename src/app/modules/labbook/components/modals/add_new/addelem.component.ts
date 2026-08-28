import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Output
} from '@angular/core';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {Subject} from 'rxjs';
import type {LabBook} from '@joeseln/types';
import {
  NewLabBookSketchModalComponent
} from "@app/modules/labbook/components/modals/new/sketch/new.component";
import {UntilDestroy} from "@ngneat/until-destroy";
import {
  NewLabBookFileElementModalComponent
} from "@app/modules/labbook/components/modals/new/file/new.component";
import {
  NewLabBookNoteElementModalComponent
} from "@app/modules/labbook/components/modals/new/note/new.component";

@UntilDestroy()
@Component({
  selector: 'mlzeln-add-element-modal',
  templateUrl: './addelem.component.html',
  styleUrls: ['./addelem.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AddElementModalComponent implements OnDestroy {
  @Output()
  public position: number = this.parentmodalRef.data.position;// eslint-disable-line
  public loading: boolean = false;
  public labbooks: LabBook[] = [];
  public selectedType: 'sketch' | 'file' | 'note' = 'sketch'
  private labBookId: string = this.parentmodalRef.data.labBookId; // eslint-disable-line
  private unsubscribe$ = new Subject<void>();

  public constructor(
    public parentmodalRef: DialogRef,
    public childmodalRef: DialogRef,
    private modalService: DialogService,
  ) {
  }

  ngOnInit(): void {
  }


  proceed(): void {
    if (this.loading) {
      return
    }
    if (this.selectedType === 'sketch') {
      this.onOpenSketchModal(this.position);
    } else if (this.selectedType === 'file') {
      this.onOpenFileModal(this.position)
    } else if (this.selectedType === 'note') {
      this.onOpenNoteModal(this.position)
    }

    // close the AddElement modal after dispatching
    this.parentmodalRef.close();

  }

  public onOpenSketchModal(position: number): void {
    this.childmodalRef = this.modalService.open(NewLabBookSketchModalComponent, {
      closeButton: false,
      width: '652px',
      data: {
        labBookId: this.labBookId,
        position: position
      },
    });


  }

  public onOpenFileModal(position: number): void {
    this.childmodalRef = this.modalService.open(NewLabBookFileElementModalComponent, {
      closeButton: false,
      width: '652px',
      data: {
        labBookId: this.labBookId,
        position: position
      },
    });


  }

  public onOpenNoteModal(position: number): void {
    this.childmodalRef = this.modalService.open(NewLabBookNoteElementModalComponent, {
      closeButton: false,
      width: '652px',
      data: {
        labBookId: this.labBookId,
        position: position
      },
    });

  }

  ngOnDestroy() {
    // unsubscribe everything at modal exit
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }



}
