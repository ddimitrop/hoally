import { getUser } from './hoauser.mjs';
import {
  AppError,
  handleErrors,
  NO_ACCESS,
  NOT_OPEN,
} from '../../app/src/errors.mjs';
import multer from 'multer';

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
    const [topic] = await sql`
      delete from topic
      where
        id = ${id} and
        member_id in (
            select member_id from member 
            where hoauser_id = ${hoaUserId})

      returning *;            
    `;

    if (!topic) {
      throw new AppError(NO_ACCESS);
    }
  }

  async update(
    memberId,
    communityId,
    type,
    subject,
    description,
    propositions,
    tags,
    images,
  ) {
    const { sql, imageStore } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;
    const finalImages = await imageStore.moveToFinal('topic', id, images);

    const [topic] = await sql`
      update topic 
      set type = ${type},
      subject = ${subject},
      description = ${description},
      tags = ${tags},
      images = ${finalImages},
      last_update_timestamp = LOCALTIMESTAMP
      where
          id = ${id} and
          member_id in (
              select id from member
              where hoauser_id = ${hoaUserId}
              and community_id = ${communityId}
              and id = ${memberId})

      returning *;
      `;

    if (!topic) {
      throw new AppError(NO_ACCESS);
    }

    await sql`delete from vote_item where topic_id = ${id}`;

    for (const { description, images } of propositions) {
      const propImages = await imageStore.moveToFinal('topic', id, images);
      await sql`
          insert into vote_item (
            topic_id,
            description,
            images
          ) values (
            ${id},
            ${description},
            ${propImages}
          )
    
          returning *
          `;
    }
    const updatedInst = await Topic.get(this.connection, hoaUserId, id);
    this.data = updatedInst.data;
  }

  async archive() {
    const { sql } = this.connection;
    const id = this.getData().id;
    const hoaUserId = this.hoaUserId;

    const [topic] = await sql`
      update topic 
      set is_open = false,
          archive_timestamp = LOCALTIMESTAMP
      where id = ${id} and (
        member_id in (
            select member_id from member 
            where hoauser_id = ${hoaUserId}) or 
        community_id in (
            select c.id from community c 
            inner join member m on (c.id = m.community_id) 
            where m.hoauser_id = ${hoaUserId} 
            and m.is_board_member = true)
      )

      returning *`;
    if (!topic) {
      throw new AppError(NO_ACCESS);
    }
  }

  async vote(voteItemId, isYes) {
    const { sql } = this.connection;
    const hoaUserId = this.hoaUserId;
    const communityId = this.getData().community_id;

    const [{ numvotes }] = await sql`
      select count(1) as numvotes from member
      where community_id = ${communityId}
      and is_observer = false
      and hoauser_id = ${hoaUserId}
    `;

    if (numvotes === 0) {
      throw new AppError(NO_ACCESS);
    }

    await sql`
      delete from vote where vote_item_id = ${voteItemId} 
      and member_id in (
        select id from member
        where community_id = ${communityId}
        and is_observer = false
        and hoauser_id = ${hoaUserId})`;

    if (isYes == null) return numvotes;

    await sql`
      insert into vote (vote_item_id, member_id, is_yes)
        select ${voteItemId}, id, ${isYes} from member
        where community_id = ${communityId}
              and is_observer = false
              and hoauser_id = ${hoaUserId}`;

    return numvotes;
  }

  async comment(voteItemId, commentId, discussion, images) {
    const { sql, imageStore } = this.connection;

    const { id: topicId, community_id: communityId } = this.getData();
    const hoaUserId = this.hoaUserId;

    const finalImages = await imageStore.moveToFinal('topic', topicId, images);

    const [comment] = await sql`insert into comment(
                topic_id,
                vote_item_id,
                comment_id,
                discussion,
                images,
                member_id
              ) values (
                ${topicId},
                ${voteItemId},
                ${commentId},
                ${discussion},
                ${finalImages},
                (select min(id) 
                 from member
                 where community_id = ${communityId} and
                       hoauser_id = ${hoaUserId})
              )

              returning *`;
    if (!comment) {
      throw new AppError(NO_ACCESS);
    }

    return comment;
  }

  async removeComment(id) {
    const { sql } = this.connection;
    const { id: topicId, community_id: communityId } = this.getData();

    const [comment] = await sql`
      delete from comment
      where
        id = ${id} and
        topic_id = ${topicId}
        and member_id in (
          select id from member
          where community_id = ${communityId}
          and hoauser_id = ${this.hoaUserId})
          
      returning *`;

    if (!comment) {
      throw new AppError(NO_ACCESS);
    }
  }

  async changeComment(id, discussion, images) {
    const { sql, imageStore } = this.connection;
    const { id: topicId, community_id: communityId } = this.getData();

    const finalImages = await imageStore.moveToFinal('topic', topicId, images);

    const [comment] = await sql`
      update comment
      set discussion = ${discussion},
          images = ${finalImages},
          last_update_timestamp = LOCALTIMESTAMP
      where
        id = ${id} and
        topic_id = ${topicId}
        and member_id in (
          select id from member
          where community_id = ${communityId}
          and hoauser_id = ${this.hoaUserId})

      returning *
      `;

    if (!comment) {
      throw new AppError(NO_ACCESS);
    }

    return comment;
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
    images,
    hoaUserId,
  ) {
    const { sql, imageStore } = connection;

    const finalImages = imageStore.finalNames(images);

    const [{ id: topicId }] = await sql`
          insert into topic (
            community_id,
            member_id,
            type,
            subject,
            description,
            tags,
            images
          ) values (
            ${communityId},
            (select min(m.id) from member m
             where m.id=${memberId} and
                   m.community_id=${communityId} and
                   m.hoauser_id=${hoaUserId}),
            ${type},
            ${subject},
            ${description},
            ${tags},
            ${finalImages}
          )
    
          returning *
          `;

    if (!topicId) {
      throw new AppError(NO_ACCESS);
    }
    await imageStore.moveToFinal('topic', topicId, images);

    for (const { description, images } of propositions) {
      const propImages = await imageStore.moveToFinal('topic', topicId, images);
      await sql`
        insert into vote_item (
          topic_id,
          description,
          images
        ) values (
          ${topicId},
          ${description},
          ${propImages}
        )
  
        returning *
        `;
    }
    return topicId;
  }

  static async getList(
    connection,
    communityId,
    hoaUserId,
    isOpen = true,
    from = '100 years',
  ) {
    const { sql, crypto } = connection;
    const topics = await sql`
      select t.*, m.address, h.encrypted_name as name
      from topic t 
        left join member m on m.id = t.member_id
        left join hoauser h on m.hoauser_id = h.id
        where t.community_id = (
          select max(community_id) from member 
          where community_id = ${communityId} 
            and hoauser_id = ${hoaUserId})
        and is_open = ${isOpen}
        and (archive_timestamp is null or 
             archive_timestamp >= LOCALTIMESTAMP - cast(${from} AS INTERVAL))
        order by id asc`;

    topics.forEach((topic) => {
      topic.propositions = [];
      if (!topic.images) topic.images = [];
      topic.name = crypto.decrypt(topic.name);
    });
    const topicsById = topics.reduce((map, topic) => {
      map[topic.id] = topic;
      return map;
    }, {});

    const propositions = await sql`
        select v.* from vote_item v 
          join topic t on (v.topic_id = t.id) 
          where t.community_id = (
            select max(community_id) from member 
            where community_id = ${communityId} 
              and hoauser_id = ${hoaUserId})
          and t.is_open = ${isOpen}
          and (archive_timestamp is null or 
               archive_timestamp >= LOCALTIMESTAMP - cast(${from} AS INTERVAL))`;

    const propositionsById = {};
    propositions.forEach((proposition) => {
      proposition.votes_up = 0;
      proposition.votes_down = 0;
      proposition.vote = null;
      proposition.comments = [];
      if (!proposition.images) proposition.images = [];
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
              select max(community_id) from member 
              where community_id = ${communityId} 
                and hoauser_id = ${hoaUserId})
            and t.is_open = ${isOpen}
            and (archive_timestamp is null or 
                 archive_timestamp >= LOCALTIMESTAMP - cast(${from} AS INTERVAL))
        )
        group by vote_item_id`;

    votes.forEach((vote) => {
      Object.assign(propositionsById[vote.vote_item_id], vote);
    });

    const comments = await sql`
        select c.*, m.address, h.encrypted_name as name
        from comment c
        left join member m on m.id = c.member_id
        left join hoauser h on m.hoauser_id = h.id
        where c.topic_id in (
            select id from topic 
            where community_id=(
              select max(community_id) from member 
              where community_id = ${communityId} 
                and hoauser_id = ${hoaUserId})
            and is_open = ${isOpen}
            and (archive_timestamp is null or 
                 archive_timestamp >= LOCALTIMESTAMP - cast(${from} AS INTERVAL))
        )
        order by id asc`;

    const commentsById = {};
    comments.forEach((comment) => {
      comment.name = crypto.decrypt(comment.name);
      comment.comments = [];
      if (!comment.images) comment.images = [];
      commentsById[comment.id] = comment;
      let subComments;
      if (comment.vote_item_id) {
        const proposition = propositionsById[comment.vote_item_id];
        subComments = proposition?.comments;
      } else {
        const prevComment = commentsById[comment.comment_id];
        subComments = prevComment?.comments;
      }
      subComments?.push(comment);
    });

    return topics;
  }

  static async get(connection, hoaUserId, id) {
    const { sql, crypto } = connection;
    const [topic] = await sql`
    select t.*, m.address, h.encrypted_name as name
      from topic t 
        left join member m on m.id = t.member_id
        left join hoauser h on m.hoauser_id = h.id
        where t.id = ${id} and t.community_id in (
          select community_id from member 
          where hoauser_id = ${hoaUserId})`;

    if (!topic) {
      throw new AppError(NO_ACCESS);
    }

    const communityId = topic.community_id;
    topic.propositions = [];
    topic.name = crypto.decrypt(topic.name);
    if (!topic.images) topic.images = [];

    const propositions = await sql`
        select * from vote_item v 
        where v.topic_id = ${id}`;

    const propositionsById = {};
    propositions.forEach((proposition) => {
      topic.propositions.push(proposition);
      proposition.votes_up = 0;
      proposition.votes_down = 0;
      proposition.vote = null;
      proposition.comments = [];
      if (!proposition.images) proposition.images = [];
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

    const comments = await sql`
        select c.*, m.address, h.encrypted_name as name
        from comment c
        join member m on m.id = c.member_id
        left join hoauser h on m.hoauser_id = h.id
        where topic_id = ${id}
        order by id asc`;

    const commentsById = {};
    comments.forEach((comment) => {
      comment.name = crypto.decrypt(comment.name);
      comment.comments = [];
      if (!comment.images) comment.images = [];
      commentsById[comment.id] = comment;
      let subComments;
      if (comment.vote_item_id) {
        const proposition = propositionsById[comment.vote_item_id];
        subComments = proposition.comments;
      } else {
        const prevComment = commentsById[comment.comment_id];
        subComments = prevComment?.comments;
      }
      subComments?.push(comment);
    });

    return new Topic(connection, topic, hoaUserId);
  }
}

export function topicApi(connection, app) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, connection.imageStore.tempPath());
    },
    filename: function (req, file, cb) {
      const extension = (
        file.originalname.match(/\.[^.]*$/)?.[0] || ''
      ).toLowerCase();
      cb(null, 't_' + connection.crypto.uuid() + extension);
    },
  });
  const upload = multer({ storage });

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
        images,
        tags,
      } = req.body;
      const topicId = await Topic.create(
        connection,
        communityId,
        memberId,
        type,
        subject,
        description,
        propositions,
        tags,
        images,
        hoaUserId,
      );
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      const topic = topicInst.getData();
      res.json({ topic });
    }),
  );

  app.get(
    '/api/topic/:communityId',
    handleErrors(async (req, res) => {
      const { communityId } = req.params;
      const { isOpen, from } = req.query;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topics = await Topic.getList(
        connection,
        communityId,
        hoaUserId,
        isOpen,
        from,
      );
      res.json(topics);
    }),
  );

  app.get(
    '/api/topic/:communityId/:topicId',
    handleErrors(async (req, res) => {
      const { topicId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      const topic = topicInst.getData();
      res.json(topic);
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
        images,
      } = req.body;
      const topicInst = await Topic.get(connection, hoaUserId, id);

      if (!topicInst.getData().is_open) {
        throw new AppError(NOT_OPEN);
      }

      await topicInst.update(
        memberId,
        communityId,
        type,
        subject,
        description,
        propositions,
        tags,
        images,
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
      if (!topicInst.getData().is_open) {
        throw new AppError(NOT_OPEN);
      }
      const votes = await topicInst.vote(voteItemId, vote);
      res.json({ votes });
    }),
  );

  app.post(
    '/api/topic/:topicId/archive',
    handleErrors(async (req, res) => {
      const { topicId } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      await topicInst.archive();
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/comment/:topicId',
    handleErrors(async (req, res) => {
      const { topicId } = req.params;
      const {
        vote_item_id: voteItemId,
        comment_id: commentId,
        discussion,
        images,
      } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      if (!topicInst.getData().is_open) {
        throw new AppError(NOT_OPEN);
      }
      const comment = await topicInst.comment(
        voteItemId || null,
        commentId || null,
        discussion,
        images,
      );
      res.json({ comment });
    }),
  );

  app.put(
    '/api/comment/:topicId',
    handleErrors(async (req, res) => {
      const { topicId } = req.params;
      const { id, discussion, images } = req.body;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      if (!topicInst.getData().is_open) {
        throw new AppError(NOT_OPEN);
      }
      const comment = await topicInst.changeComment(id, discussion, images);
      res.json({ comment });
    }),
  );

  app.delete(
    '/api/comment/:topicId/:id',
    handleErrors(async (req, res) => {
      const { topicId, id } = req.params;
      const hoaUserInst = await getUser(connection, req);
      const hoaUserId = hoaUserInst.getData().id;
      const topicInst = await Topic.get(connection, hoaUserId, topicId);
      if (!topicInst.getData().is_open) {
        throw new AppError(NOT_OPEN);
      }
      await topicInst.removeComment(id);
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/upload/topic',
    upload.single('file'),
    handleErrors(async (req, res) => {
      const { imageStore } = connection;
      setTimeout(() => {
        imageStore.cleanUp(2);
      }, 0);
      const filename = req.file.filename;
      await imageStore.thumbnail(filename);
      await imageStore.smaller(filename);
      res.json({ filename });
    }),
  );

  app.post(
    '/api/upload/clear',
    handleErrors(async (req, res) => {
      const { imageStore } = connection;
      const { filename } = req.body;
      await imageStore.removeTemp(filename);
      res.json({ ok: true });
    }),
  );
}
