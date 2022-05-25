import { writable } from 'svelte/store';
// import { browser } from '$app/env';

// let storedAuthentication = false;
// let storedEmail: string | null = '';
// let storedFullName: string | null = '';

// if (browser) {
//   /**
//    * Pull stored values from outside of the app to (re)hydrate state.
//    */
//   const storedAuthenticationString = window.sessionStorage.getItem('sdk_authentication');
//   storedAuthentication = storedAuthenticationString === 'true' ? true : false;
//   storedEmail = window.sessionStorage.getItem('sdk_email');
//   storedFullName = window.sessionStorage.getItem('sdk_username');
// }

export const email = writable(/* storedEmail */);
export const fullName = writable(/* storedFullName */);
export const isAuthenticated = writable(/* storedAuthentication */);

// isAuthenticated.subscribe((authentication) => {
//   if (browser) window.sessionStorage.setItem('sdk_authentication', `${authentication}`);
// });
// email.subscribe((email) => {
//   if (browser) window.sessionStorage.setItem('sdk_email', `${email}`);
// });
// fullName.subscribe((username) => {
//   if (browser) window.sessionStorage.setItem('sdk_username', `${username}`);
// });
