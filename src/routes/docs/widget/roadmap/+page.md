<script>
  import Image from '../../image.svelte';

  export let data;
</script>

# Future Support (not yet implemented)

## Planned for a future, minor release

1. WebAuthn
2. Device Profile

## Planned for a future, major release

1. Push Authentication
2. ReCAPTCHA
3. QR Code display
4. TextOutputCallback with scripts
5. Central Login
6. SAML
7. NumberAttributeInputCallback

## Proposed future Widget APIs

### Modal customization

```js
new Widget({
  // ... previous config properties ...

  // All optional; default value is assigned below
  style: {
    modal: {
      backdrop: true, // boolean; display modal backdrop
    },
  },
});
```

### Multiple widget instances

Currently, the Login Widget supports only a single instance. There is a proposal to support multiple instances in the future. Let us know if this interests you.

## CSS Custom Property (aka CSS Variable) support

The Login Widget is currently customizable via the Tailwind config file. This limits the customization to build-time only. There's a proposal to have CSS Custom Property support, which will allow customization at the runtime. You can read more about [CSS Custom Properties on the MDN page](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties).

## Chainable observables

Rather than creating an API object/observable and calling methods off of that object separately, the API is chainable to reduce boilerplate. For example:

```js
// Instead of this:
const journeyEvents = journey();
journeyEvents.subscribe((event) => console.log(event));
journeyEvents.start();

// A chainable option would look like this:
journey()
  .start()
  .subscribe((event) => console.log(event));
```
