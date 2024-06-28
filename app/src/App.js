import { Link, Outlet } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="App">
      Hoally
      <Link to="/community/23">Community 23</Link>
      <br />
      <Outlet />
    </div>
  );
}

export default App;
