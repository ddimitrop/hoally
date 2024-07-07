import { postData } from './json-utils.js';

export async function sendValidationEmail(email) {
  return postData('api/hoauser/email/validation', {
    email,
  });
}
