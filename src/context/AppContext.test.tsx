import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from './AppContext';
import { useAppContext } from './useAppContext';
import { getSettings, updateSettings } from '../lib/db-client';

vi.mock('../lib/db-client', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn().mockResolvedValue({}),
}));

const mockedGetSettings = vi.mocked(getSettings);
const mockedUpdateSettings = vi.mocked(updateSettings);

function Probe() {
  const { fontSize, setFontSize, contentWidth, setContentWidth, theme, setTheme } = useAppContext();
  return (
    <div>
      <span data-testid="font-size">{fontSize}</span>
      <span data-testid="content-width">{contentWidth}</span>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setFontSize(fontSize - 2)}>decrease-font</button>
      <button onClick={() => setFontSize(9999)}>overflow-font</button>
      <button onClick={() => setContentWidth(300)}>underflow-width</button>
      <button onClick={() => setTheme('light')}>set-light</button>
      <button onClick={() => setTheme('dark')}>set-dark</button>
    </div>
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('loads persisted settings on mount', async () => {
    mockedGetSettings.mockResolvedValue({ theme: 'dark', font_size: 22, content_width: 1152 });
    render(
      <AppProvider>
        <Probe />
      </AppProvider>,
    );

    expect(await screen.findByTestId('font-size')).toHaveTextContent('22');
    expect(screen.getByTestId('content-width')).toHaveTextContent('1152');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('applies the dark class to the document element when theme is dark', async () => {
    mockedGetSettings.mockResolvedValue({ theme: 'dark', font_size: 18, content_width: 768 });
    render(
      <AppProvider>
        <Probe />
      </AppProvider>,
    );

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    await userEvent.click(screen.getByText('set-light'));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('clamps font size and content width to allowed ranges', async () => {
    mockedGetSettings.mockResolvedValue({ theme: 'light', font_size: 18, content_width: 768 });
    render(
      <AppProvider>
        <Probe />
      </AppProvider>,
    );
    await screen.findByTestId('font-size');

    await userEvent.click(screen.getByText('decrease-font'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('16');

    await userEvent.click(screen.getByText('overflow-font'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('32');

    await userEvent.click(screen.getByText('underflow-width'));
    expect(screen.getByTestId('content-width')).toHaveTextContent('560');
  });

  it('persists every change through updateSettings', async () => {
    mockedGetSettings.mockResolvedValue({ theme: 'light', font_size: 18, content_width: 768 });
    render(
      <AppProvider>
        <Probe />
      </AppProvider>,
    );
    await screen.findByTestId('font-size');

    await userEvent.click(screen.getByText('set-dark'));
    await userEvent.click(screen.getByText('overflow-font'));

    await act(async () => {});
    expect(mockedUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
    expect(mockedUpdateSettings).toHaveBeenCalledWith({ font_size: 32 });
    expect(mockedUpdateSettings).toHaveBeenCalledTimes(2);
  });
});
