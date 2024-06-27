import { useParams } from 'react-router-dom';

const Community = () => {
  let { communityId } = useParams();
  return <div className="Community">Community {communityId}</div>;
};

export default Community;
