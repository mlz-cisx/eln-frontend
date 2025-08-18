import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {UserService} from "@app/services";
import { User } from '@joeseln/types';
import {UserStore} from "@app/services/user/user.store";
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslocoService} from '@ngneat/transloco';
import {ToastrService} from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'joeseln-profile-page',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfilePageComponent implements OnInit {
  user: User | undefined;
  public loading = false;

  public form = this.fb.group(
    {
      password: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
      passwordConfirm: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
    },
    {validators: [this.MustMatch('password', 'passwordConfirm')]}
  );


  constructor(private user_service: UserService,
              private readonly userStore: UserStore,
              private readonly fb: UntypedFormBuilder,
              private readonly cdr: ChangeDetectorRef,
              private readonly translocoService: TranslocoService,
              private readonly toastrService: ToastrService,
  ) {
  }

  ngOnInit(): void {
    this.getUserMe();
  }

  getUserMe(): void {
    this.user_service.getUserMe()
      .subscribe(user => {
          this.user = user
          this.userStore.update(() => ({user, loggedIn: Boolean(user)}));
        }
      );
  }

  private get f(): UntypedFormGroup['controls'] {
    return this.form.controls;
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

  public onSubmit(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.user_service
      .changePassword(this.f['password'].value)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.form.reset();
          this.form.clearValidators();
          Object.keys(this.form.controls).forEach(key => {
            this.form.controls[key].setErrors(null);
          });

          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('changePassword.success.toastr.passwordChanged')
            .pipe(untilDestroyed(this))
            .subscribe(passwordChanged => {
              this.toastrService.success(passwordChanged);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

}
