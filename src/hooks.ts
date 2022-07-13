import type { RequestEvent } from "@sveltejs/kit";

export function getSession({ request }: RequestEvent) {

  return {
    locale: request.headers.get('accept-language'),
  }
}
