import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {EditorModule, TINYMCE_SCRIPT_SRC} from '@tinymce/tinymce-angular';
import {
  WysiwygEditorComponent
} from './components/wysiwyg-editor/wysiwyg-editor.component';


@NgModule({
  declarations: [WysiwygEditorComponent],
  imports: [CommonModule, EditorModule, ReactiveFormsModule],
  exports: [EditorModule, WysiwygEditorComponent],
  providers: [
    {
      provide: TINYMCE_SCRIPT_SRC,
      useValue: 'tinymce/tinymce.min.js'
    }
  ],
})
export class WysiwygEditorModule {
}
