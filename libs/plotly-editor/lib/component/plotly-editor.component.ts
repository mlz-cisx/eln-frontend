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
      this.csvData = this.data.split('\n').map((row: string) => row.split(/\s+|,|;/).map((item: string) => item.trim()));
      this.headers = this.csvData[0];
      this.selectedXasix = this.headers[0]; // assuming first column is X
      this.processData(this.csvData, 0);
    }
    catch {
      console.warn(".csv data not plottable")
    }
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
