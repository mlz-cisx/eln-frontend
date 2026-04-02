import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {TranslocoService} from '@jsverse/transloco';

@Component({
  selector: 'mlzeln-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LoadingComponent {
  @Input() loading = false;

  // NEW: pdf | zip | null
  @Input() exportType: 'pdf' | 'zip' | null = null;

  constructor(public readonly translocoService: TranslocoService) {
  }

  get exportText(): string {
    switch (this.exportType) {
      case 'pdf':
        return 'PDF export is generated, wait!';
      case 'zip':
        return 'ZIP export is generated, wait!';
      default:
        return '';
    }
  }

}


