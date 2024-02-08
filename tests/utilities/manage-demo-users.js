import { frodo } from '@rockcarver/frodo-lib';
import { config } from 'dotenv';

config();

export async function newDemoUser(newUserData) {
  try {
    const access_token = await getAccessToken();
    const user = await createUser(access_token, newUserData);

    //user returned to e2e test making the call
    return user;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

export async function deleteDemoUser(userId) {
  try {
    const access_token = await getAccessToken();

    await deleteUser(access_token, userId);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function getAccessToken() {
  const AM_URL = process.env.VITE_FR_AM_URL;
  const AdminUsername = process.env.FR_AM_ADMIN_USERNAME;
  const AdminPassword = process.env.FR_AM_ADMIN_PASSWORD;

  const myFrodo1 = frodo.createInstanceWithAdminAccount(AM_URL, AdminUsername, AdminPassword);
  // destructure default instance for easier use of library functions
  const { getTokens } = myFrodo1.login;
  const { getInfo } = myFrodo1.info;

  // login and obtain tokens
  if (await getTokens()) {
    // obtain and print information about the instance you are connected to
    const info = await getInfo();
    return info.bearerToken;
  } else {
    console.log('error getting tokens');
  }
}

export async function getDemoUserId(userName) {
  const AM_URL = process.env.VITE_FR_AM_URL;
  const AdminUsername = process.env.FR_AM_ADMIN_USERNAME;
  const AdminPassword = process.env.FR_AM_ADMIN_PASSWORD;

  const myFrodo1 = frodo.createInstanceWithAdminAccount(AM_URL, AdminUsername, AdminPassword);

  // destructure default instance for easier use of library functions
  const { getTokens } = myFrodo1.login;

  // login and obtain tokens
  if (await getTokens()) {
    const listOfUsers = await myFrodo1.idm.managed.queryManagedObjects('alpha_user', undefined, [
      'userName',
    ]);
    const userId = listOfUsers.filter((res) => res.userName === userName).map((field) => field._id);
    return userId;
  } else {
    console.log('error getting users');
  }
}

async function createUser(access_token, newUserData) {
  const CREATE_URL = process.env.FR_AM_CREATE_USER_URL;

  if (!CREATE_URL) {
    throw new Error('You must provide an CREATE_URL');
  }
  if (!access_token) {
    throw new Error('No access token provided, exiting without a network call');
  }

  try {
    const response = await fetch(CREATE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        Accept: '*/*',
        Connection: 'keep-alive',
      },
      body: JSON.stringify(newUserData),
    });
    console.log('CREATE_USER_RESPONSE', response.statusText);
    const resBody = await response.json();
    return resBody;
  } catch (err) {
    console.log(err);
  }
}

async function deleteUser(access_token, userId) {
  const DELETE_URL = `${process.env.FR_AM_DELETE_USER_URL}${userId}`;

  if (!DELETE_URL) {
    throw new Error('You must provide an AM_URL');
  }
  if (!userId) {
    throw new Error('No user id provided, exiting without a network call');
  }

  try {
    const response = await fetch(DELETE_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        Accept: '*/*',
        Connection: 'keep-alive',
      },
    });
    console.log('DELETE_USER_RESPONSE', response.statusText);
  } catch (err) {
    console.log(err);
  }
}
