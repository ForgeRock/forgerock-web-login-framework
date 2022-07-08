import { v4 as uuid } from 'uuid';

const amSessions: Map<string, string> = new Map();

export function set(cookie: string): string {
  console.log('Cookie being set:');
  console.log(cookie);
  const cookieUuid = uuid();
  amSessions.set(cookieUuid, cookie);
  console.log('AM Sessions stored:');
  console.log(amSessions);
  return cookieUuid;
}

export function get(uuid: string): string {
  console.log('UUID being requested:');
  console.log(uuid);
  const cookie = amSessions.get(uuid) || '';
  return cookie;
}

export function remove(uuid: string): void {
  amSessions.delete(uuid);
}
