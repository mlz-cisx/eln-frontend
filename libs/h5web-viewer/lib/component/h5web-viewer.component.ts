import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

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

  @ViewChild('h5webContainer', { static: true })
  private container!: ElementRef<HTMLDivElement>;

  private root: ReturnType<typeof createRoot> | null = null;

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
}
