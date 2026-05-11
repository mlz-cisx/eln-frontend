import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-plotly-editor',
    templateUrl: './plotly-editor.component.html',
    styleUrl: './plotly-editor.component.css',
    standalone: false
})
export class PlotlyEditorComponent {
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

}
