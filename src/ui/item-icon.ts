/** Render a ware icon — image path or legacy emoji string. */
export function itemIconHtml(ico: string, alt = ''): string {
  if (ico.startsWith('/') || ico.startsWith('http')) {
    const safeAlt = alt.replace(/"/g, '&quot;');
    return `<img src="${ico}" alt="${safeAlt}" loading="eager" decoding="async">`;
  }
  return ico;
}
