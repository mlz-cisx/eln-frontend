import {FabricImage} from 'fabric';
import {gzip} from 'pako';
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
    try {
      const image = await FabricImage.fromURL(base64Plot);
      const scale = Math.min(1000 / image.width, 750 / image.height);
      image.set({
        left: 500,
        top: 375,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });
      const content = JSON.stringify({
        objects: [image.toObject()],
        background: '#ffffff',
      });
      // bypass image compresion
      const canvasContent = new Blob([gzip(content)], {type: 'application/gzip'});
      const formData = new FormData();
      formData.append('title', 'NewSketch');
      formData.append('canvas_content', canvasContent, 'canvas.json.gz');
      formData.append('labbook_pk', this.labBookId);

      this.picturesService.add(formData).subscribe(
        picture => {
          this.state = ModalState.Changed;
          this.createElement(40, picture.pk);
        },
        () => this.cdr.markForCheck()
      );
    } catch (err) {
      console.error('Failed to create sketch from plot', err);
    }
  }


  private createElement(child_object_content_type: number, child_object_id: string, width: number = 13, height: number = 14) {
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
        scale: 3,
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
