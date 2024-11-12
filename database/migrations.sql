------ images ------
alter table topic drop column documents;
alter table vote_item drop column documents;
alter table comment drop column documents;
alter table topic alter column images type varchar(100)[8];
alter table vote_item alter column images type varchar(100)[8];
alter table comment alter column images type varchar(100)[8];
alter table hoauser drop column hashed_name;
------ simplify invitations ------
alter table member add column encrypted_token VARCHAR(200) UNIQUE;
CREATE TYPE frequency_enum AS ENUM ('never', 'daily', 'weekly', 'monthly');
alter table hoauser add column email_frequency frequency_enum DEFAULT 'weekly';
alter table hoauser add column last_email_timestamp TIMESTAMP WITH TIME ZONE;
