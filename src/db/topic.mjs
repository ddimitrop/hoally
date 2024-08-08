import { handleErrors } from '../../app/src/errors.mjs';
import { getUser } from './hoauser.mjs';

export class Topic {
  constructor(connection, data, hoaUserId) {
    this.connection = connection;
    this.data = data;
    // The id of the user that works with the member.
    this.hoaUserId = hoaUserId;
  }

  getData() {
    return this.data;
  }

  async remove() {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    await sql`
      delete from topic
      where
        id = ${id} and
        member_id in (
            select member_id from member 
            where hoauser_id = ${hoaUserId})`;
  }

  async update(
    memberId,
    communityId,
    type,
    subject,
    description,
    propositions,
    tags,
  ) {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    const [topic] = await sql`
      update topic 
      set type = ${type},
      subject = ${subject},
      description = ${description},
      tags = ${tags}
      where
          id = ${id} and
          member_id in (
              select id from member
              where hoauser_id = ${hoaUserId}
              and community_id = ${communityId}
              and id = ${memberId})

      returning *;
      `;

    await sql`delete from vote_item where topic_id = ${id}`;

    topic.propositions = [];
    for (const { description } of propositions) {
      const [proposition] = await sql`
          insert into vote_item (
            topic_id,
            description
          ) values (
            ${id},
            ${description}
          )
    
          returning *
          `;

      topic.propositions.push(proposition);
    }
    this.data = topic;
  }

  static async create(
    connection,
    communityId,
    memberId,
    type,
    subject,
    description,
    propositions,
    tags,
    hoaUserId,
  ) {
    const { sql } = connection;

    const [topic] = await sql`
          insert into topic (
            community_id,
            member_id,
            type,
            subject,
            description,
            tags 
          ) values (
            ${communityId},
            (select m.id from member m
             where m.id=${memberId} and
                   m.community_id=${communityId} and
                   m.hoauser_id=${hoaUserId}),
            ${type},
            ${subject},
            ${description},
            ${tags}
          )
    
          returning *
          `;
    const { id: topicId } = topic;
    topic.propositions = [];
    for (const { description } of propositions) {
      const [proposition] = await sql`
        insert into vote_item (
          topic_id,
          description
        ) values (
          ${topicId},
          ${description}
        )
  
        returning *
        `;

      topic.propositions.push(proposition);
    }
    return new Topic(connection, topic, hoaUserId);
  }

  static async getList(connection, communityId, hoaUserId, isOpen = true) {
    const { sql } = connection;
    const topics = await sql`
      select * from topic 
        where community_id = (
          select community_id from member 
          where community_id = ${communityId} 
            and hoauser_id = ${hoaUserId})
        and is_open = ${isOpen}`;

    topics.forEach((topic) => (topic.propositions = []));
    const topicsById = topics.reduce((map, topic) => {
      map[topic.id] = topic;
      return map;
    }, {});

    const propositions = await sql`
        select v.* from vote_item v 
          join topic t on (v.topic_id = t.id) 
          where t.community_id = (
            select community_id from member 
            where community_id = ${communityId} 
              and hoauser_id = ${hoaUserId})
          and t.is_open = ${isOpen}`;

    propositions.forEach((proposition) => {
      topicsById[proposition.topic_id].propositions.push(proposition);
    });

    return topics;
  }

  static async get(connection, hoaUserId, id) {
    const { sql } = connection;
    const [topic] = await sql`
      select * from topic 
        where id = ${id} and member_id in (
          select id from member 
          where hoauser_id = ${hoaUserId})`;

    topic.propositions = [];

    const propositions = await sql`
        select * from vote_item v 
        where v.topic_id = ${id}`;

    propositions.forEach((proposition) => {
      topic.propositions.push(proposition);
    });

    return new Topic(connection, topic, hoaUserId);
  }
}

export function topicApi(connection, app) {
  app.post(
    '/api/topic/:communityId',
    handleErrors(async (req, res) => {
      const { communityId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const {
        member_id: memberId,
        type,
        subject,
        description,
        propositions,
        tags,
      } = req.body;
      const topicInst = await Topic.create(
        connection,
        communityId,
        memberId,
        type,
        subject,
        description,
        propositions,
        tags,
        hoaUserId,
      );
      const topic = topicInst.getData();
      res.json({ topic });
    }),
  );

  app.get(
    '/api/topic/:communityId',
    handleErrors(async (req, res) => {
      const { communityId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topics = await Topic.getList(connection, communityId, hoaUserId);
      res.json(topics);
    }),
  );

  app.put(
    '/api/topic/:communityId',
    handleErrors(async (req, res) => {
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const { communityId } = req.params;
      const {
        id,
        member_id: memberId,
        type,
        subject,
        description,
        propositions,
        tags,
      } = req.body;
      const topicInst = await Topic.get(connection, hoaUserId, id);

      await topicInst.update(
        memberId,
        communityId,
        type,
        subject,
        description,
        propositions,
        tags,
      );
      const topic = topicInst.getData();
      res.json({ topic });
    }),
  );

  app.delete(
    '/api/topic/:id',
    handleErrors(async (req, res) => {
      const { id } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, id);
      await topicInst.remove();
      res.json({ ok: true });
    }),
  );
}
