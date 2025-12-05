'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSourceStyle } from '@/lib/utils';
import { X } from 'lucide-react';

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
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // ▼▼▼ 並び順のロジック (OpenAI, GitHubもここで定義済み) ▼▼▼
  const getPriority = (sourceName: string) => {
    const name = sourceName?.toLowerCase() || "";
    if (name.includes('google')) return 1;
    if (name.includes('openai')) return 2; // データが来れば2番目に表示
    if (name.includes('github')) return 3; // データが来れば3番目に表示
    if (name === 'zenn trends') return 4;
    if (name === 'zenn (copilot)') return 5;
    if (name === 'qiita trends') return 6;
    if (name === 'qiita (copilot)') return 7;
    return 8; // その他
  };

  // 日本時間の本日（00:00-23:59）に登録された記事のみをフィルター
  const isTodayInJST = (utcTimestamp: string): boolean => {
    const date = new Date(utcTimestamp);
    
    // UTC をJST（UTC+9）に変換
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    
    // 現在時刻を JST に変換
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    
    // 日本時間での本日の日付（年月日）を比較
    return (
      jstDate.getUTCFullYear() === jstNow.getUTCFullYear() &&
      jstDate.getUTCMonth() === jstNow.getUTCMonth() &&
      jstDate.getUTCDate() === jstNow.getUTCDate()
    );
  };

  useEffect(() => {
    const fetchArticles = async () => {
      // 1. 日付順で取得（本来は多めに取得して後でフィルター）
      const { data, error } = await supabase
        .from('articles')
        .select(`*, source:sources(name)`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        // 2. 日本時間で本日に登録された記事のみをフィルター
        const filteredData = data.filter((article) => isTodayInJST(article.created_at));

        // 3. フロントエンド側で優先度順に並び替え
        const sortedData = filteredData.sort((a, b) => {
          const priorityA = getPriority(a.source?.name);
          const priorityB = getPriority(b.source?.name);

          // 優先度が異なる場合は優先度で比較 (小さい方が先)
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          // 優先度が同じ場合は日付の新しい順
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

        setArticles(sortedData);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const closeModal = () => setSelectedArticle(null);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading articles...</div>;

  return (
    <div className="main-wrapper">
      <header>
        <h1>Daily Tech Insights</h1>
        <span className="date-info">
          {new Date().toLocaleDateString()} | {articles.length} Updates
        </span>
      </header>

      {/* Gridコンテナ */}
      <div className="grid-container">
        {articles.map((article) => {
          const style = getSourceStyle(article.source?.name);
          return (
            <div 
              key={article.id} 
              className="article-card"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="card-header">
                <div 
                  className="card-icon" 
                  style={{ background: style.background }}
                >
                  {style.icon}
                </div>
                <div className="card-meta">
                  <span className="source-name">{article.source?.name}</span>
                  <span>{new Date(article.published_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="card-title">
                {article.title}
              </div>
              <div className="card-summary">
                {article.summary}
              </div>
              
              <div className="read-more-btn">詳細を読む →</div>
            </div>
          );
        })}
      </div>

      {/* モーダル */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className="modal-content-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="close-btn">
              <X size={24} />
            </button>

            <div className="modal-header">
              <div 
                className="modal-icon"
                style={{ background: getSourceStyle(selectedArticle.source?.name).background }}
              >
                {getSourceStyle(selectedArticle.source?.name).icon}
              </div>
              <div className="modal-title">
                <h2>{selectedArticle.title}</h2>
                <div className="modal-meta">
                  {selectedArticle.source?.name} | {new Date(selectedArticle.published_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.1em', lineHeight: '1.8', marginBottom: '20px', color: '#333' }}>
              {selectedArticle.summary}
            </div>

            <div>
              <a 
                href={selectedArticle.url} 
                target="_blank" 
                rel="noreferrer"
                className="original-link"
              >
                原文記事を開く ({selectedArticle.source?.name}) ↗
              </a>
            </div>

            {selectedArticle.gemini_insight && (
              <div className="insight-section">
                <div className="insight-title">🧠 考察・ビジネスへの影響</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{selectedArticle.gemini_insight}</div>
              </div>
            )}

            {selectedArticle.gemini_example && (
              <div className="example-section">
                <div className="example-title">💡 具体的な例・ユースケース</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{selectedArticle.gemini_example}</div>
              </div>
            )}

            {selectedArticle.gemini_explanation && selectedArticle.gemini_explanation.length > 0 && (
              <div className="glossary-wrap">
                {selectedArticle.gemini_explanation.map((term, i) => (
                  <span key={i} className="glossary-chip">
                    📘 {term.replace(/^[\s・\-\*]+/, '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}