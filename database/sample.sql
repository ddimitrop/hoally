\c hoadb
SET ROLE hoadb;
DELETE FROM comment;
DELETE FROM vote;
DELETE FROM  vote_item;
DELETE FROM  topic;
DELETE FROM  member;
DELETE FROM  hoauser;
DELETE FROM  community;

-- Sample data encryption was done with the secret: hoally-pwd
INSERT INTO community VALUES (
    DEFAULT, 
    'Bonita Bluffs', 
    '050 Avenida Encinas',  
    'Carlsbad',
    'CA',
    '92008',
    'cm-bonita-bluffs.png');

INSERT INTO community VALUES (
    DEFAULT, 
    'Vista Agua Dulce', 
    '596 Nantucket Dr',  
    'Chula Vista',
    'CA',
    '91911',
    'cm-vista-agua-dulce.png');

INSERT INTO community VALUES (
    DEFAULT, 
    'Vista Pacifica At Rancho San Clemente', 
    '717 Via Nublado',  
    'San Clemente',
    'CA',
    '92672',
    NULL);

----------------------------------------------

INSERT INTO hoauser VALUES(
    DEFAULT,
    'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==', -- rconstand
    'k0PXSbu6EakqnuYq|k3eOWfqQ1v+GaHncLcop70c=|ZDsZXmuVIVPBSrMftiJ7ZA==', -- Rodger Constandse
    'xPGl97Vc+6ItO+6i|9DAxTCk8lmm1diadtZhus9Q4z7I5|f3BCVEqI/iJPhmZbg4sItw==', -- rconstand@hotmail.com
    'c0174ebb5c5be09b36ff847735d7e9839ce32f0b10106377fdda3b2c69ca5888', -- test123
    false,
    'u-341438709478.epng'
);

INSERT INTO hoauser VALUES(
    DEFAULT,
    'EtIeIA1YGaN9JVQS|k0HACPx1Mi0=|Fi9pThoZFEht1aqnc+UiWg==', -- sorensen
    'GznO2vwMyCWwn/mV|VZAAWevwTi755itilO9BgQ==|hYAo19xxyIRPmjou04KPfA==', -- Richard Sorensen
    '/uIto+uS7GUGxbWj|wbk1epd0xTTpSSOC3MRXsqdC9Tw=|rNNs0Uua85bFJnf7IdMr9g==', -- sorensen76@gmail.com
    '16bc2a30fdddce89350a8857a69aee2152002b447b2ce84bb9621eeeab3e7eb9', -- xDFHGSS4#1_s
    false,
    'u-5782328982378.epng'
);

INSERT INTO hoauser VALUES(
    DEFAULT,
    'UGWkRZIimJhXjIYC|w23gNK2SiVeopjM=|vAeubLZI3mSBa0N7QckRZQ==', -- Leticia Lee
    'sMWco20t/mtbHpOy|NA3r01XOz5amRps=|S/I58iJd/8wDlNh2BXaxEA==', -- Leticia Lee
    'ZrNmdI625c8Wglob|Z/bhcBppaccfJGDerTQl|WHMD6jeXkTDgPgSb8pIs1A==', -- llee@imaxcp.com
    'fb6ec4b71fd459789fdb196e68ec34fc26a860da4bed52e89ec1ba4f8e547fef', -- 34587-123-34
    true,
    null
);

INSERT INTO hoauser VALUES(
    DEFAULT,
    '6I11f2W66zc4JrIv|mNu1GafWOF97|s2GMe9fMJNM+0tuWx97NOg==', -- hoamaster
    'sAsu8KZKdp+YQZIC|/WDQhfRg1we7/a7aOpmTMQ==|BjxIjmYyVY6OIH2kEQwn8A==', -- Hoally Masterson
    '8bMXI+tVrfT42nsc|nb3czYu07ns/1QDVoQ==|/Fa7pK2z1F9TB/KPEJlfVQ==', -- hoa@gmail.com
    'd678604195b2043e3ca8613813c51ea5b77efc671c8b4a09abb292fd572e53b8', -- hoally-pwd
    false,
    null
);

----------------------------------------------

INSERT INTO member VALUES (
    DEFAULT,
    (select id from hoauser where encrypted_name = 'UGWkRZIimJhXjIYC|w23gNK2SiVeopjM=|vAeubLZI3mSBa0N7QckRZQ=='),
    null,
    (select id from community where name = 'Bonita Bluffs'),
    '350 Avenida Encinas',
    false,
    false
);

INSERT INTO member VALUES (
    DEFAULT,
    (select id from hoauser where encrypted_name = 'EtIeIA1YGaN9JVQS|k0HACPx1Mi0=|Fi9pThoZFEht1aqnc+UiWg=='),
    null,
    (select id from community where name = 'Bonita Bluffs'),
    '360 Avenida Encinas',
    true,
    false
);

