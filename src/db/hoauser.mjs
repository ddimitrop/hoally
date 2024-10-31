import {
  AppError,
  NO_AUTHENTICATION_COOKIE,
  EMAIL_ALREADY_USED,
  LOGIN_ERROR,
  ACCESS_TOKEN_INVALID,
  EMAIL_NOT_REGISTERED,
  handleErrors,
} from '../../app/src/errors.mjs';
import { OAuth2Client } from 'google-auth-library';

/**
 * A user of the Hoally site. It can be a member of 0 to MAX_USER_COMMUNITIES.
 */
export class HoaUser {
  constructor(connection, data) {
    this.connection = connection;
    this.data = HoaUser.decrypt(connection.crypto, data);
  }

  getData() {
    return this.data;
  }

  async updatePassword(password) {
    const { sql, crypto } = this.connection;
    await sql`
      update hoauser
      set hashed_password = ${crypto.hash(password)},
          last_update_timestamp = LOCALTIMESTAMP
      where id = ${this.data.id}`;
  }

  async updateName(name, fullName) {
    if (fullName === this.data.full_name && name === this.data.name) return;
    const { sql, crypto } = this.connection;
    await sql`
      update hoauser
      set 
          encrypted_name = ${crypto.encrypt(name)},
          encrypted_full_name = ${crypto.encrypt(fullName)},
          last_update_timestamp = LOCALTIMESTAMP
      where id = ${this.data.id}`;

    this.data.name = name;
    this.data.full_name = fullName;
  }

  async validateEmail() {
    if (this.data.email_validated) return;
    const { sql } = this.connection;
    await sql`
      update hoauser
      set email_validated = true,
          email_validation_timestap = LOCALTIMESTAMP
      where id = ${this.data.id}`;
    this.data.email_validated = true;
  }

  async updateEmail(email) {
    if (email === this.data.email) return;
    const emailUsed = await HoaUser.emailUsed(this.connection, email);
    if (emailUsed) {
      throw new AppError(EMAIL_ALREADY_USED);
    }
    const { sql, crypto } = this.connection;
    await sql`
      update hoauser
      set 
          hashed_email = ${crypto.hash(email)},
          encrypted_email = ${crypto.encrypt(email)},
          email_validated = false,
          last_update_timestamp = LOCALTIMESTAMP
      where id = ${this.data.id}`;
    this.data.email = email;
    this.data.email_validated = false;
  }

  async unregister() {
    const { sql } = this.connection;
    await sql`
      delete from hoauser
      where id = ${this.data.id}`;
  }

  async setDefaultCommunity(communityId) {
    const { sql } = this.connection;
    await sql`
      update hoauser
      set 
          default_community = ${communityId}
      where id = ${this.data.id}`;
    this.data.default_community = communityId;
  }

  static async emailUsed(connection, email) {
    const { sql, crypto } = connection;
    const data = await sql`
      select count(1) from hoauser
      where hashed_email = ${crypto.hash(email)}`;

    return Number(data[0].count) !== 0;
  }

  static async create(
    connection,
    name,
    fullName,
    email,
    password,
    emailValidated,
  ) {
    const { sql, crypto } = connection;
    const data = await sql`
      insert into hoauser (
        encrypted_name,
        encrypted_full_name,
        hashed_email,
        encrypted_email,
        email_validated,
        hashed_password
      ) values (
        ${crypto.encrypt(name)},
        ${crypto.encrypt(fullName)},
        ${crypto.hash(email)},
        ${crypto.encrypt(email)},      
        ${emailValidated}, 
        ${crypto.hash(password)}
      )

      returning *
    `;
    return new HoaUser(connection, data[0]);
  }

  static decrypt(crypto, data) {
    delete data.hashed_password;
    delete data.hashed_email;
    delete data.hashed_token;
    delete data.token_creation_timestamp;
    data.name = crypto.decrypt(data.encrypted_name);
    delete data.encrypted_name;
    data.full_name = crypto.decrypt(data.encrypted_full_name);
    delete data.encrypted_full_name;
    data.email = crypto.decrypt(data.encrypted_email);
    delete data.encrypted_email;
    delete data.creation_timestamp;
    delete data.last_update_timestamp;
    delete data.email_validation_timestap;
    delete data.last_signin_timestamp;
    delete data.last_access_date;

    return data;
  }

  static async get(connection, credentials) {
    const { sql } = connection;
    const [hashedEmail, hashedPassword] = credentials;
    const data = await sql`
      select *
      from hoauser
      where hashed_email = ${hashedEmail}
      and hashed_password = ${hashedPassword}`;
    if (data.length !== 1) {
      throw new AppError(LOGIN_ERROR);
    }
    await HoaUser.updateAccessDate(sql, data[0]);
    return new HoaUser(connection, data[0]);
  }

