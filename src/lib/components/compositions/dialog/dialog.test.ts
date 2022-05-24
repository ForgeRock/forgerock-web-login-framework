import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import Button from './dialog.story.svelte';

describe('Component test for the dialog composition', () => {
  afterEach(() => cleanup());

  it('should render a button', () => {
    const { getByText } = render(Button);

    expect(getByText('Click Me!').innerHTML).toContain('Open Dialog');
  });
});
