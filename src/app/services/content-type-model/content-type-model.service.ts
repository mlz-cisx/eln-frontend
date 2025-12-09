import {Injectable} from '@angular/core';
import type {ContentTypeModelItem, ContentTypeModels} from '@joeseln/types';
import {TranslocoService} from '@jsverse/transloco';

@Injectable({
  providedIn: 'root',
})
export class ContentTypeModelService {
  private readonly models: Record<ContentTypeModels, ContentTypeModelItem | null>;

  public constructor(private readonly translocoService: TranslocoService) {
    this.models = {
      'labbooks.labbook': {
        modelName: 'labbook',
        routerBaseLink: '/labbooks',
        translation: this.translocoService.translate('labbook.singular'),
        translationPlural: this.translocoService.translate('labbook.plural'),
        icon: 'wb-lab-book',
      },
      'shared_elements.file': {
        modelName: 'file',
        routerBaseLink: '/files',
        translation: this.translocoService.translate('file.singular'),
        translationPlural: this.translocoService.translate('file.plural'),
        icon: 'wb-files',
      },
      'shared_elements.note': {
        modelName: 'note',
        routerBaseLink: '/notes',
        translation: this.translocoService.translate('note.singular'),
        translationPlural: this.translocoService.translate('note.plural'),
        icon: 'wb-comment',
      },
      'pictures.picture': {
        modelName: 'picture',
        routerBaseLink: '/pictures',
        translation: this.translocoService.translate('picture.singular'),
        translationPlural: this.translocoService.translate('picture.plural'),
        icon: 'wb-image',
      },
    };
  }

  public get(name: ContentTypeModels, entity: keyof ContentTypeModelItem): string | null {
    const modelName = this.models[name];
    if (modelName) {
      return modelName[entity];
    }

    return null;
  }
}
