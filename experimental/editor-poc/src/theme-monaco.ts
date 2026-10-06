import * as monaco from 'monaco-editor';

import { brand } from './brand';

// AIC platform-chrome palette, expressed through Monaco's editor.defineTheme()
// — validates the Task 4 finding that Monaco's per-token `rules` + UI `colors`
// map reaches every visual surface (background, gutters, cursor, selection,
// active line) without forking, same reach as CodeMirror's theme() API.
export const PING_BRAND_THEME_NAME = 'ping-brand-light';

export function definePingBrandTheme(): void {
  monaco.editor.defineTheme(PING_BRAND_THEME_NAME, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': brand.cardBackground,
      'editor.foreground': brand.textPrimary,
      'editorCursor.foreground': brand.primary,
      'editorLineNumber.foreground': brand.textMuted,
      'editorLineNumber.activeForeground': brand.textPrimary,
      'editor.selectionBackground': '#d6e9f8',
      'editor.lineHighlightBackground': '#eff6fc',
      'editorGutter.background': brand.pageBackground,
    },
  });
}
