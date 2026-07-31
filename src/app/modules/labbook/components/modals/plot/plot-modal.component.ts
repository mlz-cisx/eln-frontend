import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { HttpClient } from "@angular/common/http";
import { Graph, allowedBioTypes } from '../../draw-board/file/file.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'mlzeln-plot-modal',
  templateUrl: './plot-modal.component.html',
  styleUrls: ['./plot-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class PlotModalComponent {

  public isFromPlotModal: boolean = this.modalRef.data.isFromPlotModal;

  public element_pos_y: number = this.modalRef.data.element_pos_y;

  public labBookId: string = this.modalRef.data.labBookId;

  public table_integration: boolean = this.modalRef.data.table_integration;

  allowedBioTypes = allowedBioTypes;

  private download: string = this.modalRef.data.download; // eslint-disable-line

  public graph: Graph = this.modalRef.data.graph; // eslint-disable-line

  public loading: boolean = true;

  public h5Buffer: ArrayBuffer | null = null;

  public h5Filename = '';

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly cdr: ChangeDetectorRef,
    private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    if (this.graph.graph_type === 'h5') {
      this.loadH5File();
    } else {
      this.httpClient.get(this.download, { responseType: 'text' })
        .subscribe({
          next: (data) => {
            this.graph.graph_data = data;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error loading file:', err)
        });
    }
  }

  private async loadH5File(): Promise<void> {
    try {
      const buffer = await firstValueFrom(
        this.httpClient.get(this.download, { responseType: 'arraybuffer' })
      );

      this.h5Buffer = buffer;
      this.h5Filename = this.modalRef.data.filename || 'data.h5';

      this.loading = false;
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error loading HDF5 file:', err);
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
