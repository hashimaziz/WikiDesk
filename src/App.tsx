import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Search as SearchView } from './views/Search';
import { Article } from './views/Article';
import { Collections } from './views/Collections';
import { Compare } from './views/Compare';
import { Search, BookMarked, History as HistoryIcon, Share2, Settings, Home } from 'lucide-react';
import { cn } from './lib/utils';

function Sidebar() {
  const location = useLocation();
  const { focusMode } = useAppContext();

  if (focusMode) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: BookMarked, label: 'Collections', path: '/collections' },
    { icon: HistoryIcon, label: 'Recent', path: '/recent' },
    { icon: Share2, label: 'Graph', path: '/graph' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

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
              location.pathname === item.path 
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              location.pathname === item.path ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-200"
            )} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function HomePage() {
  return (
    <div className="p-10 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mt-12 space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Explore the sum of human knowledge.</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">Search for any topic to begin your journey.</p>
      </div>
      
      <div className="mt-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/10 p-2 flex items-center shadow-sm">
          <Search className="w-6 h-6 text-gray-400 ml-4" />
          <input 
            type="text" 
            placeholder="Search Wikipedia..." 
            className="w-full bg-transparent border-none outline-none px-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
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
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchView />} />
              <Route path="/collections" element={<Collections />} />
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
