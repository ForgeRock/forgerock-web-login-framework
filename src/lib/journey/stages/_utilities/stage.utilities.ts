import { get } from 'svelte/store';

import { configuredJourneys } from '$journey/config.store';

import type { StageJourneyObject } from '$journey/journey.interfaces';

export function captureLinks(linkWrapper: HTMLElement, currentJourney: StageJourneyObject) {
  const journeys = get(configuredJourneys);
  const stack = get(currentJourney.stack);

  linkWrapper.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;

    if (target.hasAttribute('href')) {
      const anchor = target as HTMLAnchorElement;
      const match = journeys.find((item) => {
        return item.match.find((string) => {
          const href = anchor.getAttribute('href');
          return href === string;
        });
      });

      if (match) {
        event.preventDefault();

        const isPreviousJourney = stack.find((item) => {
          return item.tree === match.journey;
        });

        if (!isPreviousJourney) {
          currentJourney.push({ tree: match.journey });
        } else {
          currentJourney.pop();
        }
      }
    }
  });
}
