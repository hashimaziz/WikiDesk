import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { SmartSidebar } from './SmartSidebar';
import { fetchEntityMetadata } from '../lib/wikipedia';

vi.mock('../lib/wikipedia', () => ({
  fetchEntityMetadata: vi.fn(),
}));

vi.mock('../lib/db-client', () => ({
  getSettings: vi.fn().mockResolvedValue({ theme: 'light', font_size: 18, content_width: 896 }),
  updateSettings: vi.fn().mockResolvedValue({}),
}));

const mockedMeta = vi.mocked(fetchEntityMetadata);

beforeEach(() => {
  vi.clearAllMocks();
});

function link(title: string, times = 1) {
  return Array.from({ length: times }, () =>
    `<a rel="mw:WikiLink" href="./${title}" title="${title}">${title}</a>`,
  ).join(' ');
}

function renderSidebar(html: string) {
  return render(
    <AppProvider><MemoryRouter>
      <Routes>
        <Route path="/" element={<SmartSidebar html={html} />} />
        <Route path="/article/:title" element={<div data-testid="article-page" />} />
      </Routes>
    </MemoryRouter></AppProvider>,
  );
}

describe('SmartSidebar', () => {
  it('groups entities into people/events/places/topics from batched metadata', async () => {
    mockedMeta.mockResolvedValue({
      'Maximilien Robespierre': { description: 'French lawyer and politician' },
      'Storming of the Bastille': { description: 'Uprising in Paris on 14 July 1789' },
      'Paris': { description: 'Capital city of France' },
      'Republicanism': { description: 'Political ideology' },
    });

    const html = `<div>
      ${link('Maximilien Robespierre', 4)}
      ${link('Storming of the Bastille', 3)}
      ${link('Paris', 2)}
      ${link('Republicanism', 1)}
    </div>`;
    renderSidebar(html);

    expect(await screen.findByText('Key People')).toBeInTheDocument();
    expect(screen.getByText('Key Events')).toBeInTheDocument();
    expect(screen.getByText('Key Places')).toBeInTheDocument();
    expect(screen.getByText('Related Topics')).toBeInTheDocument();

    // Entities are sorted by link frequency within the whole list.
    expect(mockedMeta).toHaveBeenCalledWith([
      'Maximilien Robespierre',
      'Storming of the Bastille',
      'Paris',
      'Republicanism',
    ]);
  });

  it('navigates to an entity article on click', async () => {
    mockedMeta.mockResolvedValue({
      Napoleon: { description: 'French emperor' },
    });
    renderSidebar(`<div>${link('Napoleon')}</div>`);

    await userEvent.click(await screen.findByText('Napoleon'));
    expect(screen.getByTestId('article-page')).toBeInTheDocument();
  });

  it('requests metadata only once per title across html re-renders', async () => {
    mockedMeta.mockResolvedValue({ Newton: { description: 'English physicist and mathematician' } });
    const html = `<div>${link('Newton')}</div>`;
    const { rerender } = render(
      <AppProvider><MemoryRouter>
        <SmartSidebar html={html} />
      </MemoryRouter></AppProvider>,
    );
    await waitFor(() => expect(mockedMeta).toHaveBeenCalledTimes(1));

    rerender(
      <AppProvider><MemoryRouter>
        <SmartSidebar html={html} />
      </MemoryRouter></AppProvider>,
    );
    await waitFor(() => expect(screen.getByText('Key People')).toBeInTheDocument());
    expect(mockedMeta).toHaveBeenCalledTimes(1);
  });

  it('shows an empty-state message for articles without wiki links', () => {
    mockedMeta.mockResolvedValue({});
    renderSidebar('<div><p>No links here.</p></div>');
    expect(screen.getByText(/No linked topics found/i)).toBeInTheDocument();
    expect(mockedMeta).not.toHaveBeenCalled();
  });
});
