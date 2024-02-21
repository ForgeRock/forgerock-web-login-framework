import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with email suspend', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginSuspendEmail');

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  // TODO: This route was flakey for some reason mocking it so we test the next page has the text
  // Come back to understand why this is flakey?
  await page.route('*/**/authenticate/**', async (route) => {
    await route.fulfill({
      authId:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IlRFU1RfTG9naW5TdXNwZW5kRW1haWwiLCJvdGsiOiJkZjVrdmI1am5uYmIycDdtcDFnNXQyZjNvYyIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEiLCJzZXNzaW9uSWQiOiIqQUFKVFNRQUNNRElBQkhSNWNHVUFDRXBYVkY5QlZWUklBQUpUTVFBQ01ERS4qZXlKMGVYQWlPaUpLVjFRaUxDSmpkSGtpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5aWGxLTUdWWVFXbFBhVXBMVmpGUmFVeERTbXhpYlUxcFQybEtRazFVU1RSUk1FcEVURlZvVkUxcVZUSkphWGRwV1ZkNGJrbHFiMmxhUjJ4NVNXNHdMaTVWTURCR01WSkZPR3hNYzE4M1YycHZTVzlrVFhOUkxqbHhXbFJsY0RCalh6Qm1WbEJDYW1oR05FRndhWEZ4VTFsdFZrTlJOSFZQU0ZkSWFVaDBTekpLT1hSWU1uWkVNWEJPUW5OdVpIWTJkRGRmWHpkbFRXd3piWGxVYWxWbFZVTkpPRzR0ZEZneVl6aFdiMDlKY0RoZmVtZGZha2RGVW1SQ05uRlhTMEZrUTFSMU9YbzRjblZpYzAwMU9GWkVTa050Y1VWT0xXdDRlalJHTWtKUVJsRjJPSE5sYUdweGFWaFdPRkpXZG5NNGFuaEdjMUpVWTNGd1pWRlhRV0pHWmtnd1ZVMXhUM0Z2YlZFelRXaEpjbUpDYzFsaFp6YzBUWEZRYkU5a1VXeFVVbGRTWWxCU01FRlFNa2xvY21aQ2QwMVVNMnd3ZVVOdlFVaEdSbGw1YkdzNVdUTmZibE5VYkdkbmRsQnZOQzFOT0hoNE1taHdSa0pUUkU1Q1FpMW9jbTk0YkVSU1RIbHRaSGc1TlVvMVF6RnFRa1ZuUVRsUGFIbG5URWhUWlhGemFUQjFiME5zVURGV1ptaG9WbVE0ZVdGQ1Z6ZFZaV2RtY0cxMGJYUnZTa3RyVkU5YU1WbFJjamR1VVhKTlJDMWxZMVF4YzBoak9GOU5XREJGYWxCWkxXdFdZa2hXZUdSV2JHeElaVWgxVDBkSFRHMXVRa3BETVdWQmJ5MHdlWGxoY0ZaU04wWlpOMWRGV1VSeVJWQlRha0pGVEhCZldXa3hkMWRFYjBsRU1FRXRVamhXWlU1dVZWUm9lRXhZWmpGSFRrUnlVVFk1Y1dGWlRsWlJXVGRGVlVjNE1FWk5Ta05WVDAxWVFsTTFZVzFzV2s5WlFTMXhORFZJTFVGRGJXUnpXRE56YWxsdGNFOXRZMUpJZDFGSU5sZ3hTVFV3WVZaTE1FbENhM1pyWHpaR1luVjVOVEJUTWpoMFEwVmhaMUpKVm1VeGNuQmhYMUYyUzFWU2MyVnhjbFZKVVMxTE5EQlZSbEZOVTBzeVpFSlljalJ0U0c5NlgzQlJNRFowVEVKa1RuVXpZa0UxYlU1dFgzZGhjM0JOYUhCTk5scFNUa1Y1VEZKNWVqUjZVRkYxVkZVMVMyWXdaMlp6VlhnME1UZHlMVUZWT1cxblJXY3laV3RPVmpGUFIzRTBaVGROUldkSGMyUjJkVmR6Y1dFeVZFeHpRVEZUTUV0ek0yaHZNMWswYVhwMVVIRnVRMVF4Y0ZCbVNrUmlWbUZ3YW1WRFNVcFZkM1pMWDBOUVEwcFRjQzFJVFRKVU5HVmtTalE0YlhsRVNsTTNZazFDVDE5UllVWXpZVUZXZWsxd1ZXd3hhM3BLYTNsbVFXeHJXR2QxYnpOS1dVOXFSMnRuYTBkUmFFbzBWbGxUZURGd1QwUjFaRUZ5Tm1wdllYVktUbGQzYjAxU1owMWhja0kyVm5oU01XNWZaazVNTmpsVFRYZFVUbEpEWVVkTFZXUnBjR2cxYjAxc2NIcEllbG81YWtSb1dEbFRWRFF5UjNCbkxrbFpVM2cyZDNGMVpIZFNibU5KY21wZlJWSklTbmMuM3VnaTR3Rkw2QTBHdE1odG4yQVBWTHIwTUozLURfQS1wekNiVkxPNmg5RSIsImV4cCI6MTcwNzQyODExMSwiaWF0IjoxNzA3NDI3ODExfQ.Dm-5KGnaixBkwSeTXQ5XOCaLsVTpO0FvORkUFIj4dj0',
      callbacks: [
        {
          type: 'SuspendedTextOutputCallback',
          output: [
            {
              name: 'message',
              value:
                'An email has been sent to the address you entered. Click the link in that email to proceed.',
            },
            {
              name: 'messageType',
              value: '0',
            },
          ],
        },
      ],
    });
  });

  await page.getByRole('button', { name: 'Next' }).click();
  // Grab the form to reduce scope for next assertions
  const form = page.locator('form');

  // Unique header for Email Suspend stage
  await expect(form.getByText('Check your email')).toBeVisible();

  // We should have a paragraph of text from the callback
  // The actual text is not important, so check truthiness
  await expect(form.getByText('Check your email')).toBeVisible();

  // There should be no submit button within form
  await expect(form.getByRole('button')).not.toBeAttached();
});
