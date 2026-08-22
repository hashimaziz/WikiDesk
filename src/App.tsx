import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/useAppContext';
import { Home } from './views/Home';
import { Search as SearchView } from './views/Search';
import { Article } from './views/Article';
import { Collections } from './views/Collections';
import { Compare } from './views/Compare';
import { Recent } from './views/Recent';
import { SettingsView } from './views/Settings';
import { GraphExplorer } from './views/GraphExplorer';
import { Search, BookMarked, History as HistoryIcon, Share2, Settings as SettingsIcon, House, Sun, Moon } from 'lucide-react';
import { cn } from './lib/utils';

function Sidebar() {
  const location = useLocation();
  const { focusMode, theme, setTheme } = useAppContext();

  if (focusMode) return null;

  const navItems = [
    { icon: House, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: BookMarked, label: 'Collections', path: '/collections' },
    { icon: HistoryIcon, label: 'Recent', path: '/recent' },
    { icon: Share2, label: 'Graph', path: '/graph' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="w-64 h-full bg-sidebar border-r border-black/5 dark:border-white/5 flex flex-col backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80 pt-10">
      <div className="px-6 pb-6">
        <h1 className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
          WikiDesk
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              isActive(item.path)
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              isActive(item.path) ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-200"
            )} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-2 border-t border-black/5 dark:border-white/5">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
        >
          {theme === 'dark'
            ? <Sun className="w-5 h-5 text-amber-400" />
            : <Moon className="w-5 h-5 text-indigo-500" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex h-screen bg-background overflow-hidden text-foreground selection:bg-blue-500/30">
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-transparent to-black/5 dark:to-black/20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchView />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/graph" element={<GraphExplorer />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/article/:title" element={<Article />} />
              <Route path="/compare/:title1/:title2" element={<Compare />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
