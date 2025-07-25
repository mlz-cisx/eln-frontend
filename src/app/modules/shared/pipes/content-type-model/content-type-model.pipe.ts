import { Pipe, PipeTransform } from '@angular/core';
import { ContentTypeModelService } from '@app/services';
import type { ContentTypeModelItem, ContentTypeModels } from '@joeseln/types';

@Pipe({
  name: 'formatContentTypeModel',
})
export class FormatContentTypeModelPipe implements PipeTransform {
  public constructor(private readonly contentTypeModelService: ContentTypeModelService) {}

  public transform(value: ContentTypeModels | string, entity: keyof ContentTypeModelItem = 'translation'): string {
    return this.contentTypeModelService.get(value as ContentTypeModels, entity) ?? '';
  }
}
