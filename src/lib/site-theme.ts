export const SITE_THEMES = ['normal', 'good-friday', 'christmas'] as const;

export type SiteTheme = typeof SITE_THEMES[number];

export const SITE_THEME_LABELS: Record<SiteTheme, string> = {
  normal: 'Normal',
  'good-friday': 'Good Friday',
  christmas: 'Christmas',
};

export const SITE_THEME_PLACEHOLDERS: Record<Exclude<SiteTheme, 'normal'>, string> = {
  'good-friday': 'Good Friday theme placeholder. We can add a fuller worship-focused layout next.',
  christmas: 'Christmas theme placeholder. We can add festive artwork and holiday styling next.',
};

export function isValidSiteTheme(value: unknown): value is SiteTheme {
  return typeof value === 'string' && SITE_THEMES.includes(value as SiteTheme);
}
