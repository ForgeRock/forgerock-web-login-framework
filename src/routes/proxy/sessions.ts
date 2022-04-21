import { AM_DOMAIN_PATH, JSON_REALM_PATH } from "$lib/constants";
import { amSessions } from "$lib/sessions";

export async function post(event) {

	const response = await fetch(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}/sessions/${event.url.search}`,{
		method: 'POST',
		headers: {
			cookie: amSessions[0],
		},
	});
	// const resBody = await response.json();
	// console.log(response);

	return {
		status: 200,
		body: response.body,
	};
}