INSERT INTO member VALUES (
    DEFAULT,
    (select id from hoauser where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng=='),
    null,
    (select id from community where name = 'Bonita Bluffs'),
    '220 Avenida Encinas',
    false,
    true
);

-- An hoa user can be a member twice for 2 different addresses.
INSERT INTO member VALUES (
    DEFAULT,
    (select id from hoauser where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng=='),
    null,
    (select id from community where name = 'Bonita Bluffs'),
    '260 Avenida Encinas',
    false,
    true
);

INSERT INTO member VALUES (
    DEFAULT,
    null,
    'fb6ec4b71fd459789fdb196e68ec34fc26a860da4bed52e89ec1ba4f8e547fef',
    (select id from community where name = 'Bonita Bluffs'),
    '380 Avenida Encinas',
    false,
    false
);

INSERT INTO member VALUES (
    DEFAULT,
    null,
    'bc2d35acd14f1230b5cc5c77bc274952da500bf24ac68c3cf7c42858334e82ff',
    (select id from community where name = 'Bonita Bluffs'),
    '390 Avenida Encinas',
    false,
    false
);

-- An hoa user can be a member of multiple communities.
INSERT INTO member VALUES (
    DEFAULT,
    (select id from hoauser where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng=='),
    null,
    (select id from community where name = 'Vista Agua Dulce'),
    '620 Nantucket Dr',
    false,
    false
);

----------------------------------------------

INSERT INTO topic VALUES (
    DEFAULT,
    (select id from community where name = 'Bonita Bluffs'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    'New chairs in pool',
    'What about replacing the chairs in the pool. Our current ones are 10 years old',
    ARRAY[CAST('ideas' as tag_enum)],
    ARRAY['i-342342343678.png', 'i-983690232337.png'],
    ARRAY['d-3434356734323.pdf|price list.pdf'],
    true
);

INSERT INTO topic VALUES (
    DEFAULT,
    (select id from community where name = 'Bonita Bluffs'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    'Too much noise by gardeners',
    'Can we ask gardeners to start noise later in the day',
    ARRAY[CAST('complaints' as tag_enum), CAST('garden' as tag_enum)],
    null,
    null,
    false
);

INSERT INTO topic VALUES (
    DEFAULT,
    (select id from community where name = 'Bonita Bluffs'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
        where encrypted_name = 'UGWkRZIimJhXjIYC|w23gNK2SiVeopjM=|vAeubLZI3mSBa0N7QckRZQ==' limit 1),
    'New plants at the pull',
    '',
    ARRAY[CAST('garden' as tag_enum)],
    null,
    ARRAY['d-3434356734323.pdf|price list.pdf'],
    true
);

----------------------------------------------

INSERT INTO vote_item VALUES (
    DEFAULT,
    (select id from topic where subject = 'New chairs in pool'),
    'Nice set of white chairs from Target',
    ARRAY['i-7553433333.png'],
    null
);

INSERT INTO vote_item VALUES (
    DEFAULT,
    (select id from topic where subject = 'New chairs in pool'),
    'Similar set of wood chairs to the current ones for $75 each',
    ARRAY['i-9953454336.png'],
    null
);

INSERT INTO vote_item VALUES (
    DEFAULT,
    (select id from topic where subject = 'Too much noise by gardeners'),
    null,
    null,
    null
);

INSERT INTO vote_item VALUES (
    DEFAULT,
    (select id from topic where subject = 'New plants at the pull'),
    'They are called monogarvies and are not expensive',
    ARRAY['i-18209903232.png'],
    null
);

----------------------------------------------

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'Nice set of white chairs from Target'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    true
);

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'Nice set of white chairs from Target'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'UGWkRZIimJhXjIYC|w23gNK2SiVeopjM=|vAeubLZI3mSBa0N7QckRZQ==' limit 1),
    true
);

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'Nice set of white chairs from Target'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'EtIeIA1YGaN9JVQS|k0HACPx1Mi0=|Fi9pThoZFEht1aqnc+UiWg==' limit 1),
    false
);

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'Nice set of white chairs from Target'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    true
);

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'Similar set of wood chairs to the current ones for $75 each'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    false
);

insert into vote VALUES (
    DEFAULT,
    (select id from vote_item where description = 'They are called monogarvies and are not expensive'),
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    false
);

----------------------------------------------

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    null,
    'When were the current chair bought?',
    null,
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    null,
    'Some of them are just broken',
    ARRAY['i-9998232989.png'],
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    (select id from vote_item where description = 'Nice set of white chairs from Target'),
    null,
    'I think these are expensive',
    null,
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    (select id from comment where discussion = 'Some of them are just broken'),
    'How many are broken',
    null,
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'EtIeIA1YGaN9JVQS|k0HACPx1Mi0=|Fi9pThoZFEht1aqnc+UiWg==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    (select id from comment where discussion = 'Some of them are just broken'),
    'They also look ugly',
    null,
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'v+m89TitBh3qEydf|jfUPF1WNWM5q|u80MCuV4RUctluMixxc1ng==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    (select id from comment where discussion = 'How many are broken'),
    'Almost half of them',
    null,
    null
);

INSERT INTO comment VALUES (
    DEFAULT,
    (select m.id from member m join hoauser h on m.hoauser_id = h.id 
         where encrypted_name = 'EtIeIA1YGaN9JVQS|k0HACPx1Mi0=|Fi9pThoZFEht1aqnc+UiWg==' limit 1),
    (select id from topic where subject = 'New chairs in pool'),
    null,
    (select id from comment where discussion = 'How many are broken'),
    'I think most are horrible. These are the serials.',
    null,
    ARRAY['d-9998333922.pdf']
);
