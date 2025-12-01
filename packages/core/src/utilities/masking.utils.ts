export function maskEmail(email: string): string {
  if (!email) {
    return '***';
  }

  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }

  const localMasked =
    local.length <= 2
      ? local[0] + '***'
      : `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;

  const [domMain, ...domRest] = domain.split('.');
  const domMasked =
    domMain.length <= 1
      ? '*'.repeat(domMain.length || 3)
      : `${domMain[0]}${'*'.repeat(domMain.length - 1)}`;

  const tld = domRest.join('.');
  return tld ? `${localMasked}@${domMasked}.${tld}` : `${localMasked}@${domMasked}`;
}
