import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {ModalState} from "@app/enums/modal-state.enum";
import {buildBasicAuthHeader, createBasicFetcher} from '@h5web/app';
import {environment} from "@environments/environment";

@Component({
  selector: 'app-hsds-page',
  templateUrl: './hsds-viewer.component.html',
  styleUrl: './hsds-viewer.component.css',
  standalone: false,
})
export class HSDSViewerComponent implements OnDestroy {

  @ViewChild('hsdsContainer', {static: true})
  private container!: ElementRef<HTMLDivElement>;

  public state = ModalState.Unchanged;


  public url: string = environment.hsds_url;
  public username: string = environment.hsds_username;
  public password: string = environment.hsds_password;
  public domain: string = environment.hsds_domain;

  // filename must be inserted manually by the user
  public filename: string = ''


  private root: ReturnType<typeof createRoot> | null = null;

  ngOnInit(): void {
    this.normalizeInputs();
  }


  ngOnDestroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  public async renderReactComponent(): Promise<void> {
    this.normalizeInputs();

    const filepath = `${this.domain}/${this.filename}`;

    const fetcher = createBasicFetcher({
      headers: buildBasicAuthHeader(this.username, this.password),
    });

    if (!this.container?.nativeElement) {
      return;
    }

    if (!this.root) {
      this.root = createRoot(this.container.nativeElement);
    }

    const [{App, HsdsProvider}] = await Promise.all([
      import('@h5web/app')
    ]);

    const element = createElement(
      HsdsProvider,
      {url: this.url, filepath, fetcher},
      createElement(App, {sidebarOpen: false})
    );

    this.root.render(element);
  }

  private normalizeInputs(): void {
    // strip whitespace
    this.url = this.url.trim();
    this.username = this.username.trim();
    this.password = this.password.trim();
    this.domain = this.domain.trim();
    this.filename = this.filename.trim();

    // normalize url: no trailing slash
    if (this.url) {
      this.url = this.url.replace(/\/+$/, '');
    }

    // normalize domain: leading slash, no trailing slash
    if (this.domain) {
      this.domain =
        '/' +
        this.domain
          .replace(/^\/+/, '')   // remove leading slashes
          .replace(/\/+$/, '');  // remove trailing slashes
    }

    // normalize filename: no leading slash
    if (this.filename) {
      this.filename = this.filename.replace(/^\/+/, '');
    }
  }


}

