# shell script to modify the gitignore file during ci

# We want to commit back the build package after a release

# so we can run checkmarx which is behind a vpn and doesn't

# support svelte out of the box. This file is just

# to add to the bottom of the gitignore during our release

# a !package/\* so that we unignore packages but we don't commit

# this change back. So locally we as developers are able to

# still ignore the package, and are not responsible for cluttering

# our pull requests with build rollup files.

# see the releaserc file and exec command for where this file is run.

echo '!package/\*' >> .gitignore
