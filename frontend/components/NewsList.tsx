// components/NewsList.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FiSearch, FiBell, FiClock, FiCalendar, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useTranslation } from '@/lib/i18n';

export default function NewsList({ role, userId }: { role: string; userId: string }) {
  const { t } = useTranslation();
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const limit = 10;

  const fetch = async () => {
    setIsLoading(true);
    try {
      const r = await api.get('/news', { 
        params: { role, page, limit, search } 
      });
      setNews(r.data.news);
      setTotal(r.data.total);
    } catch (err) {
      console.error('Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // Mark all news as read when viewing
    api.post('/news/read', { userId }).catch(() => {});
  }, [page, search, role, userId]);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Get time difference for relative time display
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle news expansion
  const toggleExpand = (newsId: string) => {
    setExpandedNews(expandedNews === newsId ? null : newsId);
  };

  // Truncate text to 2 lines (approximately 120 characters)
  const truncateText = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden border border-gray-200/50">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiBell className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('news') || 'News & Updates'}</h2>
              <p className="text-blue-100 opacity-90">{t('stayInformed') || 'Stay informed with latest announcements'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-blue-200 text-sm">Total Updates</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200/60 bg-white">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FiSearch className="text-lg" />
          </div>
          <input
            placeholder={t('searchNews') || "Search news, announcements, updates..."}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">{t('loadingNews') || 'Loading news...'}</span>
          </div>
        </div>
      ) : (
        /* News List */
        <div className="p-6 space-y-4 min-h-[400px] bg-gray-50/30">
          {news.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FiBell className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noNews') || 'No News Available'}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {search ? 'No results found for your search. Try different keywords.' : 'Check back later for updates and announcements.'}
              </p>
            </div>
          ) : (
            news.map((n, index) => {
              const isExpanded = expandedNews === n.id;
              
              return (
                <div 
                  key={n.id} 
                  className="bg-white rounded-xl border border-gray-200/80 hover:border-blue-300/50 hover:shadow-md transition-all duration-300 overflow-hidden group"
                >
                  {/* News Card */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* News Icon */}
                      <div className={`
                        p-3 rounded-lg flex-shrink-0
                        ${index % 4 === 0 ? 'bg-blue-100 text-blue-600' : 
                          index % 4 === 1 ? 'bg-green-100 text-green-600' : 
                          index % 4 === 2 ? 'bg-purple-100 text-purple-600' : 
                          'bg-amber-100 text-amber-600'}
                      `}>
                        <FiBell className="text-xl" />
                      </div>
                      
                      {/* News Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            {/* Show full text when expanded, truncated when collapsed */}
                            {isExpanded ? (
                              <div className="animate-in fade-in duration-300">
                                <p className="text-gray-800 leading-relaxed pr-4 whitespace-pre-line">
                                  {n.news}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-800 leading-relaxed pr-4 line-clamp-2">
                                {n.news}
                              </p>
                            )}
                            
                            {/* Show view details/show less button */}
                            <button
                              onClick={() => toggleExpand(n.id)}
                              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  Show less
                                  <FiChevronUp className="text-sm" />
                                </>
                              ) : (
                                <>
                                  View details
                                  <FiChevronDown className="text-sm" />
                                </>
                              )}
                            </button>
                          </div>
                          
                          {/* Date Information */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <FiClock className="text-gray-400" />
                              <span>{getTimeAgo(n.createdAt)}</span>
                            </div>
                            <div className="text-xs text-gray-400 hidden md:flex items-center gap-1">
                              <FiCalendar className="text-gray-300" />
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional info when expanded */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  <span>Announcement</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span>For {role}</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Full announcement displayed
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100/50 flex justify-between items-center text-sm">
                    <div className="text-gray-500 text-xs">
                      <span className="text-gray-400">Posted:</span>{' '}
                      <span className="font-medium text-gray-700">
                        {new Date(n.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => toggleExpand(n.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        {isExpanded ? 'Show less' : 'View details'}
                        {isExpanded ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Enhanced Pagination */}
      {total > limit && (
        <div className="p-6 border-t border-gray-200/60 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Info */}
            <div className="text-gray-600 text-sm">
              Showing <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{total}</span> updates
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p-1))} 
                disabled={page===1}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <FiChevronLeft className="text-lg" />
                <span className="hidden sm:inline">{t('prev') || 'Previous'}</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all duration-200
                        ${page === pageNum 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => setPage(p => p+1)} 
                disabled={news.length < limit}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="hidden sm:inline">{t('next') || 'Next'}</span>
                <FiChevronRight className="text-lg" />
              </button>
            </div>
            
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show:</span>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={limit}
                onChange={(e) => {
                  // Note: You might want to add state for limit if you want it to be changeable
                  console.log('Limit changed to:', e.target.value);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>per page</span>
            </div>
          </div>
          
          {/* Quick Page Input */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const newPage = parseInt(e.target.value);
                  if (newPage >= 1 && newPage <= totalPages) {
                    setPage(newPage);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-500">of {totalPages}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}