import { useRouteError, Link } from 'react-router-dom';

import './ErrorPage.css';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>&lt;{error.statusText || error.message}&gt;</i>
      </p>
      <p>
        Get back to <Link to={'/'}>Home</Link>
      </p>
    </div>
  );
}
