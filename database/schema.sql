\c postgres
SET ROLE postgres;
DROP DATABASE IF EXISTS hoadb;
DROP ROLE IF EXISTS hoadb;
DROP ROLE IF EXISTS hoa;

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
CREATE TYPE state_enum AS ENUM ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI',
  'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
  'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
  'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY');

-- An HOA community.
CREATE TABLE community (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY, 
    name VARCHAR(50) NOT NULL, 
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state state_enum NOT NULL,
    zipcode VARCHAR(5) NOT NULL 
        CONSTRAINT us_zip_code CHECK (regexp_like(zipcode, '^\d{5}$')),
    intro TEXT NOT NULL DEFAULT '',
    invitation_text TEXT NOT NULL DEFAULT '',
    icon_file VARCHAR(100),
    creation_timestamp TIMESTAMP WITH TIME ZONE  DEFAULT LOCALTIMESTAMP,
    last_update_timestamp TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ON community(zipcode);

-- A user registered in hoally. Might be a member of one or more communities.
CREATE TABLE hoauser (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- Protecting personal information by encrypting.
    -- We also need the hashed values for querying.
    encrypted_name VARCHAR(300) NOT NULL,
    encrypted_full_name VARCHAR(300),
    hashed_email VARCHAR(200) UNIQUE NOT NULL,
    encrypted_email VARCHAR(300) NOT NULL,
    email_validated boolean,
    -- Only storing hashed passwords or tokens
    hashed_password VARCHAR(200) NOT NULL,
    -- Temporary token (user forgot password).
    hashed_token VARCHAR(200) UNIQUE,
    token_creation_timestamp TIMESTAMP WITH TIME ZONE,
    encrypted_icon_file VARCHAR(100),
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT LOCALTIMESTAMP,
    last_update_timestamp TIMESTAMP WITH TIME ZONE,
    email_validation_timestap TIMESTAMP WITH TIME ZONE,
    last_access_date DATE,
    default_community INTEGER REFERENCES community(id) ON DELETE SET NULL
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
    token_creation_timestamp TIMESTAMP WITH TIME ZONE,
    community_id INTEGER NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    address VARCHAR(200) NOT NULL,
    -- The following 2 matter only if hoauser_id is null
    encrypted_invitation_full_name VARCHAR(300),
    encrypted_invitation_email VARCHAR(300),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_board_member BOOLEAN NOT NULL DEFAULT false,
    is_moderator BOOLEAN NOT NULL DEFAULT false,
    is_observer BOOLEAN NOT NULL DEFAULT false,
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT LOCALTIMESTAMP,
    last_update_timestamp TIMESTAMP WITH TIME ZONE,
    registration_timestamp TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX ON member(community_id, address);
CREATE UNIQUE INDEX ON member(hashed_token);

-- TODO: refine/decide on more tags
CREATE TYPE tag_enum AS ENUM ('complaints', 'ideas', 'garden', 'maintenance', 'fees', 'fines', 'pool', 'trees', 'parking');

CREATE TYPE topic_type_enum AS ENUM ('proposition', 'announcement');

-- A discussion topic of an HOA community. A topic must have at least one or multiple vote items.
CREATE TABLE topic (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    community_id INTEGER NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    -- when a member leaves the community the topics remain as orphan.
    member_id INTEGER REFERENCES member(id) ON DELETE SET NULL,
    -- Announcements have a single implicit vote item and can only be "liked"
    -- (all their votes are is_yes = true)
    type topic_type_enum NOT NULL,
    subject varchar(500) NOT NULL,
    description text,
    tags tag_enum[10],
    images varchar(100)[8],
    -- When topics are resolved, they are getting archived.
    is_open boolean NOT NULL DEFAULT true,
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT LOCALTIMESTAMP,
    last_update_timestamp TIMESTAMP WITH TIME ZONE,
    archive_timestamp TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ON topic USING GIN (tags);

-- Voting items on a topic. There should be at least 1 for a topic but there
-- maybe multiple.
CREATE TABLE vote_item (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    topic_id INTEGER NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
    description text,
    images varchar(100)[8]
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
    images varchar(100)[8],
    creation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT LOCALTIMESTAMP,
    last_update_timestamp TIMESTAMP WITH TIME ZONE,
    CONSTRAINT single_parent CHECK (
        -- exactly one of them must be null and the other not null.
        (vote_item_id IS NULL AND comment_id IS NOT NULL) OR
        (vote_item_id IS NOT NULL AND comment_id IS NULL)
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hoa;