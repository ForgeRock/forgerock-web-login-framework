/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { AM_COOKIE_NAME, AM_REALM, AM_URL } from '../../playwright.config.ts';

const REALM_PATH = `realms/root/realms/${AM_REALM}`;

const API_VERSION_AUTH = 'resource=2.1, protocol=1.0';
const API_VERSION_USERS = 'protocol=2.1, resource=3.0';
const API_VERSION_DEVICES = 'resource=1.0, protocol=1.0';

export async function getSessionToken(request, username, password) {
  const response = await request.post(`${AM_URL}/json/${REALM_PATH}/authenticate`, {
    headers: {
      'Content-Type': 'application/json',
      'X-OpenAM-Username': username,
      'X-OpenAM-Password': password,
      'Accept-API-Version': API_VERSION_AUTH,
    },
  });
  const { tokenId } = await response.json();
  if (!tokenId) {
    throw new Error(`Authentication failed for user ${username}`);
  }
  return tokenId;
}

async function getUserId(request, tokenId) {
  const response = await request.post(`${AM_URL}/json/${REALM_PATH}/users?_action=idFromSession`, {
    headers: {
      Cookie: `${AM_COOKIE_NAME}=${tokenId}`,
      'Content-Type': 'application/json',
      'Accept-API-Version': API_VERSION_USERS,
    },
  });
  const { id } = await response.json();
  if (!id) {
    throw new Error('Failed to resolve user id from session');
  }
  return id;
}

async function getDevices(request, userId, tokenId) {
  const response = await request.get(
    `${AM_URL}/json/${REALM_PATH}/users/${userId}/devices/2fa/webauthn?_queryFilter=true`,
    {
      headers: {
        Cookie: `${AM_COOKIE_NAME}=${tokenId}`,
        'Accept-API-Version': API_VERSION_DEVICES,
      },
    },
  );
  const { result } = await response.json();
  return result ?? [];
}

async function deleteDevice(request, userId, deviceUuid, tokenId) {
  await request.delete(
    `${AM_URL}/json/${REALM_PATH}/users/${userId}/devices/2fa/webauthn/${deviceUuid}`,
    {
      headers: {
        Cookie: `${AM_COOKIE_NAME}=${tokenId}`,
        'Accept-API-Version': API_VERSION_DEVICES,
      },
    },
  );
}

/**
 * Deletes the WebAuthn device registered during a test run, matched by credential ID.
 * AM stores credential IDs as base64url (no padding), matching the format CDP returns.
 * No-ops if no credential was registered.
 *
 * Requires a tokenId obtained before the test run — re-authenticating after the widget
 * journey completes causes AM to return an empty tokenId for the already-active session.
 */
export async function cleanUpRegisteredDevice(request, credentialId, tokenId) {
  if (!credentialId) {
    return;
  }

  const userId = await getUserId(request, tokenId);
  const devices = await getDevices(request, userId, tokenId);
  const device = devices.find((registeredDevice) => registeredDevice.credentialId === credentialId);

  if (!device) {
    console.warn(`WebAuthn cleanup: no device found matching credential ${credentialId}`);
    return;
  }

  await deleteDevice(request, userId, device.uuid, tokenId);
}
