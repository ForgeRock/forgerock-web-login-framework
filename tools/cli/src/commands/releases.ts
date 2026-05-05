import { Command } from '@effect/cli';
import { Console, Effect } from 'effect';

import { Release } from '../services/release.js';

export const releasesCommand = Command.make('releases', {}, () =>
  Effect.gen(function* () {
    const release = yield* Release;
    const releases = yield* release.listReleases();

    yield* Console.log('\nAvailable Login Framework releases:\n');
    for (const { tag, publishedAt } of releases) {
      yield* Console.log(`  ${tag.padEnd(10)} ${publishedAt}`);
    }
    yield* Console.log('');
  }),
).pipe(Command.withDescription('List available Login Framework releases from GitHub.'));
