# Instructions for Beta Testing

## Step 1. Read the README thoroughly

Please read the README and answer the following questions:

1. Does the README address your most important questions quickly?
2. Do you understand the difference between the two form-factors: modal and inline?
3. Take note of what's currently NOT supported
4. What do you feel is missing from the README?

## Step 2. Use the Modal component

[Available video introduction to the Widget](https://drive.google.com/file/d/1rnBYPNY2aUUslGOd3pZMu7mMnZBx6QYK/view?usp=sharing).

1. Install the Widget into an existing or new app (preferably an existing app that already uses the ForgeRock JavaScript SDK)
2. Use the Modal component in your app to login a user with ID Cloud's default Login journey
3. Did the Modal work and look the way you envisioned it?
4. After authenticating a user, inspect the response in the `journey.onSuccess` callback. Does this response object contain what you would like to know?
5. Does the Widget provide what you'd need to build a fully functional protected app? Is the `journey`, `modal`, `request` and `user` objects enough?
6. Was there anything missing from the Widget that you expected? Missing APIs, behavior, style?

## Step 3. Use the Inline component

1. Install the Widget into an existing or new app
2. Setup the Inline component in your app to login a user with ID Cloud's default Registration journey
3. Did the widget work the way you envisioned it?
4. Was this implementation more difficult than the Modal component? What made it more difficult and how could the Widget make it easier?
5. Was there anything missing from the Inline component that you expected? Missing APIs, behavior, style?

## Step 4. Reflect on the overall effort

1. Did the Quickstart actually get you started quickly?
2. Did you like the look and feel of the Widgets (UX)?
3. How was the developer experience? Was it "intuitive"?
4. How much customization to the UX do you believe is critical for an MVP?

## Stretch Goal

For existing apps that already use the SDK, can you strip out the SDK completely from your app and see if the Widget can replace everything the SDK currently does (with the understanding that the Widget doesn't support all callbacks, yet).
