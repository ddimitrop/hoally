import './MarketingContent.css';

const MarketingContent = () => {
  return (
    <div>
      <div className="main-banner">
        <div className="main-banner-text">
          Connect the<span className="main-banner-highlight">community</span>
        </div>
      </div>
      <div className="marketing-text">
        <p>
          Good neighbors promote a supportive, positive, and cohesive community
          where residents feel valued and connected, and Homeowners Associations
          (HOAs) play a significant role by providing structure, amenities, and
          a framework for communal living.
        </p>
        <p>
          Open and effective communication is crucial for an HOA to maintain a
          cohesive community. It supports decision-making, enhances transparency
          and trust, facilitates conflict resolution, encourages ideas and
          volunteering, and allows for valuable feedback.
        </p>
        <p>
          HOAlly is a specialized social forum and networking tool tailored for
          HOA communities. It simplifies resident registration and facilitates
          efficient asynchronous communication and decision-making in a
          straightforward manner.
        </p>
      </div>
      <div className="marketing-graphics">
        <div className="user-graphic">
          <span>Register </span>
        </div>
        <div className="idea-graphic">
          <span>Propose</span>
        </div>
        <div className="vote-graphic">
          <span>Vote</span>
        </div>
      </div>
      <div className="marketing-text">
        <h1>How it works</h1>
        <p>
          HOAlly is typically set up by a HOA board member for each community.
          The HOAlly admin inputs the addresses of community properties and,
          where available, residents&apos; email addresses. When emails are not
          known, HOAlly can generate invitation letters to streamline resident
          registration.
          <br />
          <span className="marketing-text-note">
            Note: Posts and other information are restricted to community
            members, and personal details are encrypted..
          </span>
        </p>
        <p>
          Once residents register, they can also post proposals, feedback, and
          issues alongside HOA board members, which can then be voted on by
          other community members. Posting and commenting on others&apos; posts
          is not anonymous, but voting is, to prevent potential conflicts among
          neighbors and ensure that residents feel comfortable expressing their
          opinions.
        </p>
        <p>
          Residents who are unable to join HOA board meetings in person or via
          Zoom can still participate in the community. The sentiment of the
          neighborhood regarding board or resident proposals can be easily
          discerned without the need for collecting signatures or posting
          letters. Furthermore, posts can include images and PDF documents,
          while comments can provide alternative viewpoints.
        </p>
        <p>
          HOAlly is not a replacement but an aid for HOA board meetings, where
          all proposals and voting results can be reviewed and taken into
          consideration for the board&apos;s final decisions.
        </p>
      </div>
    </div>
  );
};

export default MarketingContent;
