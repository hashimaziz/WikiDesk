import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Recent } from './Recent';
import { getRecentArticles } from '../lib/db-client';

vi.mock('../lib/db-client', () => ({
  getRecentArticles: vi.fn(),
}));

const mockedGetRecent = vi.mocked(getRecentArticles);

function renderRecent() {
  return render(
    <MemoryRouter initialEntries={['/recent']}>
      <Routes>
        <Route path="/recent" element={<Recent />} />
        <Route path="/article/:title" element={<div data-testid="article-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Recent view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists recent reads with view timestamps and opens articles', async () => {
    mockedGetRecent.mockResolvedValue([
      { id: 1, article_id: 'Roman Empire', title: 'Roman Empire', timestamp: new Date('2026-08-01T10:00:00').getTime() },
      { id: 2, article_id: 'Quantum Mechanics', title: 'Quantum Mechanics', timestamp: new Date('2026-08-02T12:00:00').getTime() },
    ]);
    renderRecent();

    expect(await screen.findByText('Roman Empire')).toBeInTheDocument();
    expect(screen.getAllByText(/Viewed/)).toHaveLength(2);

    await userEvent.click(screen.getByText('Quantum Mechanics'));
    expect(screen.getByTestId('article-page')).toBeInTheDocument();
  });

  it('shows an empty state when there is no history', async () => {
    mockedGetRecent.mockResolvedValue([]);
    renderRecent();

    await waitFor(() => expect(screen.getByText(/No reading history yet/i)).toBeInTheDocument());
  });
});
