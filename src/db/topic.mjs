import { handleErrors } from '../../app/src/errors.mjs';
import { getUser } from './hoauser.mjs';
import { Member } from './member.mjs';

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

  async archive() {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;

    await sql`
      update topic 
      set is_open = false
      where id = ${id} and (
        member_id in (
            select member_id from member 
            where hoauser_id = ${hoaUserId}) or 
        community_id in (
            select c.id from community c 
            inner join member m on (c.id = m.community_id) 
            where m.hoauser_id = ${hoaUserId} 
            and m.is_board_member = true)
      )`;
  }

  async vote(voteItemId, isYes) {
    const { sql } = this.connection;
    const member = await Member.forUser(
      this.connection,
      this.hoaUserId,
      this.getData().community_id,
    );

    const memberId = member.getData().id;

    await sql`
      delete from vote where vote_item_id = ${voteItemId} and member_id = ${memberId}`;

    if (isYes == null) return;

    await sql`
      insert into vote (vote_item_id, member_id, is_yes)
      values (${voteItemId}, ${memberId}, ${isYes})`;
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

    const propositionsById = {};
    propositions.forEach((proposition) => {
      proposition.votes_up = 0;
      proposition.votes_down = 0;
      proposition.vote = null;
      topicsById[proposition.topic_id].propositions.push(proposition);
      propositionsById[proposition.id] = proposition;
    });

    const votes = await sql`
        select 
          vote_item_id,
          sum(case when is_yes THEN 1 ELSE 0 END) as votes_up,
          sum(case when is_yes THEN 0 ELSE 1 END) as votes_down,
          any_value(
            case when member_id in
                (select id from member 
                 where community_id = ${communityId}
                 and hoauser_id = ${hoaUserId})  
              then is_yes else null end) as vote
        from vote where vote_item_id in (
          select v.id from vote_item v 
            join topic t on (v.topic_id = t.id) 
            where t.community_id = (
              select community_id from member 
              where community_id = ${communityId} 
                and hoauser_id = ${hoaUserId})
            and t.is_open = ${isOpen})
        group by vote_item_id`;

    votes.forEach((vote) => {
      Object.assign(propositionsById[vote.vote_item_id], vote);
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

    const communityId = topic.community_id;
    topic.propositions = [];

    const propositions = await sql`
        select * from vote_item v 
        where v.topic_id = ${id}`;

    const propositionsById = {};
    propositions.forEach((proposition) => {
      topic.propositions.push(proposition);
      proposition.votes_up = 0;
      proposition.votes_down = 0;
      proposition.vote = null;
      propositionsById[proposition.id] = proposition;
    });

    const votes = await sql`
        select 
          vote_item_id,
          sum(case when is_yes THEN 1 ELSE 0 END) as votes_up,
          sum(case when is_yes THEN 0 ELSE 1 END) as votes_down,
          any_value(
            case when member_id in
                (select id from member 
                 where community_id = ${communityId}
                 and hoauser_id = ${hoaUserId})  
              then is_yes else null end) as vote
        from vote where vote_item_id in (
          select v.id from vote_item v 
          where v.topic_id = ${id})
        group by vote_item_id`;

    votes.forEach((vote) => {
      Object.assign(propositionsById[vote.vote_item_id], vote);
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

  app.post(
    '/api/topic/:topicId/vote/:voteItemId',
    handleErrors(async (req, res) => {
      const { topicId, voteItemId } = req.params;
      const { vote } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      topicInst.vote(voteItemId, vote);
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/topic/:topicId/archive',
    handleErrors(async (req, res) => {
      const { topicId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      topicInst.archive();
      res.json({ ok: true });
    }),
  );
}
