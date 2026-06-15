import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import {LabBookElementPayload} from "@joeseln/types";
import {takeUntil} from "rxjs/operators";
import {ModalState} from "@app/enums/modal-state.enum";
import {DialogRef} from "@ngneat/dialog";
import {LabbooksService, PicturesService} from "@app/services";
import {FormBuilder} from "@ngneat/reactive-forms";
import {TranslocoService} from "@jsverse/transloco";
import {ToastrService} from "ngx-toastr";
import {Subject} from "rxjs";
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PlotlyViaCDNModule} from 'angular-plotly.js';

declare const Plotly: any;


@Component({
  selector: 'app-plotly-editor',
  templateUrl: './plotly-editor.component.html',
  styleUrl: './plotly-editor.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule, PlotlyViaCDNModule]
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

  public showTable = false;

  public tableHeaders: string[] = [];
  public tableRows: string[][] = [];

  // Sorting
  public sortColumn: number | null = null;
  public sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  public filters: string[] = [];

  public selectedColumns: boolean[] = [];
  public selectedRows: boolean[] = [];
  public selectAllColumns = true;
  public selectAllRows = true;


  @ViewChild('dragScroll', {static: false})
  dragScroll!: ElementRef<HTMLDivElement>;

  private dragScrollInitialized = false;

  get filteredAndSortedRows(): string[][] {
    let rows = [...this.tableRows];

    // filtering
    rows = rows.filter((row, i) => {
      const match = row.every((cell, colIndex) =>
        !this.filters[colIndex] ||
        cell.toLowerCase().includes(this.filters[colIndex].toLowerCase())
      );

      return match;
    });

    // ensure selectedRows matches filtered rows
    if (rows.length !== this.selectedRows.length) {
      this.selectedRows = new Array(rows.length).fill(true);
    }

    // sorting
    if (this.sortColumn !== null) {
      const col = this.sortColumn;
      rows.sort((a, b) =>
        this.sortDirection === 'asc'
          ? a[col].localeCompare(b[col], undefined, {numeric: true})
          : b[col].localeCompare(a[col], undefined, {numeric: true})
      );
    }

    return rows;
  }

  ngAfterViewChecked() {
    if (this.showTable && !this.dragScrollInitialized && this.dragScroll) {
      this.dragScrollInitialized = true;
      this.enableDragScroll();
    }

    if (!this.showTable && this.dragScrollInitialized) {
      this.dragScrollInitialized = false;
    }
  }

  enableDragScroll() {
    const el = this.dragScroll.nativeElement;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    el.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      el.classList.add('dragging');

      startX = e.pageX - el.offsetLeft;
      startY = e.pageY - el.offsetTop;

      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
    });

    const stopDragging = () => {
      isDragging = false;
      el.classList.remove('dragging');
    };

    el.addEventListener('mouseleave', stopDragging);
    el.addEventListener('mouseup', stopDragging);

    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      const x = e.pageX - el.offsetLeft;
      const y = e.pageY - el.offsetTop;

      const walkX = (x - startX) * -1;
      const walkY = (y - startY) * -1;

      el.scrollLeft = scrollLeft + walkX;
      el.scrollTop = scrollTop + walkY;
    });
  }

  ngOnInit(): void {
    PlotlyViaCDNModule.loadViaCDN('custom', '/plotly/plotly.min.js');
    try {
      const rows = this.data
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0 && !r.startsWith('#'));  // ignore metadata

      this.csvData = this.parse(this.data);
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

  public exportSelectedAsCSV(): void {
    const selectedColIndexes = this.selectedColumns
      .map((v, i) => v ? i : -1)
      .filter(i => i !== -1);

    const selectedRowData = this.filteredAndSortedRows
      .filter((_, i) => this.selectedRows[i])
      .map(row => selectedColIndexes.map(ci => row[ci]));

    const selectedHeaderData = selectedColIndexes.map(i => this.tableHeaders[i]);

    const csvContent = this.buildCSV(selectedHeaderData, selectedRowData);
    this.downloadCSV(csvContent, 'export.csv');
  }


  onSort(colIndex: number) {
    if (this.sortColumn === colIndex) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = colIndex;
      this.sortDirection = 'asc';
    }
  }

  onFilter(colIndex: number, value: string) {
    this.filters[colIndex] = value;
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

    this.tableHeaders = this.headers;
    this.tableRows = csvData.slice(1);

    // Initialize selection AFTER tableRows is set
    this.selectedColumns = new Array(this.headers.length).fill(true);
    this.selectedRows = new Array(this.tableRows.length).fill(true);
    this.filters = new Array(this.headers.length).fill('');


    this.sortColumn = 0;
    this.sortDirection = 'asc';
  }

  toggleSelectAllColumns() {
    this.selectedColumns = this.selectedColumns.map(() => this.selectAllColumns);
  }

  toggleSelectAllRows() {
    this.selectedRows = this.selectedRows.map(() => this.selectAllRows);
  }

  isRowActive(rowIndex: number): boolean {
    const rowSelected = this.selectedRows[rowIndex];
    const anyColumnSelected = this.selectedColumns.some(c => c);
    return rowSelected && anyColumnSelected;
  }

  private parse(csv: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';

    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const next = csv[i + 1];

      // Opening or closing quotes
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (quoteChar === char) {
          // Escaped quote inside quoted field
          if (next === quoteChar) {
            currentField += char;
            i++;
            continue;
          }
          inQuotes = false;
        }
        continue;
      }
      // Separator (only when not inside quotes)
      if (!inQuotes && (char === ',' || char === ';')) {
        currentRow.push(currentField.trim());
        currentField = '';
        continue;
      }
      // Newline ends a row (only when not inside quotes)
      if (!inQuotes && (char === '\n' || char === '\r')) {
        if (currentField.length > 0 || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        continue;
      }
      // Normal character
      currentField += char;
    }
    // Push last row if needed
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }
    return rows;
  }

  private buildCSV(headers: string[], rows: string[][]): string {
    const escape = (value: string) => {
      if (value == null) return '';
      const v = value.replace(/"/g, '""');
      return `"${v}"`;
    };

    const headerLine = headers.map(escape).join(',');
    const rowLines = rows.map(r => r.map(escape).join(','));

    return [headerLine, ...rowLines].join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
