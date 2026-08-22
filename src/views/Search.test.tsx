import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Search } from './Search';
import { searchArticles } from '../lib/wikipedia';

vi.mock('../lib/wikipedia', () => ({
  searchArticles: vi.fn(),
}));

const mockedSearch = vi.mocked(searchArticles);

function renderWithRouter(initialEntry = '/search') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/search" element={<Search />} />
        <Route path="/article/:title" element={<div data-testid="article-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Search view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-searches when mounted with a ?q= param (home page hand-off)', async () => {
    mockedSearch.mockResolvedValue([{ pageid: 1, title: 'Albert Einstein', snippet: 'Physicist' }]);
    renderWithRouter('/search?q=einstein');

    await waitFor(() => expect(mockedSearch).toHaveBeenCalledWith('einstein'));
    expect(await screen.findByText('Albert Einstein')).toBeInTheDocument();
  });

  it('searches on submit and navigates to the article on click', async () => {
    mockedSearch.mockResolvedValue([{ pageid: 1, title: 'Tesla', snippet: 'Inventor' }]);
    renderWithRouter();

    await userEvent.type(screen.getByPlaceholderText('Search for any topic...'), 'tesla');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockedSearch).toHaveBeenCalledWith('tesla');
    expect(await screen.findByText('Tesla')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Tesla'));
    expect(screen.getByTestId('article-page')).toBeInTheDocument();
  });

  it('does not re-search when the query is unchanged', async () => {
    mockedSearch.mockResolvedValue([]);
    renderWithRouter('/search?q=same');

    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(1));
    // Effect re-runs on state changes but must not duplicate the request.
    await waitFor(() => expect(screen.getByText(/No results/i)).toBeInTheDocument());
    expect(mockedSearch).toHaveBeenCalledTimes(1);
  });
});
