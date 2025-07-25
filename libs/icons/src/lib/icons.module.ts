import { CommonModule } from '@angular/common';
import {
  NgModule,
} from '@angular/core';
import { IconComponent } from './components/icon/icon.component';

@NgModule({
  declarations: [IconComponent],
  imports: [CommonModule],
  exports: [IconComponent],
})
export class IconsModule {}
