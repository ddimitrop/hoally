\c postgres
SET ROLE postgres;
REVOKE ALL PRIVILEGES ON DATABASE hoadb FROM hoadb;
DROP ROLE IF EXISTS hoadb;
REVOKE ALL PRIVILEGES ON DATABASE hoadb FROM hoa;
DROP ROLE IF EXISTS hoa;
DROP DATABASE IF EXISTS hoadb;

CREATE DATABASE hoadb;
CREATE ROLE hoadb;
GRANT CREATE ON DATABASE hoadb TO hoadb;
-- Initial password will be changed by the app.
CREATE ROLE hoa LOGIN PASSWORD 'hoa';
GRANT CREATE ON DATABASE hoadb TO hoadb;
GRANT CONNECT ON DATABASE hoadb TO hoa;
\c hoadb
GRANT USAGE, CREATE ON SCHEMA public TO hoadb;
SET ROLE hoadb;

-- Supporting just a few states at the moment.
CREATE TYPE state_enum AS ENUM ('CA', 'AZ', 'NV');

-- An HOA community.
CREATE TABLE community (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY, 
    name VARCHAR(50) UNIQUE NOT NULL, 
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state state_enum NOT NULL,
    zipcode VARCHAR(5) NOT NULL 
        CONSTRAINT us_zip_code CHECK (regexp_like(zipcode, '^\d{5}$')),
    icon_file VARCHAR(100));

CREATE INDEX ON community(zipcode);

-- A user registered in hoally. Might be a member of one or more communities.
CREATE TABLE hoauser (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- Protecting personal information by encrypting.
    -- We also need the hashed values for querying.
    hashed_name VARCHAR(200) UNIQUE NOT NULL,
    encrypted_name VARCHAR(300) NOT NULL,
    encrypted_full_name VARCHAR(300),
    hashed_email VARCHAR(200) UNIQUE NOT NULL,
    encrypted_email VARCHAR(300) NOT NULL,
    email_validated boolean,
    -- Only storing hashed passwords or tokens
    hashed_password VARCHAR(200) NOT NULL,
    -- Temporary token (user forgot password).
    hashed_token VARCHAR(200) UNIQUE,
    token_creation_timestamp TIMESTAMP,
    encrypted_icon_file VARCHAR(100)
);

CREATE UNIQUE INDEX ON hoauser(hashed_name, hashed_password);

-- A member of an HOA community. It might be assigned to an hoa user or an orphan
-- waiting for a user to take it over with the use of a token.
CREATE TABLE member (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- When the user leaves the hoally app of moves out of the hourse,
    -- the membership should be orphan again.
    hoauser_id INTEGER REFERENCES hoauser(id) ON DELETE SET NULL,
    -- Used when there is no assigned hoauser_id for members that have not registered yet.
    hashed_token VARCHAR(200) UNIQUE,
    token_creation_timestamp TIMESTAMP,
    community_id INTEGER NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    address VARCHAR(200) NOT NULL,
    is_board_member BOOLEAN NOT NULL DEFAULT false,
    is_moderator BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX ON member(community_id, address);
CREATE UNIQUE INDEX ON member(hashed_token);

-- TODO: refine/decide on more tags
CREATE TYPE tag_enum AS ENUM ('complaints', 'ideas', 'garden');

-- A discussion topic of an HOA community. A topic can have multiple vote items.
CREATE TABLE topic (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    community_id INTEGER NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    -- when a member leaves the community the topics remain as orphan.
    member_id INTEGER REFERENCES member(id) ON DELETE SET NULL,
    subject varchar(500) NOT NULL,
    description text,
    tags tag_enum[10],
    images varchar(100)[5],
    documents varchar(100)[5],
    -- When topics are resolved, they are getting archived.
    is_open boolean
);

CREATE INDEX ON topic USING GIN (tags);

-- Voting items on a topic. There should be at least 1 for a topic but there
-- maybe multiple.
CREATE TABLE vote_item (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    topic_id INTEGER NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    description text,
    images varchar(100)[5],
    documents varchar(100)[5]
);

-- Votes of members on a vote_item
CREATE TABLE vote (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    vote_item_id INTEGER NOT NULL REFERENCES vote_item(id) ON DELETE CASCADE,
    -- We don't expect this to be null in reality (perhaps if a house gets demolished)?
    member_id INTEGER REFERENCES member(id) ON DELETE SET NULL,
    is_yes boolean not null
);

-- Comments on topics, vote_items or previous topics (i.e. discussion threads)
CREATE TABLE comment (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- when a member leaves the community the topics remain as orphan.
    member_id INTEGER REFERENCES member(id) ON DELETE SET NULL,
    -- the parent topic that this comment belongs to. Comments can be made on topic level.
    topic_id INTEGER NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    -- the vote item under the parent topic that this comment applies to.
    vote_item_id INTEGER REFERENCES vote_item(id) ON DELETE CASCADE,
    -- the parent comment that this comment is reply to.
    comment_id INTEGER REFERENCES comment(id) ON DELETE CASCADE,
    discussion text,
    images varchar(100)[5],
    documents varchar(100)[5],
    CONSTRAINT single_parent CHECK (
        -- both vote_item_id or comment_id can be null (in which case the comment applies to topic)
        -- but just one of them at most may be not null.
        vote_item_id IS NULL OR comment_id is NULL
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hoa;