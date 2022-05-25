import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import Page from './dialog.story.svelte';

describe('Component test for the dialog composition', () => {
  afterEach(() => cleanup());

  it('should render a button', () => {
    const { queryByRole, getByText } = render(Page);
    const openButton = getByText('Open Dialog');

    // dialog element is not supported in JSDom
    // https://github.com/jsdom/jsdom/issues/3294
    // fireEvent.click(openButton);

    const dialog = queryByRole('dialog');

    expect(openButton.innerHTML).toContain('Open Dialog');
    // Dialog should not be shown without clicking on button
    expect(dialog).not.toBeTruthy();
  });
});
