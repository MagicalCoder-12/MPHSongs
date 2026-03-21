export const SITE_THEMES = ['normal', 'good-friday', 'easter', 'christmas'] as const;

export type SiteTheme = typeof SITE_THEMES[number];

export const SITE_THEME_LABELS: Record<SiteTheme, string> = {
  normal: 'Normal',
  'good-friday': 'Good Friday',
  easter: 'Easter',
  christmas: 'Christmas',
};

export const SITE_THEME_PLACEHOLDERS: Record<Exclude<SiteTheme, 'normal'>, string> = {
  'good-friday': 'Good Friday theme placeholder. We can add a fuller worship-focused layout next.',
  easter: 'Easter theme placeholder. We can add a brighter resurrection-season look next.',
  christmas: 'Christmas theme placeholder. We can add festive artwork and holiday styling next.',
};

export function isValidSiteTheme(value: unknown): value is SiteTheme {
  return typeof value === 'string' && SITE_THEMES.includes(value as SiteTheme);
}
