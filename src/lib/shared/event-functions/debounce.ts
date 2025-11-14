// eslint-disable-next-line
export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      fn.apply(this, args);
      t = null;
    }, delay);
  };
}
