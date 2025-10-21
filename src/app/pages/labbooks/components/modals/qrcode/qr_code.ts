import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {ModalState} from '@app/enums/modal-state.enum';
import {UserService} from '@joeseln/services';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder} from '@ngneat/reactive-forms';
import {UntilDestroy} from '@ngneat/until-destroy';


interface FormToken {
  withToken: boolean;
}

@UntilDestroy()
@Component({
  selector: 'qr_code',
  templateUrl: './qr_code.html',
  styleUrls: ['./qr_code.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewQRcodeModalComponent implements OnInit {
  public state = ModalState.Unchanged;

  public qrdata = ''
  public token_validity! : Number

  public form = this.fb.group<FormToken>({
    withToken: false
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private user_service: UserService,
  ) {

    this.form.get('withToken')?.valueChanges.subscribe(value => {
      if (value) {
        this.getToken()
      } else {
        this.qrdata = window.location.href
        this.cdr.markForCheck()
      }
    });
  }


  public ngOnInit(): void {
    this.qrdata = window.location.href
  }

  private getToken(): void {
    this.user_service.getTransferToken()
      .subscribe(token => {
          const {origin, pathname} = window.location;
          const params = new URLSearchParams({
            token: token.access_token,
            state_url: pathname
          });
          this.qrdata = `${origin}/login?${params.toString()}`;
          this.token_validity= token.token_validity
          this.cdr.markForCheck()
        }
      );
  }

}
