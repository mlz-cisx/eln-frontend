import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslocoRootModule} from '@app/transloco-root.module';
import {FormsModule} from '@joeseln/forms';
import {IconsModule} from '@joeseln/icons';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {
  CustomControlErrorComponent
} from './control-error/control-error.component';
import {CustomToastComponent} from './toastr/toastr.component';
import {
  OverviewCollapseElementComponent
} from './overview-collapse-element/overview-collapse-element.component';
import {LoadingModule} from '../loading/loading.module';
import {WysiwygEditorModule} from '@joeseln/wysiwyg-editor';
import {
  DetailsCollapseElementComponent
} from './details-collapse-element/details-collapse-element.component';
import {
  AuthDownloadDirective
} from './directives/auth-download/auth-download.directive';
import {
  SecondaryCollapseElementComponent
} from './secondary-collapse-element/secondary-collapse-element.component';
import { FormatContentTypeModelPipe } from './pipes/content-type-model/content-type-model.pipe';
import { FormatDatePipe } from './pipes/format-date/format-date.pipe';
import { FormatFileSizePipe } from './pipes/format-file-size/format-file-size.pipe';
import { FormatSpeakingDatePipe } from './pipes/format-speaking-date/format-speaking-date.pipe';
import { SafeHtmlPipe } from './pipes/safe-html/safe-html.pipe';
import { StripHTMLPipe } from './pipes/strip-html/strip-html.pipe';
import { TrashedItemsFilterComponent } from './trashed-items-filter/trashed-items-filter.component';
import { DescriptionModalComponent } from './modals/description/description.component';
import { ModalsModule } from '@joeseln/modals';
import { PendingChangesModalComponent } from './modals/pending-changes/pending-changes.component';



@NgModule({
  declarations: [
    CustomControlErrorComponent,
    CustomToastComponent,
    OverviewCollapseElementComponent,
    DetailsCollapseElementComponent,
    SecondaryCollapseElementComponent,
    AuthDownloadDirective,
    FormatContentTypeModelPipe,
    FormatDatePipe,
    FormatFileSizePipe,
    FormatSpeakingDatePipe,
    SafeHtmlPipe,
    StripHTMLPipe,
    TrashedItemsFilterComponent,
    DescriptionModalComponent,
    PendingChangesModalComponent,
  ],
  imports: [
    CommonModule,
    IconsModule,
    CollapseModule.forRoot(),
    TranslocoRootModule,
    FormsModule,
    LoadingModule,
    WysiwygEditorModule,
    ModalsModule
  ],
  exports: [
    CustomToastComponent,
    CustomControlErrorComponent,
    OverviewCollapseElementComponent,
    DetailsCollapseElementComponent,
    SecondaryCollapseElementComponent,
    AuthDownloadDirective,
    FormatContentTypeModelPipe,
    FormatDatePipe,
    FormatFileSizePipe,
    FormatSpeakingDatePipe,
    SafeHtmlPipe,
    StripHTMLPipe,
    TrashedItemsFilterComponent,
    DescriptionModalComponent,
    PendingChangesModalComponent,
  ],
})
export class SharedModule {
}

