export interface LabBookElement<T> {
  child_object: T;
  child_object_content_type: number;
  child_object_content_type_model: string;
  child_object_id: string;
  content_type: number;
  content_type_model: string;
  display: string;
  labbook_id: string;
  num_related_comments?: number;
  num_relations?: number;
  pk: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface LabBookElementEvent {
  childObjectId: string;
  childObjectContentType: number;
  childObjectContentTypeModel: string;
  parentElement: string;
  position: 'top' | 'bottom';
  height?: number;
}

export interface LabBookElementPayload {
  pk?: string;
  child_object_content_type?: number;
  child_object_content_type_model?: string;
  child_object_id?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}

export interface LabBookElementAddEvent {
  labbook_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface LabBookElementClonePayload {
  pk?: string;
  child_object_content_type?: number;
  child_object_content_type_model?: string;
  child_object_id?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  comments?: string[];
}
