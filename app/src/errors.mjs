// There is an attempt to authenticate but there is no cookie.
export const NO_AUTHENTICATION_COOKIE = 'No authentication cookie';
// The user attempts to update their email but this already used.
export const EMAIL_ALREADY_USED = 'Email already used';
// There is an attempt to authenticate with name/password but its wrong.
export const LOGIN_ERROR = 'Login error';
// There is an attempt to authenticate with a token but its invalid or has expired.
export const ACCESS_TOKEN_INVALID = 'Access token invalid';
// There is an attempt to send a token for an email but that is not registered.
export const EMAIL_NOT_REGISTERED = 'Email not registered';

export const APP_ERRORS = [
  NO_AUTHENTICATION_COOKIE,
  EMAIL_ALREADY_USED,
  LOGIN_ERROR,
  ACCESS_TOKEN_INVALID,
  EMAIL_NOT_REGISTERED,
];

export class AppError extends Error {}

export function isAppError(msg) {
  return APP_ERRORS.indexOf(msg) !== -1;
}

export function handleErrors(cb) {
  return async (req, res) => {
    try {
      await cb(req, res);
    } catch (e) {
      if (e instanceof AppError) {
        res.json({ appError: e.message });
      } else {
        res.json({ error: e.message });
      }
    }
  };
}
