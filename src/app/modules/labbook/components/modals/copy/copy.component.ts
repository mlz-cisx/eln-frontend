import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LabbooksService, NotesService, PicturesService } from '@app/services';
import type { LabBook, LabBookElementPayload, NotePayload, PicturePayload } from '@joeseln/types';
import {ToastrService} from 'ngx-toastr';
import {TranslocoService} from '@jsverse/transloco';
import * as pako from "pako";

@Component({
    selector: 'mlzeln-copy-element-modal',
    templateUrl: './copy.component.html',
    styleUrls: ['./copy.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CopyElementModalComponent implements OnDestroy {
  private element: any = this.modalRef.data.element; // eslint-disable-line

  private labBookId: string = this.modalRef.data.labBookId; // eslint-disable-line

  private unsubscribe$ = new Subject<void>();

  public loading: boolean = true;

  public labbooks: LabBook[] = [];

  public selectedLabook: string | null = null;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabbooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly notesService: NotesService,
    private readonly picturesService: PicturesService,
  ) {}

  ngOnInit(): void {
    this.labBooksService.getList()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        // exclude current labbook
        this.labbooks = data.data.filter(labBook => labBook.pk !== this.labBookId);
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    if (!this.selectedLabook || this.loading) {
      return
    }

    /* eslint-disable */
    // copy note element
    if (this.element.content_type == 30) {
      const note: NotePayload = {subject: this.element.subject, content: this.element.content}
      this.copyNote(note)
    }
    // copy picture element and compress canvas_content
    else if (this.element.content_type == 40) {
      this.picturesService.get_content(this.element.pk)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((data) => {
          const content_blob = this.compressContent(data.canvas_content);
          const pic: PicturePayload = {
            title: this.element.title,
            canvas_content: content_blob,
          };
          this.copyPicture(pic);
        });
    }
    /* eslint-enable */
  }

  public compressContent(content: string): Blob {
    const compressed = pako.gzip(content); // Uint8Array
    return new Blob([compressed], {type: "application/gzip"});
  }

  private copyNote(note: NotePayload) {
    this.notesService.add(note)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(note => {
        this.createElement(30, note.pk);
      });
  }

  private copyPicture(pic: PicturePayload) {
    this.picturesService.add(pic)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((pic) => {
      this.createElement(40, pic.pk);
    });
  }

  private createElement(child_object_content_type: number, child_object_id: string, width: number = 10, height: number = 10) {
    if (!this.selectedLabook) return;
    const elem: LabBookElementPayload = {
        child_object_content_type: child_object_content_type,
        child_object_id: child_object_id,
        width: width,
        height: height,
    }
    this.labBooksService.addElementBottom(this.selectedLabook, elem).subscribe(() => {
        this.modalRef.close();
        this.translocoService
          .selectTranslate('labBook.copyElement.toastr.success')
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe((success: string) => {
            this.toastrService.success(success);
          });
    });
  }

  ngOnDestroy() {
    // unsubscribe everything at modal exit
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
