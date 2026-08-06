import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import * as fabric from "fabric";
import {ModalState} from "@app/enums/modal-state.enum";
import {DialogRef} from "@ngneat/dialog";
import {LabbooksService, PicturesService} from "@app/services";
import {FormBuilder} from "@ngneat/reactive-forms";
import {LabBookElementPayload} from "@joeseln/types";
import {takeUntil} from "rxjs/operators";
import {TranslocoService} from "@jsverse/transloco";
import {ToastrService} from "ngx-toastr";
import {Subject} from "rxjs";
import domtoimage from 'dom-to-image-more';


@Component({
  selector: 'app-h5web-viewer',
  templateUrl: './h5web-viewer.component.html',
  styleUrl: './h5web-viewer.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class H5webViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  /** HDF5 file data */
  @Input() buffer!: ArrayBuffer;

  /** Display filename of HDF5 file */
  @Input() filename = 'data.h5';


  @Input() element_pos_y: number = -1;

  @Input() labBookId: string = '';

  @ViewChild('h5webContainer', { static: true })
  private container!: ElementRef<HTMLDivElement>;

  public state = ModalState.Unchanged;

  private unsubscribe$ = new Subject<void>();

  private root: ReturnType<typeof createRoot> | null = null;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabbooksService,
    private readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
  ) {
  }

  ngAfterViewInit(): void {
    this.renderReactComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.root) {
      this.renderReactComponent();
    }
  }

  ngOnDestroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private async renderReactComponent(): Promise<void> {
    if (!this.container?.nativeElement || !this.buffer) {
      return;
    }

    if (!this.root) {
      this.root = createRoot(this.container.nativeElement);
    }

    // dynamic imports
    // keep React out of the Angular bundle
    const [{ App }, { H5WasmBufferProvider }] = await Promise.all([
      import('@h5web/app'),
      import('@h5web/h5wasm'),
    ]);

    const element = createElement(
      H5WasmBufferProvider,
      { filename: this.filename, buffer: this.buffer },
      createElement(App, { sidebarOpen: false })
    );

    this.root.render(element);
  }

  public async create_new_sketch(base64Plot: any): Promise<void> {
    // compose the plot image on an offscreen Fabric.js canvas
    const CANVAS_W = 1000;
    const CANVAS_H = 750;

    const staticCanvas = new fabric.StaticCanvas(undefined, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#ffffff',
    });

    try {
      const img = await fabric.Image.fromURL(base64Plot);

      // scale the plot image to fit within 80% of the canvas
      const imgW = img.width!;
      const imgH = img.height!;
      const scale = Math.min(CANVAS_W / imgW, CANVAS_H / imgH) * 0.8;

      img.set({
        left: CANVAS_W / 2,
        top: CANVAS_H / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });

      staticCanvas.add(img);
      staticCanvas.renderAll();

      const composedDataUrl = staticCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.75,
        multiplier: 1,
      });

      const file = this.base64ToFile(composedDataUrl, 'plot.jpeg');

      const formData = new FormData();
      formData.append('title', 'NewSketch');
      formData.append('background_image', file);

      this.picturesService
        .add(formData)
        .subscribe(
          picture => {
            this.state = ModalState.Changed;
            this.createElement(40, picture.pk);
          },
          () => {
            this.cdr.markForCheck();
          }
        );
    } catch (err) {
      console.error('Failed to compose sketch image', err);
      // fallback: upload the original image
      const file = this.base64ToFile(base64Plot, 'plot.png');

      const formData = new FormData();
      formData.append('title', 'NewSketch');
      formData.append('background_image', file);

      this.picturesService
        .add(formData)
        .subscribe(
          picture => {
            this.state = ModalState.Changed;
            this.createElement(40, picture.pk);
          },
          () => {
            this.cdr.markForCheck();
          }
        );
    }
  }

  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
  }

  private createElement(child_object_content_type: number, child_object_id: string, width: number = 10, height: number = 10) {
    if (!this.labBookId) return;
    const elem: LabBookElementPayload = {
      child_object_content_type: child_object_content_type,
      child_object_id: child_object_id,
      width: width,
      height: height,
      position: this.element_pos_y
    }
    this.labBooksService.addElementToRow(this.labBookId, elem).subscribe(() => {
      this.modalRef.close();
      this.translocoService
        .selectTranslate('labBook.newSketchModal.toastr.success')
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((success: string) => {
          this.toastrService.success(success);
        });
    });
  }


  public async exportH5webAsImage(): Promise<void> {
    const dataUrl = await this.captureH5web();
    if (!dataUrl) return;

    await this.create_new_sketch(dataUrl);
  }


  public async downloadH5webPng(): Promise<void> {
    const dataUrl = await this.captureH5web();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${this.filename.replace('.h5', '')}.png`;
    link.click();
  }


  private async captureH5web(): Promise<string | null> {
    const container = this.container?.nativeElement;
    if (!container) return null;

    try {
      const rect = container.getBoundingClientRect();

      return await domtoimage.toPng(container, {
        bgcolor: '#ffffff',
        quality: 1,
        width: rect.width,
        height: rect.height,
        style: {} // no transform!
      });

    } catch (err) {
      console.error('Failed to capture H5Web viewer', err);
      return null;
    }
  }


}
