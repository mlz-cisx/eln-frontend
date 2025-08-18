export interface Privileges {
  fullAccess: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
  trash: boolean;
  restore: boolean;
}


export interface PrivilegesData<T> {
  privileges: Privileges;
  data: T;
}
