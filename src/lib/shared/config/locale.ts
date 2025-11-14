/**
 * Locale configuration for internationalization
 *
 * This module provides utilities for detecting and managing the application locale.
 * Will be extended with i18n support in the future.
 */

/**
 * Get the current browser locale
 * Falls back to 'en-US' if navigator is not available (SSR)
 */
export function getBrowserLocale(): string {
  if (typeof navigator !== "undefined") {
    return navigator.language;
  }
  return "en-US";
}

/**
 * Default locale for the application
 * TODO: Replace with user preference from settings/localStorage
 */
export const defaultLocale = getBrowserLocale();

/**
 * Supported locales for future i18n implementation
 * TODO: Expand this list as translations are added
 */
export const supportedLocales = ["en-US", "ru-RU", "uk-UA", "de-DE", "fr-FR"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];
