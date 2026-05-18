import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { HttpClient } from "@angular/common/http";
import { Graph, allowedBioTypes } from '../../draw-board/file/file.component';

@Component({
  selector: 'mlzeln-plot-modal',
  templateUrl: './plot-modal.component.html',
  styleUrls: ['./plot-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class PlotModalComponent {

  allowedBioTypes = allowedBioTypes;

  private download: string = this.modalRef.data.download; // eslint-disable-line

  public graph: Graph = this.modalRef.data.graph; // eslint-disable-line

  public loading: boolean = true;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly cdr: ChangeDetectorRef,
    private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {

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

