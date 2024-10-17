------ images ------
alter table topic drop column documents;
alter table vote_item drop column documents;
alter table comment drop column documents;
alter table topic alter column images type varchar(100)[8];
alter table vote_item alter column images type varchar(100)[8];
alter table comment alter column images type varchar(100)[8];
