import { readable, type Readable } from 'svelte/store';

export interface Logo {
  dark?: string;
  height?: number;
  light: string;
  width?: number;
}
export interface Style {
  checksAndRadios?: 'animated' | 'standard';
  labels?: 'floating' | 'stacked';
  logo?: Logo;
  sections?: {
    header?: boolean;
  };
  stage?: {
    icon: boolean;
  };
}

export let style: Readable<Style>;

// TODO: Implement Zod for better usability
export function initialize(customStyle?: Style) {
  style = readable(customStyle);
}
