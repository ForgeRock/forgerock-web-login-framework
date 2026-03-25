export function generateEnvExample(): string {
  return `# ForgeRock AM Connection
VITE_FR_AM_URL=https://your-tenant.forgeblocks.com/am
VITE_FR_AM_COOKIE_NAME=iPlanetDirectoryPro
VITE_FR_OAUTH_PUBLIC_CLIENT=your-oauth-client-id
VITE_FR_REALM_PATH=alpha
`;
}
