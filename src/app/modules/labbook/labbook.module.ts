import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { TableModule } from '@joeseln/table';
import { WysiwygEditorModule } from '@joeseln/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@jsverse/transloco';
import { GridsterModule } from 'angular-gridster2';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LabBookDrawBoardComponent } from './components/draw-board/draw-board/draw-board.component';
import { LabBookDrawBoardElementComponent } from './components/draw-board/element/element.component';
import { LabBookDrawBoardFileComponent } from './components/draw-board/file/file.component';
import { LabBookDrawBoardGridComponent } from './components/draw-board/grid/grid.component';
import { LabBookDrawBoardNoteComponent } from './components/draw-board/note/note.component';
import { LabBookDrawBoardPictureComponent } from './components/draw-board/picture/picture.component';
import { LabBookElementDropdownComponent } from './components/element-dropdown/element-dropdown.component';
import { NewLabBookFileElementModalComponent } from './components/modals/new/file/new.component';
import { NewLabBookNoteElementModalComponent } from './components/modals/new/note/new.component';
import { NewLabBookSketchModalComponent } from './components/modals/new/sketch/new.component';
import { LabBookSidebarComponent } from './components/sidebar/sidebar.component';
import { CommentModule } from '../comment/comment.module';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { PictureModule } from '../picture/picture.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { RecentChangesModalComponent } from './components/modals/recent-changes/recent-changes.component';
import { CopyElementModalComponent } from './components/modals/copy/copy.component';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { PlotlyEditorModule } from '../../../../libs/plotly-editor/lib/plotly-editor.module';
import { MathjaxModule } from 'mathjax-angular';
import {MolViewerModule} from "../../../../libs/mol-viewer/mol-viewer.module";
import {
  FabricCanvasModule
} from "../../../../libs/fabric-canvas/fabric-canvas.module";

@NgModule({
  declarations: [
    LabBookSidebarComponent,
    NewLabBookNoteElementModalComponent,
    LabBookDrawBoardComponent,
    LabBookSidebarComponent,
    LabBookDrawBoardElementComponent,
    LabBookDrawBoardNoteComponent,
    LabBookElementDropdownComponent,
    LabBookDrawBoardGridComponent,
    LabBookDrawBoardFileComponent,
    LabBookDrawBoardPictureComponent,
    NewLabBookFileElementModalComponent,
    NewLabBookSketchModalComponent,
    RecentChangesModalComponent,
    CopyElementModalComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
    FormsModule,
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
    UserModule,
    FormHelperModule,
    TableModule,
    TooltipModule.forRoot(),
    LoadingModule,
    SharedModule,
    RouterModule,
    WysiwygEditorModule,
    GridsterModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    IconsModule,
    AlertModule,
    PictureModule,
    CommentModule,
    RecentChangesModule,
    PlotlyEditorModule,
    MathjaxModule.forChild(),
    MolViewerModule,
    FabricCanvasModule
  ],
  exports: [
    LabBookSidebarComponent,
    NewLabBookNoteElementModalComponent,
    LabBookDrawBoardComponent,
    LabBookSidebarComponent,
    LabBookDrawBoardElementComponent,
    LabBookDrawBoardNoteComponent,
    LabBookElementDropdownComponent,
    LabBookDrawBoardGridComponent,
    LabBookDrawBoardFileComponent,
    LabBookDrawBoardPictureComponent,
    NewLabBookFileElementModalComponent,
    NewLabBookSketchModalComponent,
    RecentChangesModalComponent,
    CopyElementModalComponent,
  ],
})
export class LabBookModule {}
