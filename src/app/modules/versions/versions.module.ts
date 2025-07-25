import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { SkeletonsModule } from '@joeseln/skeletons';
import { TableModule } from '@joeseln/table';
import { WysiwygEditorModule } from '@joeseln/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { FinalizeVersionModalComponent } from './components/modals/finalize/finalize.component';
import { VersionPreviewModalComponent } from './components/modals/preview/preview.component';
import { FilePreviewComponent } from './components/previews/file/file.component';
import { LabBookPreviewComponent } from './components/previews/labbook/labbook.component';
import { NotePreviewComponent } from './components/previews/note/note.component';
import { PicturePreviewComponent } from './components/previews/picture/picture.component';
import { VersionsComponent } from './components/versions/versions.component';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [
    VersionsComponent,
    VersionPreviewModalComponent,
    FinalizeVersionModalComponent,
    NotePreviewComponent,
    LabBookPreviewComponent,
    FilePreviewComponent,
    PicturePreviewComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
    TranslocoRootModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    TableModule,
    UserModule,
    SharedModule,
    LoadingModule,
    FormsModule,
    WysiwygEditorModule,
    AlertModule.forRoot(),
    IconsModule,
    SkeletonsModule,
  ],
  exports: [
    VersionsComponent,
    ModalsModule,
    VersionPreviewModalComponent,
    FinalizeVersionModalComponent,
    NotePreviewComponent,
    LabBookPreviewComponent,
    FilePreviewComponent,
    PicturePreviewComponent,
  ],
})
export class VersionsModule {}
