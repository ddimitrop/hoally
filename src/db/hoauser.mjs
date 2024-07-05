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
      throw new Error('Email used');
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
      throw new Error('Login error');
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
      throw new Error('Access token invalid');
    }
    return new HoaUser(connection, data[0]);
  }

  static loginCredentials(crypto, name, password) {
    return [crypto.hash(name), crypto.hash(password)];
  }

  static async forgotPassword(connection, email) {
    const emailUsed = await HoaUser.emailUsed(connection, email);
    if (!emailUsed) {
      throw new Error('Not used email');
    }
    return HoaUser.getToken(connection, email);
  }

  static async getToken(connection, email) {
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

const NULL_VALUE = String(null);

/** Loads and returns the user using the authentication cookie. */
export function hoaUserApi(connection, app) {
  app.get('/api/hoauser', async (req, res) => {
    const {
      headers: { cookie },
    } = req;
    if (!cookie) {
      res.json(NULL_VALUE);
      return;
    }
    const authCookie = cookie
      .split(';')
      .map((c) => c.split('='))
      .find((p) => p && p.length === 2 && p[0] === AUTH_COOKIE);
    if (!authCookie) {
      res.json(NULL_VALUE);
      return;
    }
    const auth = authCookie[1];
    const credentials = auth.split('-');
    if (credentials.length != 2) {
      res.json(NULL_VALUE);
      return;
    }
    try {
      const hoaUser = await HoaUser.get(connection, credentials);
      res.json(hoaUser.getData());
    } catch (e) {
      if (e.message === 'Login error') {
        res.json(NULL_VALUE);
      } else {
        res.json({ error: e.message });
      }
    }
  });

  /** Clears up the authentication cookie. */
  app.get('/api/hoauser/logout', async (req, res) => {
    res.clearCookie(AUTH_COOKIE);
    res.json(true);
  });

  /** Signs up an existing user using name/password and sets the authentication cookie. */
  app.post('/api/hoauser/signin', async (req, res) => {
    const { name, password } = req.body;
    try {
      const credentials = HoaUser.loginCredentials(
        connection.crypto,
        name,
        password,
      );
      const hoaUser = await HoaUser.get(connection, credentials);
      const auth = credentials.join('-');
      res.cookie(AUTH_COOKIE, auth, { httpOnly: true });
      res.json(hoaUser.getData());
    } catch (e) {
      if (e.message === 'Login error') {
        res.json(NULL_VALUE);
      } else {
        res.json({ error: e.message });
      }
    }
  });

  /** Creates a new user and sets the authentication cookie. */
  app.post('/api/hoauser', async (req, res) => {
    const { name, fullName, email, password } = req.body;
    try {
      const hoaUser = await HoaUser.create(
        connection,
        name,
        fullName,
        email,
        password,
      );
      const credentials = HoaUser.loginCredentials(
        connection.crypto,
        name,
        password,
      );
      const auth = credentials.join('-');
      res.cookie(AUTH_COOKIE, auth, { httpOnly: true });
      res.json(hoaUser.getData());
    } catch (e) {
      res.json({ error: e.message });
    }
  });

  /** Checks if a user name is already used. */
  app.post('/api/hoauser/validate/name', async (req, res) => {
    const { name } = req.body;
    const result = await HoaUser.nameUsed(connection, name);
    res.json(!result);
  });

  /** Checks if an email is already used. */
  app.post('/api/hoauser/validate/email', async (req, res) => {
    const { email } = req.body;
    const result = await HoaUser.emailUsed(connection, email);
    res.json(!result);
  });
}