  static async getWithToken(
    connection,
    token,
    tokenExpiration = TOKEN_EXPIRATION,
  ) {
    const { sql, crypto } = connection;
    const data = await sql`
      select * from hoauser
      where hashed_token = ${crypto.hash(token)}
      and now() - token_creation_timestamp < cast(${tokenExpiration} AS INTERVAL)`;
    if (data.length !== 1) {
      throw new AppError(ACCESS_TOKEN_INVALID);
    }
    await HoaUser.updateAccessDate(sql, data[0]);
    return new HoaUser(connection, data[0]);
  }

  static async updateAccessDate(sql, data) {
    const { last_access_date: lastAccessDate } = data;
    if (
      !lastAccessDate ||
      lastAccessDate.toDateString() != new Date().toDateString()
    ) {
      await sql`
      update hoauser
      set last_access_date = CURRENT_DATE
      where id = ${data.id}`;
    }
  }

  static loginCredentials(crypto, email, password) {
    return [crypto.hash(email), crypto.hash(password)];
  }

  static async getToken(connection, email) {
    const emailUsed = await HoaUser.emailUsed(connection, email);
    if (!emailUsed) {
      throw new AppError(EMAIL_NOT_REGISTERED);
    }
    return HoaUser.updateToken(connection, email);
  }

  static async updateToken(connection, email) {
    const { sql, crypto } = connection;
    const token = crypto.uuid();
    const hashedToken = crypto.hash(token);
    await sql`
      update hoauser
      set hashed_token = ${hashedToken},
          token_creation_timestamp = LOCALTIMESTAMP
      where hashed_email = ${crypto.hash(email)}`;

    return token;
  }

  static async forcePassword(connection, email, password) {
    const { sql, crypto } = connection;
    await sql`
      update hoauser
      set hashed_password = ${crypto.hash(password)},
          last_update_timestamp = LOCALTIMESTAMP
      where hashed_email = ${crypto.hash(email)}`;
  }
}

/**
 * The token expiration interval (12 hours from creation).
 */
const TOKEN_EXPIRATION = '12:00:00';

const AUTH_COOKIE = 'HAU';

function parseCookie(cookie) {
  const authCookie = cookie
    .split(';')
    .map((c) => c.trim().split('='))
    .find((p) => p && p.length === 2 && p[0] === AUTH_COOKIE);
  const auth = authCookie[1];
  const credentials = auth.split('-');
  if (credentials.length != 2) {
    throw Error();
  }
  return credentials;
}

function setCookie(res, credentials) {
  const auth = credentials.join('-');
  res.cookie(AUTH_COOKIE, auth, { httpOnly: true });
}

/** Gets the authenticated user from the authentication cookie. */
export async function getUser(connection, req) {
  const {
    headers: { cookie },
  } = req;
  let credentials;
  try {
    credentials = parseCookie(cookie);
  } catch {
    throw new AppError(NO_AUTHENTICATION_COOKIE);
  }
  return await HoaUser.get(connection, credentials);
}

