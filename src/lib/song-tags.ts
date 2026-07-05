export const GOOD_FRIDAY_TAG = 'Good Friday';
export const CHURCH_TAG = 'Church';
export const YOUTH_TAG = 'Youth';
export const SUNDAY_SCHOOL_TAG = 'SundaySchool';

export const CATEGORY_TAGS = [CHURCH_TAG, YOUTH_TAG, SUNDAY_SCHOOL_TAG] as const;
export type CategoryTag = typeof CATEGORY_TAGS[number];
