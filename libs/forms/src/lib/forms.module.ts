import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule as AngularFormsModule,
  ReactiveFormsModule
} from '@angular/forms';
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
    ColorPickerModule,
  ],
  exports: [AngularFormsModule,
    ReactiveFormsModule,
    OverlayModule,
    NgSelectModule,
    ColorPickerModule,
  ],
})
export class FormsModule {}
