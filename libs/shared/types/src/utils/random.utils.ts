export const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

export const getRandomInt = (min: number, max: number): number => {
  if (min > max) {
    throw new Error('min cannot be greater than max');
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomElement = <T>(array: ReadonlyArray<T>): T => {
  if (array.length === 0) {
    throw new Error('Cannot get random element from an empty array');
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};