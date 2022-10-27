## Testing

### Unit

We use Vitest and only test utility functions (almost always pure, stateless functions). We don't "unit test" components. Unit tests live as siblings to the very file it tests.

### Integration

We test components with Storybook's "Interaction" tests for our integration of Svelte components along with their use of utility functions. These tests live within the `*.stories.js` file as a sibling to the component itself.

### End-to-end

We test the fully running artifact with Playwright. Testing the widget is done against a running Svelte app that imports the built package of the Widget as if installed via NPM. Tests are in the root `tests` directory.

## Troubleshooting

### Chromatic

Rebuilds and syncs with Chromatic:

```sh
npx chromatic --project-token=e10acf0c74f9 --patch-build=<current-branch>...main
```

Make sure upstream is set on all branches:

```sh
git push -u origin <branch>
```
