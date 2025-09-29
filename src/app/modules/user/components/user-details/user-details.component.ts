import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { User } from '@joeseln/types';
import { DialogRef, DialogService } from '@ngneat/dialog';

@Component({
    selector: 'mlzeln-user-details',
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UserDetailsComponent {
  @Input()
  public user?: User;

  @Input()
  public active = true;

  @Input()
  public modal = true;

  @Input()
  public avatar = true;

  @Input()
  public avatarScale = 1;

  @Input()
  public chip = false;

  @Input()
  public inverted = false;

  @Input()
  public invertedAvatar = false;

  public modalRef?: DialogRef;

  public constructor(private readonly modalService: DialogService) {}

  public openUserModal(event?: Event): void {
  }
}
