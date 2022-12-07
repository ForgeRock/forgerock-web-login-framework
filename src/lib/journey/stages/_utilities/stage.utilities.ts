import { get } from 'svelte/store';
import type { z } from 'zod';

import { configuredJourneys, journeyItemSchema } from '$journey/config.store';

import type { StageJourneyObject } from '$journey/journey.interfaces';
import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';

/**
 * @function captureLinks - This is a callback for onMount that internally handled links and prevents navigation
 * @param {object} linkWrapper - The object return from `bind:this` attribute on an native element
 * @param {object} currentJourney - The current stage's journey object
 */
export function captureLinks(linkWrapper: HTMLElement, currentJourney: StageJourneyObject) {
  const journeys = get(configuredJourneys);
  const stack = get(currentJourney.stack);

  linkWrapper.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;
    const href = target.hasAttribute('href') && target.getAttribute('href');

    const { action, journey } = matchJourneyAndDecideAction(href, journeys, stack);

    if (!action) {
      // If no action is required, return early and allow default behavior
      return;
    }

    // Action is required, so prevent default behavior
    event.preventDefault();

    // Now, push or pop accordingly
    if (action === 'push') {
      currentJourney.push({ tree: journey });
    } else if (action === 'pop') {
      currentJourney.pop();
    }
  });
}

/**
 * Exporting this solely to unit test the logic. It is not intended for external use.
 * @private - compares requested and current journey, then pops or pushes accordingly
 * @param href
 * @param journeys
 * @param stack
 */
export function matchJourneyAndDecideAction(
  href: string | false | null,
  journeys: z.infer<typeof journeyItemSchema>[],
  stack: StepOptions[],
) {
  if (href) {
    /**
     * Does this href match an item configured in the journeys?
     */
    const match = journeys.find((item) => {
      return item.match.find((string) => {
        return href === string;
      });
    });

    if (match) {
      const previousJourney = stack[stack.length - 2];

      if (!previousJourney || previousJourney.tree !== match.journey) {
        return { action: 'push', journey: match.journey };
      } else {
        return { action: 'pop' };
      }
    } else {
      return { action: null };
    }
  } else {
    return { action: null };
  }
}
