import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import { Global } from './Global.js';
import { useState, useContext, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { postData } from './json-utils.js';
import { useNavigate } from 'react-router-dom';

const InvitationsDialog = ({ control, community, members }) => {
  const global = useContext(Global);
  const purify = DOMPurify(window);
  const navigate = useNavigate();
  const [invitationsSent, setInvitationsSent] = useState(false);

  const [membersSelected, setMembersSelected] = useState(true);
  const hasEmails = members.some((member) => member.invitation_email);
  const [byEmail, setByEmail] = useState(hasEmails);
  const defaultSelected = (useEmail) =>
    members.map((member) => !useEmail || !!member.invitation_email);
  const [selected, setSelected] = useState(defaultSelected(hasEmails));

  const isSelected = (i) => (selected[i] !== undefined ? selected[i] : true);

  const switchByEmail = (byEmail) => {
    setByEmail(byEmail);
    setSelected(defaultSelected(byEmail));
  };

  const changeSelected = (i, isSelected) => {
    selected[i] = isSelected;
    setSelected([...selected]);
    setMembersSelected(selected.some((s) => s));
  };

  const clearUp = () => {
    setSelected(defaultSelected(hasEmails));
    setMembersSelected(true);
    control.close();
  };

  const closeInvitationsSent = () => {
    setInvitationsSent(false);
    setByEmail(hasEmails);
  };

  const close = () => {
    setByEmail(hasEmails);
    clearUp();
  };

  const sendInvitations = () => {
    const selectedMembers = members.filter((member, i) => selected[i]);
    const ids = selectedMembers.map((member) => member.id);
    const communityId = community.id;
    postData('/api/member/invitation', { communityId, ids, byEmail })
      .then(({ invitations }) => {
        if (!byEmail) {
          const printWindow = window.open('', 'PRINT');
          const doc = printWindow.document;
          doc.write(
            `<html>
           <head>
             <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap"
                   rel="stylesheet"/>
             <style>
               body {font-family: Quicksand, sans-serif; 
                     font-size: 16px; line-height: 1.4em;}
               .address {display:inline-block;
                         border: solid 1px gray; padding: 16px; margin: 8px;}
               .page {border-bottom: dotted 1px gray; padding: 16px;}
               @media print {.page { page-break-before: always; border-bottom: none }}
               @media print {.noprint { display: none }}
             </style>
           </head>
           <body></body>
         </html>`,
          );
          createRoot(doc.body).render(
            <Fragment>
              <div className="page">
                <div className="noprint">
                  <button
                    onClick={() => printWindow.print()}
                    style={{ float: 'right', padding: '8px 16px' }}
                  >
                    PRINT
                  </button>
                </div>
                {selectedMembers.map((member, i) => (
                  <div key={i} className="address">
                    <b>{member.invitation_full_name || 'Owner of Property'}</b>
                    <br />
                    {member.address}
                    <br />
                    {community.city}, {community.state} {community.zipcode}
                  </div>
                ))}
              </div>
              {invitations.map((invitation, i) => {
                const markedHtml = marked.parse(invitation);
                const html = purify.sanitize(markedHtml);
                return (
                  <div
                    className="page"
                    key={i}
                    dangerouslySetInnerHTML={{ __html: html }}
                  ></div>
                );
              })}
            </Fragment>,
          );
        }
        setInvitationsSent(true);
        clearUp();
      })
      .catch((error) => {
        global.setAppError(error.message);
      });
  };

  return (
    <Fragment>
      <Dialog
        open={control.isOpen()}
        onClose={close}
        scroll="body"
        fullWidth={true}
        maxWidth="sm"
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            sendInvitations();
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>Send invitations</Box>
          <FormControlLabel
            control={
              <Switch
                disabled={!hasEmails}
                checked={byEmail}
                onChange={(event) => switchByEmail(event.target.checked)}
              />
            }
            label="By email"
          />
        </DialogTitle>
        <DialogContent>
          {members.map((member, i) => (
            <FormControlLabel
              key={member.id}
              control={
                <Checkbox
                  checked={isSelected(i)}
                  onChange={(event) => changeSelected(i, event.target.checked)}
                  disabled={byEmail && !member.invitation_email}
                />
              }
              label={
                byEmail && member.invitation_email
                  ? `${member.invitation_email} (${member.address})`
                  : member.address
              }
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button variant="outlined" type="submit" disabled={!membersSelected}>
            {byEmail ? 'Send emails' : 'Print invitations'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={invitationsSent} onClose={closeInvitationsSent}>
        <Alert onClose={closeInvitationsSent} severity="success">
          {byEmail
            ? 'Invitations were emailed successfully!'
            : 'Invitations ready to print in another window'}
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default InvitationsDialog;
