import type {
  CalendarAccessPrivileges,
  CalendarAccessPrivilegesPayload,
  DjangoAPI
} from '@joeseln/types';
import {mockUser} from './user';

export const mockCalendarAccessPrivilegesPayload: CalendarAccessPrivilegesPayload = {
  content_type: 77,
  content_type_model: 'shared_elements.calendaraccess',
};

export const mockCalendarAccessPrivileges: CalendarAccessPrivileges = {
  pk: 'c5659862-b4b1-4a96-9148-8304db8b12c8',
  content_type: 77,
  content_type_model: 'shared_elements.calendaraccess',
  created_at: '2019-04-05T15:06:00.991092+02:00',
  created_by: mockUser,
  deleted: false,
  display: 'Access for the Calendar of User test',
  last_modified_at: '2019-04-05T15:06:00.991092+02:00',
  last_modified_by: mockUser,
};

export const mockCalendarAccessPrivilegesList: DjangoAPI<CalendarAccessPrivileges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCalendarAccessPrivileges],
};
