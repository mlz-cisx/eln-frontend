import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-plotly-editor',
    templateUrl: './plotly-editor.component.html',
    styleUrl: './plotly-editor.component.css',
    standalone: false
})
export class PlotlyEditorComponent {
  @Input()
  public data: any;

  @Input()
  public layout: any;

  @Input()
  public config: any;

}
