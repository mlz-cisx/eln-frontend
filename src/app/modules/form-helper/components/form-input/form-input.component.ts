import {
  AfterViewInit,
  Component,
  ContentChild,
  EventEmitter,
  Input
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
  LabBookDrawBoardNoteComponent
} from "@app/modules/labbook/components/draw-board/note/note.component";
import {
  LabBookDrawBoardFileComponent
} from "@app/modules/labbook/components/draw-board/file/file.component";
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {cloneDeep, isEqual} from 'lodash';
import {
  debounceTime,
} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'mlzeln-form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss'],
})

export class FormInputComponent implements AfterViewInit {
  @Input()
  public for!: string | null;

  @Input()
  public label?: string;

  @Input()
  public loading = false;

  @Input()
  public margin = true;

  @Input()
  public buttonPosition = 'align-self-center';

  @Input()
  public required = false;

  @Input()
  public onSubmit?: EventEmitter<boolean>;

  @ContentChild(NgControl)
  public ngControl?: NgControl;

  public resetValue!: any;

  public constructor(public labbookdrawboard_note: LabBookDrawBoardNoteComponent, public labbookdrawboard_file: LabBookDrawBoardFileComponent) {

  }

  public get showButtons(): boolean {

    this.ngControl?.valueChanges?.pipe(debounceTime(1000)).subscribe(() => {
      if ((this.ngControl?.name === 'note_subject' || this.ngControl?.name === 'note_content') &&
        Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue))) {
        this.labbookdrawboard_note.onSubmit()
      } else if ((this.ngControl?.name === 'file_title' || this.ngControl?.name === 'file_description') &&
        Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue))) {
        this.labbookdrawboard_file.onSubmit()
      }
      this.reset();
      return false
    })


    if (this.ngControl?.name === 'labbook_title') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'username') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'first_name') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'last_name') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'user_email') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'password_patch') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'pic_title') {
      return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
    }

    if (this.ngControl?.name === 'strict_mode') {
      return Boolean(this.ngControl?.dirty);
    }

    return false

  }

  public ngAfterViewInit(): void {
    this.reset();
    this.onSubmit?.pipe(untilDestroyed(this)).subscribe(() => this.reset());
  }

  public reset(): void {
    this.resetValue = cloneDeep(this.ngControl?.value);
  }

  public onCancel(): void {
    this.ngControl?.control?.setValue(this.resetValue, {emitEvent: false});
    this.ngControl?.control?.markAsPristine();
  }
}
