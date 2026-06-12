import {ChangeDetectorRef, Component, Input, ViewChild} from '@angular/core';
import {LabBookElementPayload} from "@joeseln/types";
import {takeUntil} from "rxjs/operators";
import {ModalState} from "@app/enums/modal-state.enum";
import {DialogRef} from "@ngneat/dialog";
import {LabbooksService, PicturesService} from "@app/services";
import {FormBuilder} from "@ngneat/reactive-forms";
import {TranslocoService} from "@jsverse/transloco";
import {ToastrService} from "ngx-toastr";
import {Subject} from "rxjs";

declare const Plotly: any;



@Component({
  selector: 'app-plotly-editor',
  templateUrl: './plotly-editor.component.html',
  styleUrl: './plotly-editor.component.css',
  standalone: false
})
export class PlotlyEditorComponent {
  public state = ModalState.Unchanged;
  @Input() element_pos_y: number = -1;
  @Input() labBookId: string = '';


  @ViewChild('plot', {static: false}) plotComponent: any;

  @Input() showSketchButton: boolean = false;
  private unsubscribe$ = new Subject<void>();

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


  @Input()
  public data: string = '';

  public csvData: string[][] = [];

  public plotData: any; // eslint-disable-line

  public headers: string[] = [];

  public selectedXasix: string = '';

  ngOnInit(): void {
    try {
      const rows = this.data
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0 && !r.startsWith('#'));  // ignore metadata

      this.csvData = rows.map((row: string) =>
        row.split(/,|;|\s+/).map((item: string) => item.trim())
      );

      // Repair duplicate headers
      this.headers = this.repairHeaders(this.csvData[0]);

      this.selectedXasix = this.headers[0];
      this.processData(this.csvData, 0);
    } catch {
      console.warn(".csv data not plottable");
    }
  }


  private repairHeaders(headers: string[]): string[] {
    const seen: Record<string, number> = {};
    return headers.map(h => {
      if (!seen[h]) {
        seen[h] = 1;
        return h;
      }
      // Duplicate → rename
      const newName = `${h}_${seen[h]}`;
      seen[h] += 1;
      return newName;
    });
  }


  processData(csvData: string[][], xIndex: number) {
    if (csvData.length === 0) return;
    const traces = this.headers.slice(1).map((header: string, index: number) => {
      const x = csvData.map(row => row[xIndex]);
      const y = csvData.map(row => row[index + 1]);
      return {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines+markers',
        name: header,
      };
    });
    this.plotData = traces;
  }

  onChangeXaxis() {
    const xIndex = this.headers.indexOf(this.selectedXasix);
    if (xIndex === -1) return;

    this.processData(this.csvData, xIndex)
  }

  public async exportPlotAsImage() {
    if (!this.plotComponent) return;

    const element = this.plotComponent.plotEl.nativeElement;

    try {
      const dataUrl = await Plotly.toImage(element, {
        format: 'png',
        width: 1200,
        height: 800
      });

      this.create_new_sketch(dataUrl)

    } catch (err) {
      console.error('Failed to export plot', err);
    }
  }


  public create_new_sketch(base64Plot: any): void {
    const file = this.base64ToFile(base64Plot, 'plot.png');

    const formData = new FormData();
    formData.append('title', 'NewSketch');
    formData.append('background_image', file); // UploadFile


    this.picturesService
      .add(formData)
      .subscribe(
        picture => {
          this.state = ModalState.Changed;
          this.createElement(40, picture.pk)
        },
        () => {
          this.cdr.markForCheck();
        }
      );
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


}
