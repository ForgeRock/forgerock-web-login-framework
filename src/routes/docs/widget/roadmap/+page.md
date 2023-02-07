# Future APIs (not implemented)

## Currently **unsupported**

1. WebAuthn
2. Push Authentication
3. Recaptcha
4. QR Code display
5. TextOutputCallback with scripts
6. Device Profile
7. Email Suspend (Forgot Password/Username flows)
8. Social Login
9. Central Login
10. SAML

## Widget customization (future)

```js
new Widget({
  // ... previous config properties ...

  // All optional; default value is assigned below
  customization: {
    labels: 'floating', // "floating" or "stacked"
    modalBackdrop: true, // boolean; display modal backdrop
    modalAutoClose: true, // boolean; automatically close modal on success
  },
});
```

## Additional modal events (future)

```js
modal.onClose((event) => {
  /* anything you want */
});
```
