## FAQs

### Question: Research and thoughts on Svelte?

Hey you two! I finished the SvelteKit todo sample app, though there are likely some bugs. I’m really happy how quickly I built it and deployed it onto Vercel. I didn’t come across any real issues or struggles. I have a few minor dislikes, but nothing moderate, serious or critical.

- Repo: https://github.com/cerebrl/forgerock-sample-web-svelte
- Deployed: fr-sveltekit-todos.crbrl.io

I also redeployed a production build of the existing React app, so the two can be approximately compared (the React app is not code split, SvelteKit app is code split). But, being that they are the exact same app with the only difference being the JS framework, it’s a neat comparison.

React app: fr-react-todos.crbrl.io

Here are the things that stand out to me about Svelte:

- Reactivity model is very good and Svelte stores are awesome
- Business logic and state can be written outside of components without special wrapping or complex concepts, like React hooks
- The Svelte’ism footprint really quite small; there’s no complex theoretical Svelte concepts to learn
- You can write JS directly in the component template (to a degree); mostly, I’m happy that you aren’t limited to just strings in directives
- I don’t feel a strong need to reach to additional tooling for building full-apps, unlike with React

Here are a few dislikes:

- I’m continuously forgetting to “unwrap” the store with the $ prefix; though, this is admittedly very minor.
- Only one “component” per file. This still annoys me a little bit. Though, it doesn’t really impact functionality at all.
- In the script portion, you can’t arbitrarily create template partials, like in React: let greeting = <p>Hello</p>;. Like the above, not a huge deal, but I did mildly want it in building the form.svelte.
- You can’t write TypeScript in the template portion of the component. This has some minor typing implications that can be a bit of a head-scratcher.

### Question: Do I post a PR from a fork of this repo or from a branch directly from this repo?

Due to the limitations of our current CI, we need PRs to come from this repo. Forking and using a fork is okay, but the final PR that will be merged needs to be a pushed branch into this repo.

### Question: What is the `routes` directory and why `routes/(app)` and `routes/e2e`?

Quick explanation about the deployed e2e test apps (going off of the question in the standup):

1. The main “app” (under `routes/(app)`) is accessible on the `/` or `/register` route and is built more to simulate a Central Login app. This means its primary function is to just complete a journey and redirect the user. The fact that it’s actually calling the authorize endpoint was not intended to be left there (sorry).
2. The apps that are under `/e2e/widget/*` are for testing a full embedded login experience which would also entail requesting of OAuth tokens and user information.

For now, let’s just consider the first app for testing just the Login and Register journeys, and the second, widget e2e test apps for the whole flow.

### Question: My component is not updating as I expect it

Any variable that derives its value from function calls or calculations needs to be wrapped in the reactive block.

Given the below example code:

```ts
<script>
  export let first;
  export  let last;

  let fullName = `${firstName} ${lastName}`;
</script>

<p>{fullName}</p>
```

Svelte will, by default, only observe for changes to variables used within the template. So, using the above example. It will only watch for changes to fullName and NOT to changes to first or last.
So, we need to communicate to Svelte that other variables need to be observed as well. Let’s introduce the reactive block concept …

```ts
<script>
  export let first;
  export  let last;

  let fullName = `${firstName} ${lastName}`;

  $: {
    fullName = `${firstName} ${lastName}`;
  }
</script>

<p>{fullName}</p>
```

Now, Svelte understands that fullName is a derived value from the concatenation of first and last, so it adds them to the observed variables.

### Question: This seems to make the whole label clickable to check / uncheck the checkbox, which is why it “feels” wrong to be putting a link in an element which is already clickable. Problem is, I don’t know if this hunch is correct, or what the alternative might be.

You are correct. We should avoid nesting elements that handle user events within each other, and it’s a good callout. This is actually a tricky beast, and the solution isn’t going to be very easy, unfortunately.

What I’d recommend is altering the primitive Message component. What you can do is use the @html keyword and pass a string with an HTML link to the Message component. Docs here: https://svelte.dev/docs#template-syntax-html. But, when you do this, make sure to _sanitize_ the HTML string before it’s injected as this is definitely a “footgun” (see the text-output.svelte as an example: https://github.com/cerebrl/forgerock-web-login-framework/blob/main/src/lib/journey/callbacks/text-output/text-output.svelte).

Then, you can pass `<a href={link} _target="blank">View full Terms & Conditions</a>` into the message prop of the Checkbox component. Of course, the message string needs to be a translated string, not a hardcoded string. Let me know if this makes sense to you.

The end result should be the message, which is a link, printed on its own line outside of the label, but still within the Checkbox component and laid out appropriately.

