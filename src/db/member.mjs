import {
  AppError,
  handleErrors,
  INVITATION_TOKEN_INVALID,
} from '../../app/src/errors.mjs';
import { getUser } from './hoauser.mjs';
import { Community } from './community.mjs';
import { toDataURL } from 'qrcode';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import domPurify from 'dompurify';

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
    isObserver,
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
        is_observer = ${isObserver},
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

  async generateInvitation() {
    const { sql, crypto } = this.connection;
    const id = this.getData().id;
    const token = crypto.uuid();
    const hashedToken = crypto.hash(token);

    await sql`
      update member
      set hashed_token = ${hashedToken},
          token_creation_timestamp = LOCALTIMESTAMP
      where id = ${id}`;

    return token;
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
    isObserver,
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
        is_observer,
        encrypted_invitation_full_name,
        encrypted_invitation_email
      ) values (
        (select min(community_id) from member 
         where community_id=${communityId} and 
               hoauser_id=${hoaUserId} and
              is_admin = true),
        ${address},
        ${isAdmin},
        ${isBoardMember},
        ${isModerator},
        ${isObserver},
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
        m.is_observer,
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
        m.encrypted_invitation_full_name,
        m.encrypted_invitation_email,
        m.is_admin,
        m.is_board_member,
        m.is_moderator,
        m.is_observer,
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
        min(m.id) as id,  
        max(m.address) as address,
        max(m.encrypted_invitation_full_name) as encrypted_invitation_full_name,
        max(m.encrypted_invitation_email) as encrypted_invitation_email,
        bool_or(m.is_admin) as is_admin,
        bool_or(m.is_board_member) as is_board_member,
        bool_or(m.is_moderator) as is_moderator,
        bool_and(m.is_observer) as is_observer,
        count(1) as num_properties
        from member m 
        where m.community_id = ${communityId}
        and m.hoauser_id = ${hoaUserId}`;

    return new Member(connection, member, hoaUserId);
  }

  static async forToken(connection, token, tokenExpiration = TOKEN_EXPIRATION) {
    const { sql, crypto } = connection;
    const hashedToken = crypto.hash(token);

    const data = await sql`
    select       
      m.address,
      c.name,
      c.id,
      m.encrypted_invitation_email
      from member m 
      left join community c
      on m.community_id = c.id
      where m.hashed_token = ${hashedToken}
      and now() - token_creation_timestamp < cast(${tokenExpiration} AS INTERVAL)`;

    if (data.length !== 1) {
      throw new AppError(INVITATION_TOKEN_INVALID);
    }

    const invitation = data[0];
    invitation.invitation_email = crypto.decrypt(
      invitation.encrypted_invitation_email,
    );
    delete invitation.encrypted_invitation_email;

    return invitation;
  }

  static async acceptToken(
    connection,
    token,
    hoaUserId,
    tokenExpiration = TOKEN_EXPIRATION,
  ) {
    const { sql, crypto } = connection;
    const hashedToken = crypto.hash(token);
    const data = await sql`
    update member
    set hoauser_id = ${hoaUserId},
        registration_timestamp = LOCALTIMESTAMP     
    where hashed_token = ${hashedToken}
    and now() - token_creation_timestamp < cast(${tokenExpiration} AS INTERVAL)

      returning *`;
    if (data.length !== 1) {
      throw new AppError(INVITATION_TOKEN_INVALID);
    }
    return data[0];
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
        is_observer: isObserver,
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
        isObserver,
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
        is_observer: isObserver,
      } = req.body;
      const memberInst = await Member.get(connection, hoaUserId, id);

      await memberInst.update(
        address,
        invitationFullName,
        invitationEmail,
        isAdmin,
        isBoardMember,
        isModerator,
        isObserver,
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

  app.post(
    '/api/member/invitation',
    handleErrors(async (req, res) => {
      const { communityId, ids, byEmail } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const { id: hoaUserId, name: adminName } = hoaUserInst.getData();
      const communityInst = await Community.get(
        connection,
        hoaUserId,
        communityId,
      );
      let { invitation_text: invitationText, name: communityName } =
        communityInst.getData();
      if (byEmail) {
        invitationText = invitationText.replaceAll(
          /__POST_ONLY_START[\s\S]*__POST_ONLY_END/g,
          '',
        );
        invitationText = invitationText.replaceAll(/__EMAIL_ONLY_START/g, '');
        invitationText = invitationText.replaceAll(/__EMAIL_ONLY_END/g, '');
      } else {
        invitationText = invitationText.replaceAll(
          /__EMAIL_ONLY_START[\s\S]*__EMAIL_ONLY_END/g,
          '',
        );
        invitationText = invitationText.replaceAll(/__POST_ONLY_START/g, '');
        invitationText = invitationText.replaceAll(/__POST_ONLY_END/g, '');
      }
      const invitationData = [];
      const invitations = [];
      for (const id of ids) {
        const member = await Member.get(connection, hoaUserId, id);
        const invitationToken = await member.generateInvitation();
        const invitationUrl = `${req.headers.origin}/invitation/${invitationToken}`;
        const unregistrationUrl = `${req.headers.origin}/unregister/${invitationToken}`;
        const invitationQr = await toDataURL(invitationUrl);
        const unregistrationQr = await toDataURL(unregistrationUrl);

        const {
          invitation_full_name: invitationFullName,
          invitation_email: invitationEmail,
          address,
        } = member.getData();

        const invitation = invitationText
          .replace('<invitation_name>', invitationFullName || 'neighbor')
          .replace('<community_name>', communityName)
          .replace('<address>', address)
          .replaceAll('<invitation_link>', invitationUrl)
          .replaceAll('<unregistration_link>', unregistrationUrl)
          .replaceAll('<invitation_qr>', invitationQr)
          .replaceAll('<unregistration_qr>', unregistrationQr)
          .replace('<admin_name>', adminName);

        invitationData.push({ invitation, invitationEmail });
        invitations.push(invitation);
      }
      if (byEmail) {
        const { sendMail } = connection;
        const window = new JSDOM('').window;
        const purify = domPurify(window);

        const sendNextInvitation = () => {
          const { invitation, invitationEmail } = invitationData.shift();
          const markedHtml = marked.parse(invitation);
          const html = purify.sanitize(markedHtml);
          sendMail(
            invitationEmail,
            `You are invited to join Hoally for ${communityName}`,
            html,
          );
        };
        const processInvitations = () => {
          if (invitationData.length) {
            sendNextInvitation();
            setTimeout(processInvitations, 500);
          }
        };
        processInvitations();
      }
      res.json({ invitations });
    }),
  );

  app.post(
    '/api/member/token',
    handleErrors(async (req, res) => {
      const { token } = req.body;
      const invitation = await Member.forToken(connection, token);
      res.json({ invitation });
    }),
  );

  app.post(
    '/api/member/accept',
    handleErrors(async (req, res) => {
      const { token, validateEmail } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const { community_id: communityId } = await Member.acceptToken(
        connection,
        token,
        hoaUserId,
      );
      await hoaUserInst.setDefaultCommunity(communityId);
      if (validateEmail) {
        await hoaUserInst.validateEmail();
      }
      res.json({ ok: true });
    }),
  );
}

/**
 * The token expiration for invitations interval (6 months from creation).
 */
const TOKEN_EXPIRATION = '6 mons';
