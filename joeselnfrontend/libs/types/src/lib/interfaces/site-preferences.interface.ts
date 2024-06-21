export interface SitePreferences {
  site_name: string;
  site_logo: string;
  navbar_background_color: string;
  navbar_border_color: string;
  content_types: Record<string, number>;
}
