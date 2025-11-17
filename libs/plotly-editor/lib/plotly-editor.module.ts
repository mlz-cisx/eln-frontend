import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {PlotlyEditorComponent} from "./component/plotly-editor.component";


import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

PlotlyModule.plotlyjs = PlotlyJS;


@NgModule({
  declarations: [PlotlyEditorComponent],
  imports: [CommonModule, PlotlyModule, FormsModule],
  exports: [PlotlyEditorComponent]
})
export class PlotlyEditorModule {
}
