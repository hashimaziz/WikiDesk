import { useMemo } from 'react';
import { X, Clock } from 'lucide-react';

interface TimelineModalProps {
  html: string;
  onClose: () => void;
}

interface TimelineEvent {
  year: number;
  text: string;
}

export function TimelineModal({ html, onClose }: TimelineModalProps) {
  const events = useMemo(() => {
    if (!html) return [];
    
    // Parse the HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Extract paragraphs and list items
    const textNodes = Array.from(div.querySelectorAll('p, li')).map(el => el.textContent || '');
    
    const extractedEvents: TimelineEvent[] = [];
    const yearRegex = /\b(?:1[0-9]{3}|20[0-2][0-9])\b/g;
    
    textNodes.forEach(text => {
      // Find sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      sentences.forEach(sentence => {
        const matches = [...sentence.matchAll(yearRegex)];
        if (matches.length > 0) {
          // Take the first year found in the sentence
          const year = parseInt(matches[0][0], 10);
          
          // Avoid duplicates in the same year with exact same text
          if (!extractedEvents.some(e => e.text === sentence.trim())) {
            extractedEvents.push({ year, text: sentence.trim() });
          }
        }
      });
    });
    
    // Sort chronologically and limit to a reasonable number to avoid noise
    return extractedEvents
      .sort((a, b) => a.year - b.year)
      .slice(0, 100); // Max 100 events
  }, [html]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Chronological Timeline</h2>
              <p className="text-sm text-gray-500">Auto-extracted from article</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-transparent">
          {events.length < 5 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No meaningful timeline available.</p>
              <p className="text-sm mt-2 opacity-60">This article doesn't contain enough dates to generate a timeline.</p>
            </div>
          ) : (
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-8 sm:left-24 top-0 bottom-0 w-px bg-blue-200 dark:bg-blue-900/50" />
              
              <div className="space-y-12">
                {events.map((event, i) => (
                  <div key={i} className="relative flex items-start group">
                    <div className="w-16 sm:w-20 pt-1 text-right pr-6 shrink-0 font-bold text-blue-600 dark:text-blue-400">
                      {event.year}
                    </div>
                    
                    <div className="absolute left-8 sm:left-24 w-3 h-3 bg-blue-500 rounded-full -translate-x-1.5 translate-y-2 ring-4 ring-white dark:ring-[#1a1a1a] transition-transform group-hover:scale-150" />
                    
                    <div className="pl-8 sm:pl-12 flex-1">
                      <div className="bg-white dark:bg-white/5 p-5 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 text-gray-800 dark:text-gray-200 text-[15px] leading-relaxed group-hover:border-blue-500/30 transition-colors">
                        {/* Highlight the year in the text */}
                        <span dangerouslySetInnerHTML={{ 
                          __html: event.text.replace(
                            new RegExp(`\\b${event.year}\\b`, 'g'), 
                            `<strong class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1 rounded">${event.year}</strong>`
                          )
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
