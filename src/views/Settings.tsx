import { useAppContext } from '../context/useAppContext';
import {
  FONT_MIN,
  FONT_MAX,
  WIDTH_MIN,
  WIDTH_MAX,
  CONTENT_WIDTH_PRESETS,
} from '../lib/constants';
import { Minus, Plus, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsView() {
  const { theme, setTheme, fontSize, setFontSize, contentWidth, setContentWidth } = useAppContext();

  return (
    <div className="p-10 max-w-2xl mx-auto h-full overflow-y-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-8 flex items-center space-x-3">
        <SettingsIcon className="w-6 h-6 text-blue-500" />
        <span>Settings</span>
      </h2>

      <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
        <h3 className="font-bold mb-1">Appearance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose light or dark reading.</p>
        <div className="flex space-x-2">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors',
              theme === 'light'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors',
              theme === 'dark'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>
        </div>
      </section>

      <section className="mb-8 p-6 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
        <h3 className="font-bold mb-1">Reading Font Size</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Applies to articles and comparisons.</p>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFontSize(fontSize - 2)}
            disabled={fontSize <= FONT_MIN}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-medium w-12 text-center">{fontSize}px</span>
          <button
            onClick={() => setFontSize(fontSize + 2)}
            disabled={fontSize >= FONT_MAX}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="mb-10 p-6 rounded-2xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5">
        <h3 className="font-bold mb-1">Content Width</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How wide article text should stretch.</p>
        <div className="flex items-center space-x-2">
          {CONTENT_WIDTH_PRESETS.map((width) => (
            <button
              key={width}
              onClick={() => setContentWidth(width)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm transition-colors',
                contentWidth === width
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                  : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5',
              )}
            >
              {{ 640: 'Narrow', 896: 'Medium', 1152: 'Wide' }[width]}
            </button>
          ))}
          <input
            type="range"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={32}
            value={contentWidth}
            onChange={(e) => setContentWidth(Number(e.target.value))}
            className="flex-1 ml-2 accent-blue-500"
            aria-label="Custom content width"
          />
        </div>
      </section>
    </div>
  );
}
