import { isAppError } from './errors';

export async function getData(url) {
  const response = await fetch(url, {
    method: 'GET',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    mode: 'cors',
  });
  if (!response.ok) {
    throw Error(`${response.statusText}`);
  }
  const responseData = await response.json();
  const { error } = responseData;
  if (error && !isAppError(error)) {
    throw Error(`${error}`);
  }
  return responseData;
}

export async function postData(url, data, method = 'POST') {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    referrerPolicy: 'no-referrer',
    mode: 'cors',
    cache: 'no-store',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw Error(`${response.statusText}`);
  }
  const responseData = await response.json();
  const { error } = responseData;
  if (error && !isAppError(error)) {
    throw Error(`${error}`);
  }
  return responseData;
}

export async function uploadData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    referrerPolicy: 'no-referrer',
    mode: 'cors',
    cache: 'no-store',
    body: data,
  });
  if (!response.ok) {
    throw Error(`${response.statusText}`);
  }
  const responseData = await response.json();
  const { error } = responseData;
  if (error && !isAppError(error)) {
    throw Error(`${error}`);
  }
  return responseData;
}

export function formData(event) {
  return getFormData(event.currentTarget);
}

export function getFormData(elemenet) {
  const formData = new FormData(elemenet);
  return Object.fromEntries(formData.entries());
}

export function longAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = (now - date) / 1000;
  const intervals = [
    { num: 60, label: 'seconds' },
    { num: 60, label: 'minutes' },
    { num: 12, label: 'hours' },
    { num: 30, label: 'days' },
    { num: 12, label: 'months' },
    { num: 100000, label: 'years' },
  ];
  let period = 1;
  for (const interval of intervals) {
    if (diff < period * interval.num) {
      const diffAgo = Math.round(diff / period);
      const label =
        diffAgo > 1 ? interval.label : interval.label.replace(/s$/, '');
      return `${diffAgo} ${label} ago`;
    } else {
      period *= interval.num;
    }
  }
  return `Invalid date ${timestamp}`;
}

export function loadScript(src, position, id, onload = () => {}) {
  if (!position) {
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('async', '');
  script.setAttribute('id', id);
  script.onload = onload;
  script.src = src;
  position.appendChild(script);
}

export function loadScriptOnce(src, position, id, loaded, onload = () => {}) {
  if (typeof window === 'undefined') return;
  if (!loaded.current) {
    if (!document.querySelector(`#${id}`)) {
      loadScript(src, position, id, onload);
    } else {
      onload();
    }
    loaded.current = true;
  }
}
