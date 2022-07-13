export function generateStyleString(styles: {key: string; value: string;}[]) {
  return styles?.reduce((prev, curr) => {
    if (curr) {
      prev = `${prev} ${curr.key}: ${curr.value};`;
    }
    return prev;
  }, '');
}
