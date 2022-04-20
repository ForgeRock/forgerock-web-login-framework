import { AM_DOMAIN_PATH, OAUTH_REALM_PATH } from "$lib/constants";
import { amSessions } from "$lib/sessions";

export async function get(event) {
	const response = await fetch(`${AM_DOMAIN_PATH}${OAUTH_REALM_PATH}/authorize${event.url.search}`,{
		method: 'GET',
		headers: {
			cookie: amSessions[0],
		},
	});

	console.log(response.url);
	console.log(await response.text());

	return {
		status: 302,
		headers: {
			location: response.url,
		},
	};
}