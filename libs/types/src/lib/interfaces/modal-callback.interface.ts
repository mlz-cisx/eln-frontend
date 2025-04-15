import type {ModalState} from '@app/enums/modal-state.enum';

export interface ModalCallback {
  state?: ModalState;
  navigate?: string[];
  external?: string;
  data?: any;
}
