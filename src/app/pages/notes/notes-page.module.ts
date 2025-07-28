import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { SkeletonsModule } from '@joeseln/skeletons';
import { TableModule } from '@joeseln/table';
import { WysiwygEditorModule } from '@joeseln/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NotePageComponent } from './components/note-page/note-page.component';
import { NotesPageComponent } from './components/notes-page/notes-page.component';
import { NotesPageRoutingModule } from './notes-page-routing.module';

@NgModule({
  declarations: [NotesPageComponent,  NotePageComponent],
  imports: [
    CommonModule,
    NotesPageRoutingModule,
    TranslocoRootModule,
    FormsModule,
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
    FormHelperModule,
    ModalsModule,
    TableModule,
    TrashModule,
    UserModule,
    RecentChangesModule,
    SharedModule,
    VersionsModule,
    LoadingModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    IconsModule,
    SkeletonsModule,
    CommentModule,
    TooltipModule.forRoot(),
  ],
})
export class NotesPageModule {}
