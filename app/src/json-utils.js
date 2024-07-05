const NULL_VALUE = String(null);

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
  if (responseData.error) {
    throw Error(`${responseData.error}`);
  }
  if (responseData === NULL_VALUE) return null;
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
  if (responseData.error) {
    throw Error(`${responseData.error}`);
  }
  if (responseData === NULL_VALUE) return null;
  return responseData;
}
