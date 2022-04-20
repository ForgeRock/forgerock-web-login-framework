import { AM_COOKIE_NAME, AM_DOMAIN_PATH, JSON_REALM_PATH } from "$lib/constants";
import { amSessions } from "$lib/sessions";

export async function post(event) {
	const body = event.request.body.read();

	console.log(body.toString());

	const cookie = event.request.headers.get('cookie');
	const cookieValue = cookie && amSessions[0] ? amSessions[0] : '';

	console.log('Saved AM sessions:');
	console.log(amSessions);
	console.log(`Cookie sent to AM: ${cookieValue}`);

	const response = await fetch(`${AM_DOMAIN_PATH}${JSON_REALM_PATH}/authenticate?authIndexType=service&authIndexValue=Login`, {
		method: 'POST',
		headers: {
			'accept': 'application/json',
			'accept-api-version': 'protocol=1.0,resource=2.1',
			'content-type': 'application/json',
			'cookie': cookieValue,
		},
		body: body.toString(),
	});

	const resBody = await response.json();

	console.log('Body of response from authenticate call:');
	console.log(resBody);

	const cookies = response.headers.get('set-cookie');
	console.log(`AM response write cookie header: ${cookies}`);

	if (cookies.includes(AM_COOKIE_NAME)) {
		if (!amSessions.includes(cookies)) {
			amSessions.push(cookies);
		}
		console.log('Saved AM sessions:');
		console.log(amSessions);
	}

	return {
		status: 200,
		body: resBody,
		headers: {
			'set-cookie': cookies ? `cookie=${AM_COOKIE_NAME}; SameSite=None; HTTPOnly; Secure` : null,
		},
	}
}