export function setItem(key, value) {
  if (sessionStorage) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

export function getItem(key) {
  if (!sessionStorage) {
    throw new ReferenceError('error');
  }

  return JSON.parse(sessionStorage.getItem(key));
}

export function removeItem(key) {
  if (!sessionStorage) {
    throw new ReferenceError('error');
  }

  sessionStorage.removeItem(key);
}

export function clearItem() {
  if (sessionStorage) {
    sessionStorage.clear();
  }
}