### Question: I’m trying to define a new property for the config of the widget. I would like to know.. how do I do this? And once I add it, how do I reference it in the code?

Sorry that this isn’t more clear. You won’t use the config prop because that’s dedicated to the JS SDK configuration. What you’ll need is similar to the content prop and style prop.

Since you are the first to introduce the concept of passing in links from the parent application, you’ll have to wire this up, using content and style as examples. Assuming we’ll have more than one link, you can start by exporting a links variable from the modal.svelte and the inline.svelte components within the src/widget directory … a sibling to the export let config and export let content props. The user of the Widget will need to pass an object with links into this prop.

So, the top-level Widget components will change to this:

```ts
export let config: z.infer<typeof partialConfigSchema>;
export let content: z.infer<typeof partialStringsSchema>;
export let links: z.infer<typeof partialLinksSchema>; // <- NEW PROP
export let style: Style;
```

_(The typing I’ll address in a bit.)_

Then, the developer passes this new links prop like this:

```ts
new Widget({
  target: widgetEl,
  props: {
    config: {
      // JS SDK configuration
    },
    content,
    links: {
      // <- NEW PROP
      termsConditions: 'https://example.com/terms',
    },
    style: {
      // Style configuration
    },
  },
});
```

The type definition for this links prop and the handling of this data will need to come from a new store. Again, use the style and content props and their corresponding stores as examples. Then, you can use Zod (docs: https://zod.dev) to help with the definition of types.

I’m mentioning stores here (docs: https://svelte.dev/docs#run-time-svelte-store) because we probably don’t want to have to pass a links object around everywhere in the app. So, using Svelte Stores allows us to collect the links and then import them into the app where needed. Let me know if this makes sense.

### Question: How are we going to handle scripts from AM?

As for the Push nodes, this is for the QR code display. I'd rather "natively" support QR codes, rather than have the Widget actually run the external script. So, we will either parse the script like the WebAuthn or add a switch to send JSON rather than a script from the node.

My long term vision for the Widget is for us to educate the customer on adding native support for the features they want by extending the Widget, rather than writing the scripts in AM and having the Widget execute them. From an architectural standpoint, supporting the features in the Widget is far superior from a quality control and security standpoint.

I would highly recommend we treat the execution of scripts from AM within client apps to be a legacy method, and provide this superior method and habituate customers to it, discouraging the "legacy" method. With that said, I would actually be okay with this being a "noop" component as we just need a component to exist, so Svelte doesn't get tripped up.

From a WebAuthn callback/feature perspective, the SDK just directly sets the value on the callback internally, and NOT through any hidden DOM input.

To go a bit further, if you think about the core reason for this pattern – sending scripts from AM for a client to execute in the DOM and injecting the side-effect of this execution into a hidden input – it's all about customizing the client's behavior when you don't have access to the source code.

This was always true for XUI and is still somewhat true for Platform Login. Customers don't have a holistically designed process for customizing or adding features to a login flow that is not natively supported by the client application, and they can't easily alter said application.

The Login Widget is directly designed to address this. We are explicitly designing a framework that allows them to add, extend, customize the login flow directly in the client application. Through good design, education and evangelism, I feel we can effectively "flip" the mental model of how our customers control their UX on its head and provide a far superior developer experience while doing so.

Anyway, I'm happy to continue this conversation with you and the rest of the team. I think it's vital for us to deeply understand this concept and evaluate this feature without the historical bias of its legacy. If, after deep contemplation, we still have a strong reason to allow for this "legacy" (as I call it) feature, then I'm happy to support it :)

### Question: Why do we not recommend setting a default `tree`?

There are some edge cases when using journeys/trees in ways other than initially authenticating a user. A few examples are:

1. Journey continuation with the Email Suspend Node
2. Transactional Authorization

In these examples, journeys are started _without_ explicitly declaring the `authIndexValue` (a reference to the journey) in the `/authenticate` request. Now, if we set a `tree` on the base config, the JavaScript SDK will, by default, add that as a value on the `authIndexValue` parameter. This can lead to conflicts between the journey the `suspendedId` or `advices` implicitly uses and the journey the `authIndexValue` is referencing.

To fix this, we recommend removing the configuration of the tree on base configurations, and only pass the intended tree at the start of a journey. This also better aligns with the other SDKs as they only append the `authIndexType` and `authIndexValue` at the start of calling a journey, but not on the subsequent calls to the endpoint.

Lastly, a default `tree` is not really needed as AM will fall back to the "default" tree set in AM if the `/authenticate` endpoint is initially called without an `authIndexValue` being given.
