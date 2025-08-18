import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { AdminUsersService, NotesService } from '@app/services';
import type { User, UserPayload } from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';


@UntilDestroy()
@Component({
  selector: 'mlzeln-new-user-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserModalComponent implements OnInit {
  public initialState?: User = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;



  public form = this.fb.group({

      username: [null, [Validators.required]],
      first_name: [null, [Validators.required]],
      last_name: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.pattern('[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}')]],
      password: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
      password_confirmed: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
    },
    {validators: [this.MustMatch('password', 'password_confirmed')]}
  );

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly fb: UntypedFormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    public readonly admin_users_service: AdminUsersService
  ) {
  }

  private get f(): UntypedFormGroup['controls'] {
    return this.form.controls;
  }

  private get user(): UserPayload {
    return {
      username: this.f['username'].value!,
      first_name: this.f['first_name'].value!,
      last_name: this.f['last_name'].value!,
      email: this.f['email'].value!,
      password: this.f['password'].value!,
      password_confirmed: this.f['password_confirmed'].value!,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {


  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {

          username: this.initialState.username,
          first_name: this.initialState.first_name,
          last_name: this.initialState.last_name,
          email: this.initialState.email,

        },
        {emitEvent: false}
      );


    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.admin_users_service
      .add(this.user)
      .pipe(untilDestroyed(this))
      .subscribe(
        user => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: {newContent: user},
          });
          this.toastrService.success('User successfully created!')
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: UntypedFormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];


      if (matchingControl.errors && !matchingControl.errors['mustmatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({mustmatch: true});
        return;
      }

      matchingControl.setErrors(null);
    };
  }
}
