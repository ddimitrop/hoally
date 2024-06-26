import { Crypto } from '../../src/utils/crypto.mjs';
import postgres from 'postgres';
import { HoaUser } from '../../src/db/hoauser.mjs';

describe('hoauser', () => {
  const USER_NAME = 'potato';
  const USER_FULL_NAME = 'Potato Wedge';
  const USER_EMAIL = 'pwedge@email.com';
  const USER_PWD = 'potato-pwd';

  const USER_NAME_2 = 'tomato';
  const USER_FULL_NAME_2 = 'Totato Wedge';
  const USER_EMAIL_2 = 'twedge@email.com';
  const USER_PWD_2 = 'potato-pwd2';

  let connection;

  beforeAll(() => {
    const crypto = new Crypto('hoally-pwd');
    const sql = postgres({
      database: 'hoadb',
      username: 'hoa',
      password: 'hoa',
    });
    connection = { crypto, sql };
  });

  afterAll(() => {
    connection.sql.end();
  });

  beforeEach(async () => {
    await clean();
  });

  async function clean() {
    return connection.sql`delete from hoauser`;
  }

  async function createTestUser(
    name = USER_NAME,
    fullName = USER_FULL_NAME,
    email = USER_EMAIL,
    password = USER_PWD,
  ) {
    return HoaUser.create(connection, name, fullName, email, password);
  }

  it('logs a new hoauser', async () => {
    const hoauser = await createTestUser();

    expect(hoauser.getData()).toEqual({
      id: jasmine.any(Number),
      email_validated: false,
      encrypted_icon_file: null,
      name: USER_NAME,
      full_name: USER_FULL_NAME,
      email: USER_EMAIL,
    });

    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD,
    );
    const loggedInUser = await HoaUser.get(connection, credentials);
    expect(loggedInUser.getData()).toEqual(hoauser.getData());
  });

  it('does not log with wrong credentials', async () => {
    await createTestUser();
    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD_2,
    );
    await expectAsync(
      HoaUser.get(connection, credentials),
    ).toBeRejectedWithError('Login error');
  });

  it('cannot create a second user with the same name', async () => {
    await createTestUser();
    await expectAsync(
      createTestUser(USER_NAME, USER_FULL_NAME_2, USER_EMAIL_2, USER_PWD_2),
    ).toBeRejected();
  });

  it('cannot create a second user with the same email', async () => {
    await createTestUser();
    await expectAsync(
      createTestUser(USER_NAME_2, USER_FULL_NAME_2, USER_EMAIL, USER_PWD_2),
    ).toBeRejected();
  });

  it('can tell if a name is used', async () => {
    await createTestUser();
    expect(await HoaUser.nameUsed(connection, USER_NAME)).toBe(true);
    expect(await HoaUser.nameUsed(connection, USER_NAME_2)).not.toBe(true);
  });

  it('can tell if an email is used', async () => {
    await createTestUser();
    expect(await HoaUser.emailUsed(connection, USER_EMAIL)).toBe(true);
    expect(await HoaUser.emailUsed(connection, USER_EMAIL_2)).not.toBe(true);
  });

  it('can login with a token when user forgets the password', async () => {
    const hoauser = await createTestUser();
    const token = await HoaUser.forgotPassword(connection, USER_EMAIL);
    expect(token).not.toBe(null);
    const tokenUser = await HoaUser.getWithToken(connection, token);
    expect(tokenUser.getData()).toEqual(hoauser.getData());
  });

  it('cannot login with a token when it has expired', async () => {
    await createTestUser();
    const token = await HoaUser.forgotPassword(connection, USER_EMAIL);
    await expectAsync(
      HoaUser.getWithToken(
        connection,
        token,
        '-10:00:00' /* simiulate expiration */,
      ),
    ).toBeRejectedWithError('Access token invalid');
  });

  it('cannot login for non existing email', async () => {
    await createTestUser();
    await expectAsync(
      HoaUser.forgotPassword(connection, USER_EMAIL_2),
    ).toBeRejectedWithError('Not used email');
  });

  it('can unregister the user', async () => {
    const hoauser = await createTestUser();
    await hoauser.unregister();

    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD,
    );
    await expectAsync(
      HoaUser.get(connection, credentials),
    ).toBeRejectedWithError('Login error');
  });

  it('can update the password', async () => {
    const hoauser = await createTestUser();

    await hoauser.updatePassword(USER_PWD_2);

    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD_2,
    );
    const loggedInUser = await HoaUser.get(connection, credentials);
    expect(loggedInUser.getData()).toEqual(hoauser.getData());
  });

  it('can update the full name', async () => {
    const hoauser = await createTestUser();

    await hoauser.updateFullName(USER_FULL_NAME_2);
    expect(hoauser.getData().full_name).toBe(USER_FULL_NAME_2);

    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD,
    );
    const loggedInUser = await HoaUser.get(connection, credentials);
    expect(loggedInUser.getData()).toEqual(hoauser.getData());
  });

  it('can validate the email', async () => {
    const hoauser = await createTestUser();

    expect(hoauser.getData().email_validated).toBe(false);

    const token = await HoaUser.getToken(connection, USER_EMAIL);
    const tokenUser = await HoaUser.getWithToken(connection, token);

    await tokenUser.validateEmail();
    expect(tokenUser.getData().email_validated).toBe(true);

    const credentials = HoaUser.loginCredentials(
      connection.crypto,
      USER_NAME,
      USER_PWD,
    );
    const loggedInUser = await HoaUser.get(connection, credentials);
    expect(loggedInUser.getData().email_validated).toBe(true);
  });

  it('can update the email', async () => {
    const hoauser = await createTestUser();
    await hoauser.validateEmail();

    await hoauser.updateEmail(USER_EMAIL_2);

    const token = await HoaUser.getToken(connection, USER_EMAIL_2);
    const tokenUser = await HoaUser.getWithToken(connection, token);

    expect(tokenUser.getData().email_validated).toBe(false);
    expect(tokenUser.getData().email).toBe(USER_EMAIL_2);
  });

  it('cannot update the email if already used', async () => {
    const hoauser = await createTestUser();
    await createTestUser(
      USER_NAME_2,
      USER_FULL_NAME_2,
      USER_EMAIL_2,
      USER_PWD_2,
    );

    await expectAsync(hoauser.updateEmail(USER_EMAIL_2)).toBeRejectedWithError(
      'Email used',
    );
  });
});
