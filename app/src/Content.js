import { useContext } from 'react';
import { Global } from './Global.js';

const Content = () => {
  const global = useContext(Global);

  return <div>Hello {global.hoaUser.name}</div>;
};

export default Content;
