import { test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

/**
 * for now because FF is causing issues with the test
 * FF has a different behavior when you click submit
 * the checkbox is cleared,
 * in chrome the checkbox is not cleared
 * TODO (@ryanbas21): fix FF behavior in test below
 */
test.use({ browserName: 'chromium' });
test('Registration accessibility ensuring password field focus when submitted twice and no password is entered', async ({
  page,
}) => {
  const { navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_Registration');

  await page.keyboard.press('Tab');

  const username = uuid();
  const usernameField = page.getByLabel('Username');
  await usernameField.fill(username);
  await page.keyboard.press('Tab');

  const firstNameField = page.getByLabel('First name');
  await firstNameField.fill('Demo');
  await page.keyboard.press('Tab');

  const lastNameField = page.getByLabel('Last name');
  await lastNameField.fill('User');
  await page.keyboard.press('Tab');

  const emailField = page.getByLabel('Email address');
  await emailField.fill('test@auto.com');
  await page.keyboard.press('Tab');

  // https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
  const specialOffers = page.getByRole('checkbox', { name: 'Send me special offers and services' });
  await expect(specialOffers).toBeFocused();
  await page.keyboard.press(' '); // this is the proper way to hit spacebar!
  await expect(specialOffers).toBeChecked();
  await page.keyboard.press('Tab');

  const newsAndUpdates = page.getByRole('checkbox', { name: 'send me news and updates' });
  await expect(newsAndUpdates).toBeFocused();
  await page.keyboard.press(' '); // this is the proper way to hit spacebar!
  await expect(newsAndUpdates).toBeChecked();
  await page.keyboard.press('Tab');

  // initially skip over password field!
  const password = page.getByLabel('Password');
  await expect(password).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // tab again because of the eyeball

  // now on security questions
  const securityQuestion1 = page.getByLabel('Select a security question');
  await securityQuestion1.selectOption('0');
  await page.keyboard.press('Tab');

  const securityAnswer1 = page.getByLabel('Security answer');
  await securityAnswer1.fill('blue', { delay: 100 }); // type wasn't working idk why
  await expect(securityAnswer1).toHaveValue('blue');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const toc = page.getByRole('checkbox', { name: 'Please accept our Terms & Conditions' });
  await expect(toc).toBeFocused();
  await page.keyboard.press(' '); // select toc
  await expect(toc).toBeChecked();

  await page.keyboard.press('Tab');

  const { pressEnter } = asyncEvents(page);
  await pressEnter('/authenticate');
  await expect(password).toBeFocused();

  // tab back through to the Register button!
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const register = page.getByRole('button', { name: 'Register' });
  await expect(register).toBeFocused();

  await pressEnter('/authenticate');

  // verify the password field gets refocused, as this was a bug!
  await expect(password).toBeFocused();
  await page.keyboard.type('Password1!', { delay: 100 });

  // tab back through to the Register button!
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  await expect(register).toBeFocused();
  await pressEnter('/authenticate');

  await verifyUserInfo(page, expect, 'register');
});
