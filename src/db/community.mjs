import { handleErrors } from '../../app/src/errors.mjs';
import { getUser } from './hoauser.mjs';

export class Community {
  constructor(connection, data, hoaUserId) {
    this.connection = connection;
    this.data = Community.clear(data);
    // The id of the user that operates on the community.
    this.hoaUserId = hoaUserId;
  }

  static clear(data) {
    delete data.creation_timestamp;
    delete data.last_update_timestamp;
    return data;
  }

  getData() {
    return this.data;
  }

  async update(name, address, city, state, zipcode, adminAddress) {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    const data = await sql.begin(async (sql) => {
      const [community] = await sql`
      update community
        set name = ${name},
        address = ${address},
        city = ${city},
        state = ${state},
        zipcode = ${zipcode},
        last_update_timestamp = LOCALTIMESTAMP
      where
        id = ${id} and
        id in (select community_id 
               from member 
              where hoauser_id = ${hoaUserId} and
              is_admin = true)

      returning *
      `;

      await sql`
      update member 
        set address = ${adminAddress}
      where
        community_id = ${id} and
        hoauser_id = ${hoaUserId} and
        is_admin = true

      returning *
      `;

      return { ...community, admin_address: adminAddress, is_admin: true };
    });
    this.data = data;
  }

  async remove() {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    await sql`
      delete from community
      where
        id = ${id} and
        id in (select community_id 
               from member 
              where hoauser_id = ${hoaUserId} and
              is_admin = true)`;
  }

  static async create(
    connection,
    name,
    address,
    city,
    state,
    zipcode,
    adminAddress,
    hoaUserId,
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
        ${hoaUserId},
        ${community.id},
        ${adminAddress},
        true
      )

      returning *
      `;

      return { ...community, admin_address: adminAddress, is_admin: true };
    });
    return new Community(connection, community, hoaUserId);
  }

  static async getList(connection, hoaUserId) {
    const { sql } = connection;

    const communities = await sql`
      select       
        c.id,  
        c.name,
        c.address,
        c.city,
        c.state,
        c.zipcode,
        m.address as admin_address,
        m.is_admin 
        from community c 
        inner join member m 
        on (c.id = m.community_id) 
        where m.hoauser_id = ${hoaUserId}
        order by c.id`;
    return communities;
  }

  static async get(connection, hoaUserId, id) {
    const { sql } = connection;

    const [community] = await sql`
      select       
        c.id,  
        c.name,
        c.address,
        c.city,
        c.state,
        c.zipcode,
        m.address as admin_address,
        m.is_admin 
        from community c 
        inner join member m 
        on (c.id = m.community_id) 
        where m.hoauser_id = ${hoaUserId}
          and c.id = ${id}`;

    return new Community(connection, community, hoaUserId);
  }
}

export function communityApi(connection, app) {
  /** Creates a new community. */
  app.post(
    '/api/community',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const {
        name,
        address,
        city,
        state,
        zipcode,
        admin_address: adminAddress,
      } = req.body;
      const communityInst = await Community.create(
        connection,
        name,
        address,
        city,
        state,
        zipcode,
        adminAddress,
        hoaUserId,
      );
      const community = communityInst.getData();
      res.json({ community });
    }),
  );

  app.put(
    '/api/community',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const {
        id,
        name,
        address,
        city,
        state,
        zipcode,
        admin_address: adminAddress,
      } = req.body;
      const communityInst = await Community.get(connection, hoaUserId, id);

      await communityInst.update(
        name,
        address,
        city,
        state,
        zipcode,
        adminAddress,
      );
      const community = communityInst.getData();
      res.json({ community });
    }),
  );

  app.get(
    '/api/community',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const communities = await Community.getList(connection, hoaUserId);
      res.json(communities);
    }),
  );

  app.get(
    '/api/community/:id',
    handleErrors(async (req, res) => {
      const { id } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const community = await Community.get(connection, hoaUserId, id);
      res.json(community.getData());
    }),
  );

  app.delete(
    '/api/community/:id',
    handleErrors(async (req, res) => {
      const { id } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const community = await Community.get(connection, hoaUserId, id);
      await community.remove();
      res.json({ ok: true });
    }),
  );
}
