import {
  AppError,
  NO_AUTHENTICATION_COOKIE,
  EMAIL_ALREADY_USED,
  LOGIN_ERROR,
  ACCESS_TOKEN_INVALID,
  EMAIL_NOT_REGISTERED,
  handleErrors,
} from '../../app/src/errors.mjs';

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
      set hashed_password = ${crypto.hash(password)}
      where id = ${this.data.id}`;
  }

  async updateFullName(fullName) {
    if (fullName === this.data.full_name) return;
    const { sql, crypto } = this.connection;
    await sql`
      update hoauser
      set encrypted_full_name = ${crypto.encrypt(fullName)}
      where id = ${this.data.id}`;
    this.data.full_name = fullName;
  }

  async validateEmail() {
    if (this.data.email_validated) return;
    const { sql } = this.connection;
    await sql`
      update hoauser
      set email_validated = true
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
          email_validated = false
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

  static async nameUsed(connection, name) {
    const { sql, crypto } = connection;
    const data = await sql`
      select count(1) from hoauser
      where hashed_name = ${crypto.hash(name)}`;

    return Number(data[0].count) !== 0;
  }

  static async emailUsed(connection, email) {
    const { sql, crypto } = connection;
    const data = await sql`
      select count(1) from hoauser
      where hashed_email = ${crypto.hash(email)}`;

    return Number(data[0].count) !== 0;
  }

  static async create(connection, name, fullName, email, password) {
    const { sql, crypto } = connection;
    const data = await sql`
      insert into hoauser (
        hashed_name,
        encrypted_name,
        encrypted_full_name,
        hashed_email,
        encrypted_email,
        email_validated,
        hashed_password
      ) values (
        ${crypto.hash(name)},
        ${crypto.encrypt(name)},
        ${crypto.encrypt(fullName)},
        ${crypto.hash(email)},
        ${crypto.encrypt(email)},      
        false, 
        ${crypto.hash(password)}
      )

      returning *
    `;
    return new HoaUser(connection, data[0]);
  }

  static decrypt(crypto, data) {
    delete data.hashed_password;
    delete data.hashed_name;
    delete data.hashed_email;
    delete data.hashed_token;
    delete data.token_creation_timestamp;
    data.name = crypto.decrypt(data.encrypted_name);
    delete data.encrypted_name;
    data.full_name = crypto.decrypt(data.encrypted_full_name);
    delete data.encrypted_full_name;
    data.email = crypto.decrypt(data.encrypted_email);
    delete data.encrypted_email;
    return data;
  }

  static async get(connection, credentials) {
    const { sql } = connection;
    const [hashedName, hashedPassword] = credentials;
    const data = await sql`
      select * from hoauser
      where hashed_name = ${hashedName}
      and hashed_password = ${hashedPassword}`;
    if (data.length !== 1) {
      throw new AppError(LOGIN_ERROR);
    }
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
    return new HoaUser(connection, data[0]);
  }

  static loginCredentials(crypto, name, password) {
    return [crypto.hash(name), crypto.hash(password)];
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
}

/**
 * The token expiration interval (12 hours from creation).
 */
const TOKEN_EXPIRATION = '12:00:00';

const AUTH_COOKIE = 'HAU';

/** Loads and returns the user using the authentication cookie. */
export function hoaUserApi(connection, app) {
  function parseCookie(cookie) {
    const authCookie = cookie
      .split(';')
      .map((c) => c.split('='))
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

  function getCredentials(name, password) {
    return HoaUser.loginCredentials(connection.crypto, name, password);
  }

  async function authenticate(req) {
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
      const { name } = hoaUser;
      const credentials = getCredentials(name, password);
      setCookie(res, credentials);
      res.json({ hoaUser });
    }),
  );

  /** Signs up an existing user using name/password and sets the authentication cookie. */
  app.post(
    '/api/hoauser/signin',
    handleErrors(async (req, res) => {
      const { name, password } = req.body;
      const credentials = getCredentials(name, password);
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
      const { name, fullName, email, password } = req.body;
      const hoaUserInst = await HoaUser.create(
        connection,
        name,
        fullName,
        email,
        password,
      );
      const hoaUser = hoaUserInst.getData();
      const credentials = getCredentials(name, password);
      setCookie(res, credentials);
      res.json({ hoaUser });
    }),
  );

  /** Checks if a user name is already used. */
  app.post(
    '/api/hoauser/validate/name',
    handleErrors(async (req, res) => {
      const { name } = req.body;
      const result = await HoaUser.nameUsed(connection, name);
      res.json({ ok: !result });
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
}
