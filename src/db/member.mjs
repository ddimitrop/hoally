import { handleErrors } from '../../app/src/errors.mjs';
import { getUser } from './hoauser.mjs';

export class Member {
  constructor(connection, data, hoaUserId) {
    this.connection = connection;
    this.data = Member.decrypt(connection.crypto, data);
    // The id of the user that works with the member.
    this.hoaUserId = hoaUserId;
  }

  static decrypt(crypto, data) {
    delete data.hashed_token;
    delete data.token_creation_timestamp;
    data.name = crypto.decrypt(data.encrypted_name);
    delete data.encrypted_name;
    data.invitation_full_name = crypto.decrypt(
      data.encrypted_invitation_full_name,
    );
    delete data.encrypted_invitation_full_name;
    data.invitation_email = crypto.decrypt(data.encrypted_invitation_email);
    delete data.encrypted_invitation_email;
    delete data.creation_timestamp;
    delete data.last_update_timestamp;

    return data;
  }

  getData() {
    return this.data;
  }

  async update(
    address,
    invitationFullName,
    invitationEmail,
    isAdmin,
    isBoardMember,
    isModerator,
  ) {
    const { sql, crypto } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    const [data] = await sql`
      update member
        set address = ${address},
        is_admin = ${isAdmin},
        is_board_member = ${isBoardMember},
        is_moderator = ${isModerator},
        encrypted_invitation_full_name = ${crypto.encrypt(invitationFullName)},
        encrypted_invitation_email = ${crypto.encrypt(invitationEmail)},
        last_update_timestamp = LOCALTIMESTAMP
      where
        id = ${id} and
        community_id in (select community_id 
               from member 
              where hoauser_id = ${hoaUserId} and
              is_admin = true)

      returning *
      `;
    this.data = Member.decrypt(crypto, data);
  }

  async remove() {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    await sql`
      delete from member
      where
        id = ${id} and
        community_id in (select community_id 
               from member 
              where hoauser_id = ${hoaUserId} and
              is_admin = true)`;
  }

  static async create(
    connection,
    communityId,
    address,
    invitationFullName,
    invitationEmail,
    isAdmin,
    isBoardMember,
    isModerator,
    hoaUserId,
  ) {
    const { sql, crypto } = connection;

    const [data] = await sql`
      insert into member (
        community_id,
        address,
        is_admin,
        is_board_member,
        is_moderator,
        encrypted_invitation_full_name,
        encrypted_invitation_email
      ) values (
        (select community_id from member 
         where community_id=${communityId} and 
               hoauser_id=${hoaUserId}),
        ${address},
        ${isAdmin},
        ${isBoardMember},
        ${isModerator},
        ${crypto.encrypt(invitationFullName)},
        ${crypto.encrypt(invitationEmail)}
      )

      returning *
      `;
    return new Member(connection, data, hoaUserId);
  }

  static async getList(connection, communityId, hoaUserId) {
    const { sql } = connection;

    const members = await sql`
      select       
        m.id,  
        m.address,
        m.encrypted_invitation_full_name,
        m.encrypted_invitation_email,
        m.is_admin,
        m.is_board_member,
        m.is_moderator,
        m.hoauser_id,
        h.encrypted_name
        from member m 
        left join hoauser h 
        on (h.id = m.hoauser_id) 
        where m.community_id = ${communityId}
        and m.community_id in (
          select community_id from member 
          where hoauser_id = ${hoaUserId})
        order by m.id`;
    return members.map((data) => Member.decrypt(connection.crypto, data));
  }

  static async get(connection, hoaUserId, id) {
    const { sql } = connection;

    const [member] = await sql`
      select       
        m.id,  
        m.address,
        m.is_admin,
        m.is_board_member,
        m.is_moderator,
        m.hoauser_id,
        h.encrypted_name
        from member m 
        left join hoauser h 
        on (h.id = m.hoauser_id) 
        where m.id = ${id}
        and m.community_id in (
          select community_id from member 
          where hoauser_id = ${hoaUserId})`;

    return new Member(connection, member, hoaUserId);
  }

  static async forUser(connection, hoaUserId, communityId) {
    const { sql } = connection;

    const [member] = await sql`
      select       
        m.id,  
        m.address,
        m.is_admin,
        m.is_board_member,
        m.is_moderator
        from member m 
        where m.community_id = ${communityId}
        and m.hoauser_id = ${hoaUserId}`;

    return new Member(connection, member, hoaUserId);
  }
}

export function memberApi(connection, app) {
  app.post(
    '/api/member',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const {
        community_id: communityId,
        address,
        invitation_full_name: invitationFullName,
        invitation_email: invitationEmail,
        is_admin: isAdmin,
        is_board_member: isBoardMember,
        is_moderator: isModerator,
      } = req.body;
      const memberInst = await Member.create(
        connection,
        communityId,
        address,
        invitationFullName,
        invitationEmail,
        isAdmin,
        isBoardMember,
        isModerator,
        hoaUserId,
      );
      const member = memberInst.getData();
      res.json({ member });
    }),
  );

  app.put(
    '/api/member',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const {
        id,
        address,
        invitation_full_name: invitationFullName,
        invitation_email: invitationEmail,
        is_admin: isAdmin,
        is_board_member: isBoardMember,
        is_moderator: isModerator,
      } = req.body;
      const memberInst = await Member.get(connection, hoaUserId, id);

      await memberInst.update(
        address,
        invitationFullName,
        invitationEmail,
        isAdmin,
        isBoardMember,
        isModerator,
      );
      const member = memberInst.getData();
      res.json({ member });
    }),
  );

  app.get(
    '/api/member/:communityId',
    handleErrors(async (req, res) => {
      const { communityId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const members = await Member.getList(connection, communityId, hoaUserId);
      res.json(members);
    }),
  );

  app.delete(
    '/api/member/:id',
    handleErrors(async (req, res) => {
      const { id } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const member = await Member.get(connection, hoaUserId, id);
      await member.remove();
      res.json({ ok: true });
    }),
  );

  app.get(
    '/api/member/user/:communityId',
    handleErrors(async (req, res) => {
      const { communityId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const member = await Member.forUser(connection, hoaUserId, communityId);
      res.json(member.getData());
    }),
  );
}
