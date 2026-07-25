export type Predicate<T> = (item: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;

export const applyFilters = <T>(
  items: Iterable<T> | T[],
  ...predicates: Array<Predicate<T> | undefined | null | false>
): T[] => {
  const activePredicates = predicates.filter(
    (p): p is Predicate<T> => typeof p === 'function'
  );

  if (activePredicates.length === 0) {
    return Array.from(items);
  }

  return Array.from(items).filter((item) =>
    activePredicates.every((predicate) => predicate(item))
  );
};

export const applySort = <T>(
  items: T[],
  comparator: Comparator<T>
): T[] => {
  return [...items].sort(comparator);
};