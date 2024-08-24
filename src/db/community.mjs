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

  async updateIntro(intro, invitationText) {
    const { sql } = this.connection;
    const hoaUserId = this.hoaUserId;
    const id = this.getData().id;
    if (!intro) intro = DEFAULT_INTRO;
    if (!invitationText) invitationText = DEFAULT_INVITATION_TEXT;
    await sql`
      update community
      set intro = ${intro},
          invitation_text = ${invitationText}
       where
        id = ${id} and
        id in (select community_id 
               from member 
              where hoauser_id = ${hoaUserId} and
              is_admin = true)     
    `;
    this.data.intro = intro;
    this.data.invitation_text = invitationText;
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
        zipcode,
        intro,
        invitation_text
      ) values (
        ${name},
        ${address},
        ${city},
        ${state},
        ${zipcode}
        ${DEFAULT_INTRO}
        ${DEFAULT_INVITATION_TEXT}
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
        c.intro,
        c.invitation_text,
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

const DEFAULT_INTRO = `# Welcome to <community_name> community.

On this site, you can stay informed about announcements and proposals regarding ongoing issues. You can also share your opinions by voting, commenting, and posting your own announcements or proposals.

Please keep your posts and comments respectful to maintain a harmonious community atmosphere. Note that your nickname and address will be visible to your neighbors, and inappropriate language may be moderated. However, voting and liking are anonymous, allowing you to express your opinions without worrying about jeopardizing your friendships with your neighbors.`;

const DEFAULT_INVITATION_TEXT = `#### Dear <invitation_name> - owner of the property at <address>,

You are invited to join the <community_name> community on Hoally.  
On this site, you will be able to stay informed about announcements and proposals regarding ongoing community issues.  
You can also share your opinions by voting, commenting, and posting your own announcements or proposals.  
Please [follow the invitation link](<invitation_link>) to sign up and participate in our communitity.  
__EMAIL_ONLY_START
If you received this message by mistake, please [follow the unregistration link](<unregistration_link>) to stop receiving messages.
__EMAIL_ONLY_END

__POST_ONLY_START
---

**Invitation link**:  
![Invitation QR code](<invitation_qr>)  
[<invitation_link>](<invitation_link>)  

---	
__POST_ONLY_END

Best regards,  
<admin_name>,  
Your Hoally community admin.`;

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

  app.post(
    '/api/community/intro',
    handleErrors(async (req, res) => {
      const { id, intro, invitation_text: invitationText } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const communityInst = await Community.get(connection, hoaUserId, id);
      await communityInst.updateIntro(intro, invitationText);
      res.json({ ok: true });
    }),
  );
}
