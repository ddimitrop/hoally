import { handleErrors } from '../../app/src/errors.mjs';
import { authenticate } from './hoauser.mjs';

/**
 * A user of the Hoally site. It can be a member of 0 to MAX_USER_COMMUNITIES.
 */
export class Community {
  constructor(connection, data) {
    this.connection = connection;
    this.data = data;
  }

  getData() {
    return this.data;
  }

  static async create(
    connection,
    name,
    address,
    city,
    state,
    zipcode,
    adminAddress,
    hoaUser,
  ) {
    const { sql } = connection;

    const community = await sql.begin(async (sql) => {
      const [community] = await sql`
      insert into community (
        name,
        address,
        city,
        state,
        zipcode
      ) values (
        ${name},
        ${address},
        ${city},
        ${state},
        ${zipcode}  
      )

      returning *
      `;

      await sql`
      insert into member (
        hoauser_id,
        community_id,
        address,
        is_admin
      ) values (
        ${hoaUser.getData().id},
        ${community.id},
        ${hoaUserAddress},
        true
      )
      `;

      return community;
    });
    return new Community(connection, community);
  }
}

export function communityApi(connection, app) {
  /** Creates a new user and sets the authentication cookie. */
  app.post(
    '/api/hoauser',
    handleErrors(async (req, res) => {
      const hoaUserInst = await authenticate(req);
      const hoaUser = hoaUserInst.getData();
      const { name, address, city, state, zipcode, adminAddress } = req.body;
      const communityInst = await Community.create(
        connection,
        name,
        address,
        city,
        state,
        zipcode,
        adminAddress,
        hoaUser,
      );
      const community = communityInst.getData();
      res.json({ community });
    }),
  );
}
