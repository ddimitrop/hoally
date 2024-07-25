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

export function formData(event) {
  return getFormData(event.currentTarget);
}

export function getFormData(elemenet) {
  const formData = new FormData(elemenet);
  return Object.fromEntries(formData.entries());
}