/** Loads and returns the user using the authentication cookie. */
export function hoaUserApi(connection, app) {
  const oauth2Client = new OAuth2Client();

  async function authenticate(req) {
    return getUser(connection, req);
  }

  function getCredentials(email, password) {
    return HoaUser.loginCredentials(connection.crypto, email, password);
  }

  async function tokenEmail(req, res, subject, description, path) {
    // Doesn't require authentication because its is also use for recovery emails.
    const { email } = req.body;
    const token = await HoaUser.getToken(connection, email);
    await connection.sendMail(
      email,
      subject,
      `${description} by following <a href="${req.headers.origin}/${path}/${token}"> this link</a>.`,
    );
    res.json({ token });
  }

  app.get(
    '/api/flags',
    handleErrors(async (req, res) => {
      const { flags } = connection;
      res.json({ flags });
    }),
  );

  app.get(
    '/api/hoauser',
    handleErrors(async (req, res) => {
      const hoaUserInst = await authenticate(req);
      const hoaUser = hoaUserInst.getData();
      res.json({ hoaUser });
    }),
  );

  app.post(
    '/api/hoauser/recover',
    handleErrors(async (req, res) => {
      const { token, password } = req.body;
      const hoaUserInst = await HoaUser.getWithToken(connection, token);
      await hoaUserInst.updatePassword(password);
      const hoaUser = hoaUserInst.getData();
      const { email } = hoaUser;
      const credentials = getCredentials(email, password);
      setCookie(res, credentials);
      res.json({ hoaUser });
    }),
  );

  /** Signs up an existing user using email/password and sets the authentication cookie. */
  app.post(
    '/api/hoauser/signin',
    handleErrors(async (req, res) => {
      const { email, password } = req.body;
      const credentials = getCredentials(email, password);
      const hoaUserInst = await HoaUser.get(connection, credentials);
      const hoaUser = hoaUserInst.getData();
      setCookie(res, credentials);
      res.json({ hoaUser });
    }),
  );

  /** Clears up the authentication cookie. */
  app.get(
    '/api/hoauser/logout',
    handleErrors(async (req, res) => {
      res.clearCookie(AUTH_COOKIE);
      res.json({ ok: true });
    }),
  );

  /** Creates a new user and sets the authentication cookie. */
  app.post(
    '/api/hoauser',
    handleErrors(async (req, res) => {
      const { name, fullName, email, password, emailVerified } = req.body;
      const hoaUserInst = await HoaUser.create(
        connection,
        name,
        fullName,
        email,
        password,
        emailVerified,
      );
      const hoaUser = hoaUserInst.getData();
      const credentials = getCredentials(email, password);
      setCookie(res, credentials);
      res.json({ hoaUser });
    }),
  );

  /** Updates a new user and may set a new authentication cookie. */
  app.put(
    '/api/hoauser',
    handleErrors(async (req, res) => {
      let hoaUserInst = await authenticate(req);
      let hoaUser = hoaUserInst.getData();
      const { name, fullName, email, password } = req.body;
      if (name !== hoaUser.name || fullName !== hoaUser.full_name) {
        await hoaUserInst.updateName(name, fullName);
      }
      if (email !== hoaUser.email) {
        await hoaUserInst.updateEmail(email);
      }
      if (password) {
        await hoaUserInst.updatePassword(password);
        const credentials = getCredentials(hoaUser.email, password);
        setCookie(res, credentials);
        hoaUserInst = await HoaUser.get(connection, credentials);
      } else {
        hoaUserInst = await authenticate(req);
      }
      hoaUser = hoaUserInst.getData();
      res.json({ hoaUser });
    }),
  );

  /** Deletes a user. */
  app.delete(
    '/api/hoauser',
    handleErrors(async (req, res) => {
      const hoaUserInst = await authenticate(req);
      await hoaUserInst.unregister();
      res.json({ ok: true });
    }),
  );

  /** Checks if an email is already used. */
  app.post(
    '/api/hoauser/validate/email',
    handleErrors(async (req, res) => {
      const { email } = req.body;
      const result = await HoaUser.emailUsed(connection, email);
      res.json({ ok: !result });
    }),
  );

  /** Generates a token for a user and sends the email for validation. */
  app.post(
    '/api/hoauser/email/validation',
    handleErrors(async (req, res) => {
      console.log('Will send validation email');
      await tokenEmail(
        req,
        res,
        'Please validate your HOAlly account',
        'Validate your HOAlly account',
        'validate-email',
      );
    }),
  );

  /* Validates a user email usign a token */
  app.post(
    '/api/hoauser/confirm/email',
    handleErrors(async (req, res) => {
      const { token } = req.body;
      const hoaUserIns = await HoaUser.getWithToken(connection, token);
      await hoaUserIns.validateEmail();
      const hoaUser = hoaUserIns.getData();
      res.json({ hoaUser });
    }),
  );

  /** Generates a token for a user and sends the email for validation. */
  app.post(
    '/api/hoauser/email/recover',
    handleErrors(async (req, res) => {
      await tokenEmail(
        req,
        res,
        'Access your HOAlly account',
        'Change your lost HOAlly account password',
        'recover-account',
      );
    }),
  );

  /** Changes the default community of the current user. */
  app.post(
    '/api/hoauser/default',
    handleErrors(async (req, res) => {
      const { communityId } = req.body;
      const hoaUserInst = await authenticate(req);
      await hoaUserInst.setDefaultCommunity(communityId);
      res.json({ ok: true });
    }),
  );

  async function getGoogleOathPayload(credential) {
    const { flags } = connection;
    const { googleClientId } = flags;
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    return ticket.getPayload();
  }

  /** Google sign up. */
  app.post(
    '/api/hoauser/google-signup',
    handleErrors(async (req, res) => {
      const { credential } = req.body;
      const payload = await getGoogleOathPayload(credential);
      res.json({ payload });
    }),
  );

  /** Google account merge. */
  app.post(
    '/api/hoauser/google-merge',
    handleErrors(async (req, res) => {
      const { credential } = req.body;
      const payload = await getGoogleOathPayload(credential);
      const { email, sub: password, email_verified: emailVerified } = payload;
      // If Google says that the user owns this email and its verified
      // we can reset the password
      if (emailVerified) {
        await HoaUser.forcePassword(connection, email, password);
        // Auto sign-in.
        const credentials = getCredentials(email, password);
        const hoaUserInst = await HoaUser.get(connection, credentials);
        const hoaUser = hoaUserInst.getData();
        setCookie(res, credentials);
        res.json({ hoaUser });
      } else {
        throw new AppError(LOGIN_ERROR);
      }
    }),
  );
}
