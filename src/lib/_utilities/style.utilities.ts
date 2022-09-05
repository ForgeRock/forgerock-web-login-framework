export function generateStyleString(styles: Record<string, string>[]) {
  return styles?.reduce((prev, curr) => {
    if (curr) {
      prev = `${prev} ${curr.key}: ${curr.value};`;
    }
    return prev;
  }, '');
}
