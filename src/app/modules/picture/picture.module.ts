import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ModalsModule } from '@joeseln/modals';
import { PictureEditorModule } from '@joeseln/picture-editor';
import { IconsModule } from 'libs/icons/src/lib/icons.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PictureEditorModalComponent } from './modals/editor.component';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [PictureEditorModalComponent],
  imports: [
    CommonModule,
    LoadingModule,
    TooltipModule.forRoot(),
    SharedModule,
    IconsModule,
    TranslocoRootModule,
    ModalsModule,
    PictureEditorModule,
  ],
  exports: [PictureEditorModalComponent],
})
export class PictureModule {}
