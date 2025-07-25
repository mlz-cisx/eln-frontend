import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule as AngularFormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AngularFormsModule,
    ReactiveFormsModule,
    OverlayModule,
    NgSelectModule,
    NgOptionHighlightModule,
    ColorPickerModule,
  ],
  exports: [AngularFormsModule,
    ReactiveFormsModule,
    OverlayModule, NgSelectModule, NgOptionHighlightModule, ColorPickerModule],
})
export class FormsModule {}
