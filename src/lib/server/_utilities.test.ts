import { describe, expect, it } from 'vitest';

import { extractDomainFromUrl, rewriteCookieForClient, rewriteCookieForServer } from './_utilities';

describe('Domain utilities should work as expected', () => {
  it('should extract the domain out of a full URL', () => {
    const domain = extractDomainFromUrl('https://openam-sdks.forgeblocks.com/am/');
    expect(domain).toBe('openam-sdks.forgeblocks.com');
  });

  it('should extract the domain out of a development URL', () => {
    const domain = extractDomainFromUrl('https://dev.example.com:8080/am/');
    expect(domain).toBe('dev.example.com');
  });

  it('should extract the localhost out of a development URL', () => {
    const domain = extractDomainFromUrl('localhost:8080/am/');
    expect(domain).toBe('localhost');
  });
});

describe('Cookies should be rewritten for entity', () => {
  it('should convert server cookie to client cookie', () => {
    const clientCookie = rewriteCookieForClient({
      cookie:
        'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=openam-sdks.forgeblocks.com; Secure; HttpOnly; SameSite=none',
      amDomain: 'openam-sdks.forgeblocks.com',
      appDomain: 'localhost',
    });
    console.log(clientCookie);
    expect(clientCookie).toBe(
      'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=localhost; Secure; HttpOnly; SameSite=none',
    );
  });

  it('should convert client cookie to server cookie', () => {
    const serverCookie = rewriteCookieForServer({
      cookie:
        'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=localhost; Secure; HttpOnly; SameSite=none',
      amDomain: 'openam-sdks.forgeblocks.com',
      appDomain: 'localhost',
    });
    console.log(serverCookie);
    expect(serverCookie).toBe(
      'e1babb394ea5130=gfimW3GS8ADkkSaUv9cyWtzuFhk.*AAJTSQACMDIAAlNLABxiVzB3VHV1UmlQQVVDMmNueEVITFRkNWZPQzA9AAR0eXBlAANDVFMAAlMxAAIwMQ..*; Path=/; Domain=openam-sdks.forgeblocks.com; Secure; HttpOnly; SameSite=none',
    );
  });
});
