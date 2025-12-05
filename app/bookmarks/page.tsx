'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSourceStyle } from '@/lib/utils';
import { X, Star } from 'lucide-react';

// 型定義は共通化推奨ですが一旦ここに記述
type Article = {
  id: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  source: { name: string };
  gemini_insight: string;
  gemini_example: string;
  gemini_explanation: string[];
  is_favorite: boolean;
};

export default function Bookmarks() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, source:sources(name)`)
        .eq('is_favorite', true) // お気に入りのみ
        .order('published_at', { ascending: false });

      if (!error && data) {
        setArticles(data);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, []);

  const handleRemoveFavorite = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    
    // リストから即座に削除
    setArticles(current => current.filter(a => a.id !== article.id));

    await supabase
      .from('articles')
      .update({ is_favorite: false })
      .eq('id', article.id);
  };

  const closeModal = () => setSelectedArticle(null);

  if (loading) return <div className="p-20 text-center text-gray-500">Loading bookmarks...</div>;

  return (
    <div className="main-wrapper">
      <header>
        <h1>Saved Articles</h1>
        <span className="date-info">
          {articles.length} Bookmarks
        </span>
      </header>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm">
          <p>ブックマークされた記事はありません。</p>
          <p className="text-sm mt-2 text-gray-400">気になる記事にスターを付けて保存しましょう。</p>
        </div>
      ) : (
        <div className="grid-container">
          {articles.map((article) => {
            const style = getSourceStyle(article.source?.name);
            return (
              <div key={article.id} className="article-card group relative" onClick={() => setSelectedArticle(article)}>
                <button
                  onClick={(e) => handleRemoveFavorite(e, article)}
                  className="absolute top-0 right-0 z-10 p-3 rounded-bl-2xl border-b border-l border-yellow-100 bg-yellow-50 hover:bg-red-50 hover:border-red-100 transition-colors group/btn"
                  title="ブックマーク解除"
                >
                   <Star 
                    size={20} 
                    className="fill-yellow-400 text-yellow-400 group-hover/btn:fill-gray-200 group-hover/btn:text-gray-300" 
                  />
                </button>

                <div className="card-header">
                  <div className="card-icon" style={{ background: style.background }}>{style.icon}</div>
                  <div className="card-meta">
                    <span className="source-name">{article.source?.name}</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="card-title mt-2">{article.title}</div>
                <div className="card-summary">{article.summary}</div>
                <div className="read-more-btn">詳細を読む →</div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* モーダル (Homeと共通) */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="close-btn"><X size={24} /></button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: getSourceStyle(selectedArticle.source?.name).background }}>
                {getSourceStyle(selectedArticle.source?.name).icon}
              </div>
              <div className="modal-title">
                <h2>{selectedArticle.title}</h2>
                <div className="modal-meta">{selectedArticle.source?.name} | {new Date(selectedArticle.published_at).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: '1.1em', lineHeight: '1.8', marginBottom: '20px', color: '#333' }}>
              {selectedArticle.summary}
            </div>
            <div>
              <a href={selectedArticle.url} target="_blank" rel="noreferrer" className="original-link">
                原文記事を開く ({selectedArticle.source?.name}) ↗
              </a>
            </div>
            {selectedArticle.gemini_insight && (
              <div className="insight-section">
                <div className="insight-title">🧠 考察・ビジネスへの影響</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedArticle.gemini_insight}</div>
              </div>
            )}
            {selectedArticle.gemini_explanation && selectedArticle.gemini_explanation.length > 0 && (
                <div className="glossary-wrap">
                  {selectedArticle.gemini_explanation.map((term, i) => (
                    <span key={i} className="glossary-chip">📘 {term.replace(/^[\s・\-\*]+/, '')}</span>
                  ))}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}