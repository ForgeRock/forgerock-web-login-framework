## Testing

The below is a technical brief on our testing within this framework, but if you are looking for more of a philosophy behind why and how we test, [see this article about the Layered Cake of Testing](https://cerebralideas.com/blog/layered-cake-of-testing).

### Unit

We use Vitest and only test utility functions (almost always pure, stateless functions). We don't "unit test" components. Unit tests live as siblings to the very file it tests.

### Integration

We test components with Storybook's "Interaction" tests for our integration of Svelte components along with their use of utility functions. These tests live within the `*.stories.js` file as a sibling to the component itself.

### End-to-end

We test the fully running artifact with Playwright. Testing the widget is done against a running Svelte app that imports the built package of the Widget as if installed via NPM. Tests are in the root `tests` directory.

### Manual tests

These are end-to-end tests that cannot be automated and must be manually tested. This usually involves randomly generated codes that reside outside of the system, and are hard or impossible to mock.

#### Please manually test the following

1. Journey continuation feature (e.g. Email Suspend Node) requires manual testing due to the randomly generated code sent to email which cannot be automated at this time.
2. Social authentication feature requires manual testing due to the use of accounts and credentials for external services, which cannot be automated.

## Troubleshooting

### Playwright Test Async Issue Explained

Okay, I figured it out. Luckily, it’s quite simple (once it clicks). I’ll break down the test and why it fails line by line.

Here’s the test as a whole, and it fails every time due to line 22:

```js
await page.goto('widget/modal?journey=LoginWithConfirmationAndChoice');

const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
await loginButton.click();

await page.fill('text="User Name"', 'demouser');
await page.locator('button', { hasText: 'Next' }).click();

await page.fill('text=Password', 'j56eKtae*1');
await page.locator('button', { hasText: 'Next' }).click();

// Confirmation
expect(await page.locator('text="Are you human?"')).toContainText('Are you human?');
await page.selectOption('select', '0');
await page.locator('button', { hasText: 'Next' }).click();

// Choice
expect(await page.locator('text="Are you sure?"')).toContainText('Are you sure?');
await page.selectOption('select', '0'); <-- #### LINE 22 ###############
await page.locator('button', { hasText: 'Next' }).click();

const fullName = page.locator('#fullName');
const email = page.locator('#email');

expect(await fullName.innerText()).toBe('Full name: Demo User');
expect(await email.innerText()).toBe('Email: demo@user.com');
```

First, we have to understand how Playwright’s API works. To put it simply, locators are inert until you act on them, so they don’t return promises. The locator itself isn’t all that valuable until you do something with it, like click, fill, select, retrieve it’s containing HTML or text, etc. So, this code is incomplete:

```js
console.log('start');
expect(await page.locator('text="Are you human?"')).toContainText('Are you human?');
console.log('end'
```

Although the above code looks like it would run in this order:

1. Log “start”
2. Wait for an element with the text “Are you human?”
3. Assert that the text matches what’s expected
4. Log “end”

… but, it doesn’t actually work like that. This is what happens:

1. Log “start”
2. Log “end”
3. Element appears on page with text “Are you human?”
4. Assert that text matches

There are two reasons for that. First, locators don’t return a Promise, so this:

```js
await page.locator('text="Hello"');
```

… is incorrect, and it immediately returns. With that said, let’s look at the full line of code in question:

```js
expect(await page.locator('text="Are you human?"')).toContainText('Are you human?');
```

… is the same thing as this:

```js
expect(page.locator('text="Are you human?"')).toContainText('Are you human?');
```

Notice the issue? The code doesn’t pause execution on this line at all. It immediately continues, regardless of the locator’s completion. So, let’s look at a bit more code:

```js
expect(await page.locator('text="Are you human?"').innerText()).toBe('Are you human?');
await page.selectOption('select', '0');
```

The first code pair for this works, but not for the reason we think. The reason this first pair works is the `await page.selectOption(‘select’, ‘0’)`. Since there was no previous `select` element on the page, this wasn’t problematic (hint, hint).

But, once we introduce the second pair:

```js
expect(await page.locator('text="Are you sure?"').innerText()).toBe('Are you sure?');
await page.selectOption('select', '0');
await page.locator('button', { hasText: 'Next' }).click();
```

… you may now be able to spot the issue. The `await` is ignored, so it continues on to the next line, the `select`. Since a select element DOES already exist on the page from the *previous* step, it uses it. What’s more, there’s also already a “Next” button, so it tries to click it.

But, the DOM refreshes because the response from the server is received, but the above code already executed, so it’s stuck. It’s already waiting on this line of code:

```js
expect(await fullName.innerText()).toBe('Full name: Demo User');
```

To fix this, we can do a bit of chaining with something that DOES return a Promise. Since we are just wanting to wait for text to be rendered in the DOM, we can use this:

```js
await page.locator('text="Are you human?"').innerText();
```

Let’s look at the pairing now:

```js
expect(await page.locator('text="Are you sure?"').innerText()).toBe('Are you sure?');
await page.selectOption('select', '0');
await page.locator('button', { hasText: 'Next' }).click();
```

The above works because the `innerText()` returns a Promise, so that await is actually respected, giving us the intention we want: selecting the choice AFTER “Are you sure?” is found in the DOM.

So, here’s the whole piece of code that works:

```js
await page.goto('widget/modal?journey=LoginWithConfirmationAndChoice');

const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
await loginButton.click();

await page.fill('text="User Name"', 'demouser');
await page.locator('button', { hasText: 'Next' }).click();

await page.fill('text=Password', 'j56eKtae*1');
await page.locator('button', { hasText: 'Next' }).click();

// Confirmation
expect(await page.locator('text="Are you human?"').innerText()).toBe('Are you human?');
await page.selectOption('select', '0');
await page.locator('button', { hasText: 'Next' }).click();

// Choice
expect(await page.locator('text="Are you sure?"').innerText()).toBe('Are you sure?');
await page.selectOption('select', '0');
await page.locator('button', { hasText: 'Next' }).click();

const fullName = page.locator('#fullName');
const email = page.locator('#email');

expect(await fullName.innerText()).toBe('Full name: Demo User');
expect(await email.innerText()).toBe('Email: demo@user.com');
```

#### References

Here are the APIs discussed above:

1. Locators: [page.locator | Playwright](https://playwright.dev/docs/api/class-page#page-locator) – notice how it returns `Locator`
2. `innnerText`: [locator.innerText | Playwright](https://playwright.dev/docs/api/class-locator#locator-inner-text) – notice how it return `Promise<string>`

### Chromatic

Rebuilds and syncs with Chromatic:

```sh
npx chromatic --project-token=e10acf0c74f9 --patch-build=<current-branch>...main
```

Make sure upstream is set on all branches:

```sh
git push -u origin <branch>
```
