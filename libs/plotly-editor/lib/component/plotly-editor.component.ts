import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-plotly-editor',
  templateUrl: './plotly-editor.component.html',
  styleUrl: './plotly-editor.component.css',
})
export class PlotlyEditorComponent {
  @Input()
  public data: any;

  @Input()
  public layout: any;

  @Input()
  public config: any;

}
