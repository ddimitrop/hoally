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

export async function postData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
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

export async function postForm(url, event) {
  const formData = new FormData(event.currentTarget);
  const formJson = Object.fromEntries(formData.entries());
  return postData(url, formJson);
}