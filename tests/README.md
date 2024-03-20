# Frodo CLI - @rockcarver/frodo-cli

ForgeROck DO Command Line Interface, frodo-cli, a CLI to manage ForgeRock platform deployments supporting Identity Cloud tenants, ForgeOps deployments, and classic deployments. Frodo-cli is powered by [frodo-lib](https://github.com/rockcarver/frodo-lib), a hybrid (ESM and CJS) library to manage ForgeRock deployments.

## Quick Nav

- [Usage](#usage)
- [CLI integration](#cli-integration)

## Usage

In order to be able to leverage Frodo cli, it is necessary to create and manage the connection profiles. This can be achieved by using the following commands

### frodo conn add:

Adds a new connection profile.

`frodo conn add https://openam-TENANT-NAME.forgeblocks.com/am username password`

```console
frodo conn add https://openam-my-tenant.forgeblocks.com/am john.doe@company.com 5uP3r-53cr3t!

Connected to https://openam-my-tenant.forgeblocks.com/am ALPHA as user john.doe@company.com
Created and added service account Frodo-SA-9192837730113212323 with id masdjkhsdf8-2389-2234-cvv1-20558nncjfjhh439 to profile.
Created log API key edkjasdj9289829389dbi921389dz and secret.
Saved connection profile https://openam-my-tenant.forgeblocks.com/am
```

Once frodo saves a connection, you don't have to provide the host, username, and password arguments. You can reference your connection using any unique substring from your host. This is the most common way users would run frodo. For example, if https://openam-NAME-1.forgeblocks.com/am and https://openam-NAME-2.forgeblocks.com/am are two saved ForgeRock connections from previous commands, one would simply use: frodo info name-1 or frodo info name-2.

### frodo conn list:

Lists all the connections frodo currently knows about for the current machine and user.

```console
frodo conn list
https://openam-my-tenant.forgeblocks.com/am
```

### frodo conn describe:

Shows all the details of a connection profile.

`frodo conn describe TENANT-NAME`

```console
frodo conn describe my-tenant
Output:
Host │https://openam-my-tenant.forgeblocks.com/am
Username │john.doe@company.com
Password │present
Log API Key │edkjasdj9289829389dbi921389dz
Log API Secret │present
Service Account Name│Frodo-SA-9192837730113212323
Service Account Id │masdjkhsdf8-2389-2234-cvv1-20558nncjfjhh439
Service Account JWK │
```

### frodo conn delete:

Removes a connection profile.

`frodo conn delete TENANT-NAME`

```console
frodo conn delete my-tenant
Deleted connection profile https://openam-my-tenant.forgeblocks.com/am
```

## CLI-integration

Lastly, it is neccessary to add the environment variables used by Frodo to create and manage the connection profiles.The environment variables may vary depending on the features being developed. For example:

- `FR_AM_ADMIN_USERNAME=user@forgerock.com`
- `FR_AM_ADMIN_PASSWORD=Password`
- `FR_AM_CREATE_USER_URL=https://openam-TENANT-NAME.forgeblocks.com/openidm/managed/alpha_user?_action=create`
- `FR_AM_DELETE_USER_URL=https://openam-TENANT-NAME.forgeblocks.com/openidm/managed/alpha_user/`
- `VITE_FR_AM_URL=https://openam-TENANT-NAME.forgeblocks.com/am`

```js
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
```
