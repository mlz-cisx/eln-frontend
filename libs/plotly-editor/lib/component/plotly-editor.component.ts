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
  @Input() table_integration: boolean = true;

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

  public plotLayout: any; // eslint-disable-line

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

  public numericFilters: {
    min: string;
    max: string;
  }[] = [];

  public numericColumnFlags: boolean[] = [];


  public selectedColumns: boolean[] = [];
  public selectedRows: boolean[] = [];
  public selectAllColumns = true;
  public selectAllRows = true;


  @ViewChild('dragScroll', {static: false})
  dragScroll!: ElementRef<HTMLDivElement>;

  private dragScrollInitialized = false;

  private fullTable: string[][] = [];

  /** current x-axis range filter (set by zoom/pan) */
  private xRangeFilter: { min: string | number, max: string | number } | null = null;

  /** current columns visible in the table trace */
  private visibleHeaders: string[] = [];

  tableCollapsed = false;
  isToggleDisabled = false;


  get filteredAndSortedRows(): string[][] {
    let rows = [...this.tableRows];

    rows = rows.filter((row, i) => {
      // text filters
      const textMatch = row.every((cell, colIndex) =>
        !this.filters[colIndex] ||
        cell.toLowerCase().includes(this.filters[colIndex].toLowerCase())
      );

      if (!textMatch) return false;

      // numeric filters
      return row.every((cell, colIndex) => {
        if (!this.numericColumnFlags[colIndex]) return true;

        const value = Number(cell);
        const {min, max} = this.numericFilters[colIndex];

        // Proper normalization: null, '', undefined → inactive
        const minActive = min != null && min !== '' && !isNaN(+min);
        const maxActive = max != null && max !== '' && !isNaN(+max);

        if (minActive && value < +min) return false;
        return !(maxActive && value > +max);
      });

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

    // build columns for the table trace
    const columns = this.headers.map((_, colIdx) =>
      csvData.slice(1).map(row => {
        const value = row[colIdx];
        return value.length > 7 ? value.slice(0, 7) + '…' : value;
      })
    );
    this.fullTable = columns;
    this.visibleHeaders = [...this.headers];
    this.xRangeFilter = null;

    const tableTrace = this.buildTableTrace(columns);

    this.plotData = [...traces, tableTrace];

    this.plotLayout = {
      yaxis: {domain: [0.4, 1], automargin: true},
      margin: {t: 10, l: 50, r: 10, b: 10},
    };

    this.tableHeaders = this.headers;
    this.tableRows = csvData.slice(1);

    // Initialize selection AFTER tableRows is set
    this.selectedColumns = new Array(this.headers.length).fill(true);
    this.selectedRows = new Array(this.tableRows.length).fill(true);
    this.filters = new Array(this.headers.length).fill('');


    this.sortColumn = 0;
    this.sortDirection = 'asc';
    this.numericFilters = this.headers.map(() => ({min: '', max: ''}));
    this.numericColumnFlags = this.headers.map((_, i) =>
      this.tableRows.every(row => !isNaN(Number(row[i])))
    );

  }

  isNumericColumn(colIndex: number): boolean {
    return this.numericColumnFlags[colIndex] ?? false;
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


  async toggleTable() {
    // disable button
    this.isToggleDisabled = true;

    this.tableCollapsed = !this.tableCollapsed;

    this.plotData.forEach((t: any) => t.visible = true);

    const hasTable = this.plotData.some((t: any) => t.type === 'table');

    if (this.tableCollapsed && hasTable) {
      // remove table trace
      this.plotData = this.plotData.filter((t: any) => t.type !== 'table');

      // scatter takes full height
      this.plotLayout = {
        ...this.plotLayout,
        yaxis: {domain: [0, 1], autorange: true},
        xaxis: {autorange: true},
        margin: {...this.plotLayout.margin, b: 60}
      };

    } else if (!this.tableCollapsed && !hasTable) {
      // rebuild table trace
      const tableTrace = this.buildTableTrace(this.fullTable);
      this.plotData = [...this.plotData, tableTrace];

      // restore split domains
      this.plotLayout = {
        ...this.plotLayout,
        yaxis: {domain: [0.4, 1], autorange: true},
        xaxis: {autorange: true},
        margin: {...this.plotLayout.margin, b: 10}
      };
    }

    this.isToggleDisabled = false;
    this.cdr.detectChanges();
  }


  private buildTableTrace(columns: string[][]) {
    return {
      type: 'table',
      uuid: 'tableTrace',
      columnwidth: this.headers.map(() => 60),
      header: {
        values: this.headers,
        align: 'left',
        line: {width: 1, color: '#ddd'},
        fill: {color: '#f0f0f0'},
        font: {size: 11, color: '#000'},
      },
      cells: {
        values: columns,
        align: 'left',
        line: {width: 1, color: '#ddd'},
        fill: {color: ['#ffffff', '#f7f7f7']},
        font: {size: 10, color: '#333'},
      },
      domain: {x: [0, 1], y: [0, 0.3]},
    };
  }


  /**
   * Handles plotly_relayout (zoom, pan, reset).
   * filters the table trace data
   */
  onRelayout(event: any) {
    if (!this.csvData.length || !this.headers.length || !this.fullTable.length) return;

    const xIndex = this.headers.indexOf(this.selectedXasix);
    if (xIndex === -1) return;

    let rangeMin: string | number | null = null;
    let rangeMax: string | number | null = null;
    let autorange = false;

    if (event['xaxis.autorange'] === true) {
      autorange = true;
    } else {
      const r0 = event['xaxis.range[0]'] ?? event.xaxis?.range?.[0] ?? null;
      const r1 = event['xaxis.range[1]'] ?? event.xaxis?.range?.[1] ?? null;
      if (r0 != null && r1 != null) {
        rangeMin = r0;
        rangeMax = r1;
      }
    }

    // if no meaningful range
    // null -> full range
    this.xRangeFilter =  (!autorange && rangeMin != null && rangeMax != null)
      ? {min: rangeMin, max: rangeMax}
      : null;

    this.rebuildTable();
  }

  /**
   * Handles plotly_restyle (legend click toggling trace visibility).
   * updates visible-headers
   */
  onRestyle(event: any) {
    if (!this.fullTable.length || !this.headers.length) return;

    const updates = event[0];
    const traceIndexes = event[1];
    if (!updates || !('visible' in updates) || !traceIndexes || !traceIndexes.length) return;

    // - single click: traceIndexes has 1 element, updates.visible has 1 element
    // - double click: traceIndexes has N elements, updates.visible has N elements
    for (let i = 0; i < traceIndexes.length; i++) {
      const traceIdx = traceIndexes[i];
      const visibleVal = updates.visible[i];

      const headerName = this.headers[traceIdx + 1]; // +1 because headers[0] is X

      if (visibleVal === true) {
        if (!this.visibleHeaders.includes(headerName)) {
          const insertIdx = traceIdx + 1; // traceIdx 0 → headers position 1
          this.visibleHeaders.splice(insertIdx, 0, headerName);
        }
      } else {
        // 'legendonly' → hide this column
        this.visibleHeaders = this.visibleHeaders.filter(h => h !== headerName);
      }
    }

    this.rebuildTable();
  }

  /**
   * Rebuilds the table trace by applying both the range (zoom/pan) and
   * visibility
   */
  private rebuildTable() {

    // filter visible headers
    const colIndexes = this.visibleHeaders
      .map(h => this.headers.indexOf(h))
      .filter(i => i !== -1);

    if (!colIndexes.length) return;

    // filter by range
    let dataRows = this.csvData.slice(1);
    if (this.xRangeFilter) {
      const xIndex = this.headers.indexOf(this.selectedXasix);
      if (xIndex !== -1) {
        const {min: rangeMin, max: rangeMax} = this.xRangeFilter;
        dataRows = dataRows.filter(row => {
          const xVal = row[xIndex];
          const xNum = Number(xVal);
          const minNum = Number(rangeMin);
          const maxNum = Number(rangeMax);
          if (!isNaN(xNum) && !isNaN(minNum) && !isNaN(maxNum)) {
            return xNum >= minNum && xNum <= maxNum;
          }
          return String(xVal) >= String(rangeMin) && String(xVal) <= String(rangeMax);
        });
      }
    }

    // build truncated columns
    const newColumns = colIndexes.map(ci =>
      dataRows.map(row => {
        const value = row[ci];
        return value.length > 7 ? value.slice(0, 7) + '…' : value;
      })
    );

    const newHeaders = colIndexes.map(ci => this.headers[ci]);

    // update table trace
    this.plotData = this.plotData.map((trace: any) => {
      if (trace.type === 'table') {
        return {
          ...trace,
          header: {...trace.header, values: newHeaders},
          cells: {...trace.cells, values: newColumns},
        };
      }
      return trace;
    });
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
