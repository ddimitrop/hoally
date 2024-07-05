import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const topBar = screen.getByText(/HOAlly/i);
  expect(topBar).toBeInTheDocument();
});
