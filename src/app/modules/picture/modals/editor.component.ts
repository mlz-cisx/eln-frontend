import {
  afterEveryRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {PicturesService} from '@joeseln/services';
import type {Picture} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {UntilDestroy} from '@ngneat/until-destroy';
import {
  FabricCanvasComponent
} from "../../../../../libs/fabric-canvas/component/fabric-canvas.component";

@UntilDestroy()
@Component({
  selector: 'mlzeln-picture-editor-modal',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class PictureEditorModalComponent implements OnInit {
  @ViewChild('fabricCanvas', {static: false}) fabricCanvas!: FabricCanvasComponent;
  @ViewChild('container', {static: false}) containerRef!: ElementRef<HTMLDivElement>;


  public initialState?: Picture = this.modalRef.data?.initialState;

  public state = ModalState.Unchanged;

  public privileges = this.modalRef.data?.privileges;

  public editor_loaded = true;

  private lastWidth = 0;
  private lastHeight = 0;

  public constructor(public readonly modalRef: DialogRef, public readonly picturesService: PicturesService, public readonly cdr: ChangeDetectorRef,) {
    afterEveryRender(() => {
      this.resizeChild()
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.fabricCanvas.storeCanvas()
  }


  public getBackgroundUrl(): string | null {
    try {
      const url = this.initialState?.download_background_image
      if (!url) return null;
      // Basic URL validation
      const parsed = new URL(url); // throws if invalid
      return parsed.toString();
    } catch (err) {
      console.error('Invalid background URL:', err);
      return null;
    }
  }

  private resizeChild(): void {

    if (!this.containerRef?.nativeElement || !this.fabricCanvas) return;
    const parentEl = this.containerRef.nativeElement;
    const width = parentEl.clientWidth;
    // Only resize if dimensions actually changed
    if (width !== this.lastWidth) {
      // heuristic value
      this.lastWidth = Math.min(width, this.fabricCanvas.BASE_WIDTH)
      this.fabricCanvas.setCanvasSize(this.lastWidth);
    }
  }

}
