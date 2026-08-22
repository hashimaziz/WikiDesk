import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { SettingsView } from './Settings';
import { getSettings, updateSettings } from '../lib/db-client';

vi.mock('../lib/db-client', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn().mockResolvedValue({}),
}));

const mockedGetSettings = vi.mocked(getSettings);
const mockedUpdateSettings = vi.mocked(updateSettings);

describe('Settings view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
    mockedGetSettings.mockResolvedValue({ theme: 'light', font_size: 18, content_width: 896 });
  });

  it('switches the theme and persists it', async () => {
    render(
      <AppProvider>
        <SettingsView />
      </AppProvider>,
    );

    await screen.findByText('Appearance');
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    expect(document.documentElement).toHaveClass('dark');
    await waitFor(() => expect(mockedUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' }));
  });

  it('adjusts font size within bounds', async () => {
    mockedGetSettings.mockResolvedValue({ theme: 'light', font_size: 32, content_width: 896 });
    render(
      <AppProvider>
        <SettingsView />
      </AppProvider>,
    );

    await screen.findByText('Reading Font Size');
    const plus = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-plus'));
    expect(plus).toBeDisabled(); // already at FONT_MAX

    await userEvent.click(screen.getByRole('button', { name: 'Dark' })); // no-op for size
    expect(await screen.findByText('32px')).toBeInTheDocument();
  });

  it('changes the content width preset', async () => {
    render(
      <AppProvider>
        <SettingsView />
      </AppProvider>,
    );

    await screen.findByText('Content Width');
    await userEvent.click(screen.getByRole('button', { name: 'Wide' }));

    await waitFor(() =>
      expect(mockedUpdateSettings).toHaveBeenCalledWith(expect.objectContaining({ content_width: 1152 })),
    );
    expect(screen.getByRole('button', { name: 'Wide' })).toHaveClass('font-medium');
  });
});
