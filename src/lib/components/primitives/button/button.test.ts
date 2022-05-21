import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import Button from './button.test.svelte';

describe('Component test for the button primitive', () => {
  afterEach(() => cleanup());

  it('should render a button', () => {
    const { getByText } = render(Button);

    expect(getByText('Click Me!').innerHTML).toContain('Click Me!');
  });
});
