# hoally

A webapp that allows members of home owner associations to discuss and vote on issues/proposals of their community.

## Basic ideas:

- There is a number of HOA communities that can use the webapp independently from each other.
- It is possible to search for communities and use one of them as "current".
- Each HOA community has several members that correspond to houses of the association
  Each member has
  - An address
  - A name or nickname
  - A authentication method (i.e. token or password)
  Only members of an association can see information about that HOA community.
- Each HOA community can have a number of issues.
  An issue has
  - Status: open, moderated, archived.
  - An initiator which must be a member of the HOA.
  - One or more from a list of predefined tags.
  - At least 1 (or more) root subject/comment. 
  - Each comment can have subcomments that can have other HOA members as initiators
  - Each comment can have text but also several images or attachments.
  - Root subjects/comments have yes/no vote counts.


## Detailed dev setup:

- Make sure that you have setup ssh key access to github.
  See: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account

- Create a directory for hoally development i.e.

  `mkdir ~/Projects/hoally-dev`

  `cd ~/Projects/hoally-dev`

- Request the "secrets" file
  It contains database passwords and other secret tokens that can't be added in git.

  `hoally-secrets.tar.gz`

  `tar xvfz hoally-secrets.tar.gz`

- NOTE: for simplicity will connect remotely to the development database.

- Clone the repository.

  `git clone git@github.com:ddimitrop/hoally.git`

- Make sure that you have a recent version of nodejs installed

- Install dependencies

  `cd hoally`

  `npm install`

- Start the backend server

  `npm run start-dev -- --secrets ~/Projects/hoally-dev/secrets`

- Open a second terminal to start the react dev server

  `cd ~/Projects/hoally-dev/hoallyapp`

  `npm start`

- In future restarts you just open 2 terminals and run in the first

    `cd ~/Projects/hoally-dev/hoally`

    `npm run start-dev -- --secrets ~/Projects/hoally-dev/secrets`

  and the other

    `cd ~/Projects/hoally-dev/hoally/app`

    `npm install`

    `npm start`

- Go to http://localhost:8081/

- You can use the screen command to make sure that the dev servers keep 
  running without the terminals open. In the first

    `screen -S server`

    `cd ~/Projects/hoally-dev/hoally`

    `npm run start-dev -- --secrets ~/Projects/hoally-dev/secrets`

  and the other

    `screen -S ui`

    `cd ~/Projects/hoally-dev/hoally`

    `npm run start-dev -- --secrets ~/Projects/hoally-dev/secrets`

  you can reconnect to the terminals later with

    `screen -r -S server`

    `screen -r -S ui`

  you can also "detach" screens with ctrl+Z+A and end screens with `exit`

- Develop on folder "hoally" both server and the ui will reload on change

- Structure of the code:
  - Server code is under hoally/src
  - React UI code is under hoally/app/src


## Workflow reminder

- First make a new branch with git and switch to it i,e,

    `git branch branch_name`

    `git checkout branch_name`

- Make your code changes.

- Once done use those commands to review them (or IDE related views)

  `git status`

  `git diff`

- Add them for commit and if all looks OK commit them in your local git
  repository. You can repeat this and the previous step multiple times
  if you want.

  `git add .`

  `git commit -m "<explain changes>"`

- Once all looks good push your branch to github

  `git push origin branch_name`

- Go to github and make a pull request. 

- If you need to make changes go back to your machine do them and then

  `git status`

  `git add`

- Once approved merge it in github. You can then delete the branch in github

- Now on your local machine refresh your main branch to get the changes

  `git checkout main`
  
  `git pull oriin main`

- You can now delete your local branch

  `git branch -d branch_name`

- An important command to remember which branch you are working on 
  (look where the arrow is):

  `git log --all --graph`  

- Now you can repeat those steps for your following change.