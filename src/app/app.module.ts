import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoadingBarModule} from '@ngx-loading-bar/core';
import {LoadingBarHttpClientModule} from "@ngx-loading-bar/http-client";
import {LoadingBarRouterModule} from "@ngx-loading-bar/router";
import {TranslocoRootModule} from './transloco-root.module';
import {TranslocoService} from '@jsverse/transloco';
import {ErrorTailorModule} from '@ngneat/error-tailor';
import {NavbarModule} from "@app/modules/navbar/navbar.module";
import {WysiwygEditorModule} from '@joeseln/wysiwyg-editor';
import { provideDialogConfig } from '@ngneat/dialog';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  LabBookDrawBoardGridComponent
} from "@app/modules/labbook/components/draw-board/grid/grid.component";
import {
  LabBookDrawBoardNoteComponent
} from "@app/modules/labbook/components/draw-board/note/note.component";
import {
  LabBookDrawBoardFileComponent
} from "@app/modules/labbook/components/draw-board/file/file.component";
import {
  CustomControlErrorComponent
} from '@app/modules/shared/control-error/control-error.component';
import {ToastrModule} from 'ngx-toastr';
import {
  CustomToastComponent
} from '@app/modules/shared/toastr/toastr.component';

import {NgSelectModule} from "@ng-select/ng-select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

import {InterceptorService} from "@app/services";
import {ColorPickerService} from "ngx-color-picker"
import { MathjaxModule } from "mathjax-angular";


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    NgSelectModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LoadingBarModule,
    LoadingBarRouterModule,
    LoadingBarHttpClientModule,
    TranslocoRootModule,
    NavbarModule,
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
    WysiwygEditorModule,
    ToastrModule.forRoot({
      toastComponent: CustomToastComponent,
      closeButton: true,
      tapToDismiss: false,
      maxOpened: 3,
    }),
    ReactiveFormsModule,
    FormsModule,
    MathjaxModule.forRoot({ src: '/mathjax/startup.js' }),
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true},
    LabBookDrawBoardNoteComponent,
    LabBookDrawBoardFileComponent,
    LabBookDrawBoardGridComponent,
    NgSelectModule,
    ColorPickerService,
    provideDialogConfig({
      draggable: true,
      resizable: true,
      enableClose: false
    }),
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
