import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {DialogConfig, provideDialogConfig} from '@ngneat/dialog';
import {ModalComponent} from './components/modal/modal.component';

@NgModule({
  declarations: [ModalComponent],
  providers: [
    provideDialogConfig({
      resizable: true,
      draggable: true,
    })],
  imports: [CommonModule
  ],
  exports: [
    ModalComponent
  ],
})
export class ModalsModule {
}
