// AIC platform admin-console tokens. The Custom Component Editor is platform
// chrome (like the Hosted Pages editor screen itself), not tenant-authored
// content — it uses AIC's own platform blue, not a tenant's Brand Color.
// "RobRoy" in the reference screenshot is the tenant *being edited*; its green
// Brand Color belongs to that tenant's hosted pages, never to the admin tool.
export const brand = {
  primary: '#0672cb',
  primaryHover: '#055aa3',
  secondary: '#69788b',
  success: '#2ed47a',
  danger: '#f7685b',
  warning: '#ffb946',
  info: '#109cf1',
  pageBackground: '#f5f6f8',
  cardBackground: '#ffffff',
  border: '#e2e5ea',
  textPrimary: '#1c2430',
  textMuted: '#69788b',
} as const;
