/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {BreakpointObserver} from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import type {LabBookElementEvent, ModalCallback} from '@joeseln/types';
import {
  DialogRef,
  DialogService
} from '@ngneat/dialog';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {take} from 'rxjs/operators';
import {
  ImportLabBookElementsModalComponent
} from '../../components/modals/import-elements/import-elements.component';
import {
  NewLabBookFileElementModalComponent
} from '../modals/new/file/new.component';
import {
  NewLabBookNoteElementModalComponent
} from '../modals/new/note/new.component';
import {
  NewLabBookPictureElementModalComponent
} from '../modals/new/picture/new.component';
import {
  NewLabBookPluginElementModalComponent
} from '../modals/new/plugin/new.component';
import {
  NewLabBookSectionElementModalComponent
} from '../modals/new/section/new.component';
import {
  NewLabBookSketchModalComponent
} from '../modals/new/sketch/new.component';
import {
  NewQRcodeModalComponent
} from "@app/pages/labbooks/components/modals/qrcode/qr_code";
import {
  LabBookPageComponent
} from "@app/pages/labbooks/components/labbook-page/labbook-page.component";
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";
import {
  LabBookDrawBoardNoteComponent
} from "@app/modules/labbook/components/draw-board/note/note.component";
import {LabbooksService} from '@joeseln/services';
import {LabBookElement, LabBookElementPayload} from "@joeseln/types";

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookSidebarComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public projects: string[] = [];

  @Input()
  public editable? = false;

  @Output()
  public created = new EventEmitter<LabBookElementEvent>();

  @Output()
  public refresh = new EventEmitter<boolean>();

  public modalRef?: DialogRef;

  public isMobileMode = false;

  public offsetHeader = 0;

  public offsetMargin = 15;

  public sidebarPosition = 'sticky';

  public constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService,
    private readonly labbook_page: LabBookPageComponent,
    private readonly note_component: LabBookDrawBoardNoteComponent,
    public readonly labBooksService: LabbooksService,
    private readonly drawboardGridComponent: LabBookDrawBoardGridComponent
  ) {
  }

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 992px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.isMobileMode = true;
          return;
        }

        this.isMobileMode = false;
      });

    // const parentElement = document.getElementById('site-header')!.offsetParent as HTMLElement;
    // this.offsetHeader = parentElement.offsetTop + parentElement.offsetHeight;
    this.offsetHeader = 10
  }

  @HostListener('window:scroll', ['$event'])
  public scrollEvent(event: any): void {
    this.setSidebarPosition(event.target.scrollingElement.scrollTop);
  }

  public setSidebarPosition(scrollTop: number): void {
    const drawBoardElement = document.getElementById('labbook-draw-board');
    const offsetTop = drawBoardElement!.offsetTop - this.offsetHeader;

    if (this.isMobileMode) {
      this.sidebarPosition = 'block';
    } else {
      this.sidebarPosition = scrollTop + this.offsetMargin > offsetTop ? 'fixed' : 'sticky';
    }

    this.cdr.markForCheck();
  }

  public onOpenNewNoteElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookNoteElementModalComponent, {
      closeButton: false,
      data: {labBookId: this.id, projects: this.projects},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenSketchModal(): void {
    this.modalRef = this.modalService.open(NewLabBookSketchModalComponent, {
      closeButton: false,
      width: '652px',
      data: {labBookId: this.id, projects: this.projects},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewPictureElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookPictureElementModalComponent, {
      closeButton: false,
      data: {labBookId: this.id, projects: this.projects},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewFileElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookFileElementModalComponent, {
      closeButton: false,
      data: {labBookId: this.id, projects: this.projects},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewPluginElementModal(): void {
    // this.modalRef = this.modalService.open(NewLabBookPluginElementModalComponent, {
    //   closeButton: false,
    //   width: '1200px',
    //   data: {labBookId: this.id, projects: this.projects},
    // });
    //
    // this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenImportModal(): void {
    // this.modalRef = this.modalService.open(ImportLabBookElementsModalComponent, {
    //   closeButton: false,
    //   enableClose: false,
    //   data: {labBookId: this.id, projects: this.projects},
    // });
    //
    // this.modalRef.afterClosed$
    //   .pipe(untilDestroyed(this), take(1))
    //   .subscribe((callback: ModalCallback) => this.onImportModalClose(callback));
  }

  public onOpenNewSectionModal(): void {
    // this.modalRef = this.modalService.open(NewLabBookSectionElementModalComponent, {
    //   closeButton: false,
    //   data: {projects: this.projects},
    // });

    // this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.created.emit(callback.data);
    }
  }

  public onImportModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.refresh.emit(true);
    }
  }

  public gotoTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  public onOpenQRCodeModal() {
    this.modalRef = this.modalService.open(NewQRcodeModalComponent, {
      closeButton: false,
      data: {labBookId: this.id, projects: this.projects},
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }


  public convertToLabBookElementPayload(elements: LabBookElement<any>[]): LabBookElementPayload[] {
    return elements.map(element => ({
      pk: element.pk,
      width: element.width,
      height: element.height,
      position_x: element.position_x,
      position_y: element.position_y,
    }));
  }

  public restructure() {
    const empty_spaces_alt: number[][] = [];
    let max_position = 0;
    let space_count = 0

    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          labBookElements.forEach(element => {
              if (element.position_y > max_position) {
                space_count += (element.position_y - max_position)
                empty_spaces_alt.push(([element.position_y - 1, space_count]))
              }
              if ((element.position_y + element.height) > max_position) {
                max_position = element.position_y + element.height;
              }
            }
          );

          labBookElements.reverse();
          empty_spaces_alt.reverse().forEach(empty_space_elem => {
            labBookElements.forEach(labbook_elem => {
              if (empty_space_elem[0] <= labbook_elem.position_y) {
                labbook_elem.position_y -= empty_space_elem[1]
              }
            })
          })

          const elementsPayload = this.convertToLabBookElementPayload(labBookElements);

          this.labBooksService
            .updateAllElements(this.id, elementsPayload)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.cdr.markForCheck();
                this.drawboardGridComponent.reload();
              },
              () => {
                this.cdr.markForCheck();
              }
            );
        },
        () => {
          this.cdr.markForCheck();
        }
      );

  }


  public continue_search(): void {
    const pos = Number(localStorage.getItem('pageVerticalposition')) || 0;
    localStorage.removeItem('pageVerticalposition');
    const element_pk = localStorage.getItem('element_pk') || 0
    localStorage.removeItem('element_pk');
    const content_type = localStorage.getItem('content_type') || 0
    localStorage.removeItem('content_type');
    let search_text = localStorage.getItem('search_text') || 0
    localStorage.removeItem('search_text');

    // get all possibilities for header and title also for file
    if (document.getElementById(element_pk + '_preloaded_id') && (content_type == 'shared_elements.note' || content_type == 'shared_elements.file' ||
      content_type == 'labbooks.labbook')) {
      // @ts-ignore
      const elem = document.getElementById(element_pk + '_preloaded_id')
      const title = document.getElementById(element_pk + '_title_id')

      // @ts-ignore
      const content = elem.innerHTML
      // @ts-ignore
      if (content.includes(search_text)) {
        // @ts-ignore
        elem.style.border = 'thick solid red'
      }


      // @ts-ignore
      const title_content = title.querySelector('input').value
      // @ts-ignore
      if (title_content.includes(search_text)) {
        // @ts-ignore
        title.style.border = 'thick solid red'
      }

      search_text = '' + search_text

      const highlightedContent = content.replace(
        new RegExp('' + search_text, 'gi'),
        '<span style="background-color: yellow; font-weight: bold">$&</span>'
      );


      // @ts-ignore
      elem.innerHTML = highlightedContent
      window.scrollTo({top: pos, behavior: 'smooth'});
    }


    if (content_type == 'pictures.picture') {
      // @ts-ignore
      const title = document.getElementById(element_pk + '_title_id')
      // @ts-ignore
      const title_content = title.querySelector('input').value
      // @ts-ignore
      if (title_content.includes(search_text)) {
        // @ts-ignore
        title.style.border = 'thick solid red'
      }
      window.scrollTo({top: pos, behavior: 'smooth'});
    }


  }
}
