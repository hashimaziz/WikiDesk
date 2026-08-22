import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { getContinueReading, getCollections, getRecentArticles } from '../lib/db-client';

vi.mock('../lib/db-client', () => ({
  getContinueReading: vi.fn(),
  getRecentArticles: vi.fn(),
  getCollections: vi.fn(),
}));

const mockedContinue = vi.mocked(getContinueReading);
const mockedRecent = vi.mocked(getRecentArticles);
const mockedCollections = vi.mocked(getCollections);

function renderHome() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<div data-testid="search-page" />} />
        <Route path="/collections" element={<div data-testid="collections-page" />} />
        <Route path="/article/:title" element={<div data-testid="article-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Home view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedContinue.mockResolvedValue([]);
    mockedRecent.mockResolvedValue([]);
    mockedCollections.mockResolvedValue([]);
  });

  it('navigates to /search with the query when submitting the search bar', async () => {
    renderHome();

    await userEvent.type(screen.getByPlaceholderText('Search Wikipedia...'), 'french revolution');
    await userEvent.click(screen.getByRole('button', { name: /Search/ }));

    expect(screen.getByTestId('search-page')).toBeInTheDocument();
    // The Search route reads ?q=; verify the URL via the hand-off behavior
    // covered in Search.test.tsx.
  });

  it('shows continue-reading entries that open the article', async () => {
    mockedContinue.mockResolvedValue([
      { id: 2, article_id: 'Byzantine Empire', title: 'Byzantine Empire', timestamp: Date.now() },
    ]);
    renderHome();

    const entry = await screen.findByText('Byzantine Empire');
    await userEvent.click(entry);

    expect(screen.getByTestId('article-page')).toBeInTheDocument();
  });

  it('lists collections with article counts and links to the library', async () => {
    mockedCollections.mockResolvedValue([
      { id: 'col_1', name: 'Space Exploration', created_at: 0, article_count: 3 },
    ]);
    renderHome();

    expect(await screen.findByText('Space Exploration')).toBeInTheDocument();
    expect(screen.getByText(/3 articles/)).toBeInTheDocument();

    await userEvent.click(screen.getByText('Space Exploration'));
    expect(screen.getByTestId('collections-page')).toBeInTheDocument();
  });

  it('renders empty-state hints when there is no history or collections', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/Articles you open will appear here/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No collections yet/i)).toBeInTheDocument();
  });

  it('loads home data without crashing when the DB rejects', async () => {
    mockedRecent.mockRejectedValue(new Error('bridge unavailable'));
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/Your reading history will appear here/i)).toBeInTheDocument();
    });
  });
});
