import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FabricCanvasComponent} from "./component/fabric-canvas.component";



@NgModule({
  declarations: [],
  imports: [CommonModule, FabricCanvasComponent],
  exports: [FabricCanvasComponent]
})
export class FabricCanvasModule {
}