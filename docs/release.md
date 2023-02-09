## Release Process

The login widget follows semantic versioning principles. This means that patches, minors and majors are reflective to the change that has occured within the codebase.

We developed on `alpha`, which is significant of active feature development being done, in preparation for a version. Code on an alpha branch are not "production" ready and is a use-as-is state. This means there may be bugs in the alpha tags, and api's can break.

`Beta` is signficant that active development of new features have mostly finished, and the api is in a stable place where breaking changes should not occur. Beta is when bug fixes and feedback is gathered in preaparation for a release.

`main` branch is where live published, stable releases are created from. Merging from `beta` into `main` triggers a release of a new version using the `semantic-release` package. So in the case of `1.0-beta.1` being merged into main, this would trigger the release of `1.0`.

versions are determined based on conventional commit messaging. `fix` is going to trigger a patch, and `feat` will trigger a minor release. If a new feature is being developed for a stable version, the feature branch is made off of that stable version, and then merged back into that HEAD. Our CI will then trigger the release process when merge occurs. This keeps a continuous delivery flow, where clients are able to update and get code at a fast pace.

If we are preparing for a version 2, we would be able to recreate our alpha branch from the current `main` HEAD commit. Then develop those features on alpha, where merges into alpha would trigger a new release of an alpha tag.

You can read more about our commit message styling here:
(Conventional Commits)[https://www.conventionalcommits.org/en/v1.0.0/].

You can read more about the release process here: (Release Workflow)[https://semantic-release.gitbook.io/semantic-release/recipes/release-workflow]
