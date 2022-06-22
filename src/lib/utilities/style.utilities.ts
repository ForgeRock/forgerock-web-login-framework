export function generateStyleString(styles) {
  return styles?.reduce((prev, curr) => {
    if (curr) {
      prev = `${prev} ${curr.key}: ${curr.value};`;
    }
    return prev;
  }, '');
}
