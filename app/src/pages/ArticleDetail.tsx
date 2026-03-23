import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useArticle } from '@/hooks/useContent';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, isError } = useArticle(slug ?? '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7F6] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-[#F6F7F6] flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-16 h-16 text-[#0B3A2C] opacity-20" />
        <h2 className="text-xl font-semibold text-[#111915]">Article not found</h2>
        <p className="text-[#6B7A72]">This article may have been removed or is not yet published.</p>
        <button
          onClick={() => navigate('/articles')}
          className="flex items-center gap-2 text-[#0B3A2C] font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to articles
        </button>
      </div>
    );
  }

  const plainBody = article.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const articleDesc = plainBody.length > 10
    ? plainBody.substring(0, 155) + (plainBody.length > 155 ? '…' : '')
    : `${article.title} — Read the full guide on Nicmah Agrovet's Educational Hub.`;

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <title>{article.title} | Nicmah Agrovet</title>
      <meta name="description" content={articleDesc} />
      {/* Header bar */}
      <div className="bg-[#0B3A2C] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/articles"
            className="flex items-center gap-2 text-[#a8c4b6] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Educational Hub
          </Link>
          <span className="text-[#4d7a62]">/</span>
          <span className="text-white text-sm truncate max-w-xs">{article.title}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Category badge */}
        <span className="inline-block text-xs font-medium text-[#0B3A2C] bg-[#e8f5ee] px-3 py-1 rounded-full mb-4">
          {article.category_name}
        </span>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#111915] leading-snug mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7A72] mb-6 pb-6 border-b border-gray-200">
          {article.author_name && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {article.author_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {article.published_at
              ? formatDate(article.published_at)
              : formatDate(article.created_at)}
          </span>
          {article.tag_list && article.tag_list.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              {article.tag_list.join(', ')}
            </span>
          )}
        </div>

        {/* Hero image */}
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="w-full rounded-xl mb-8 object-cover max-h-80"
          />
        )}

        {/* Body — sanitized HTML from rich-text editor */}
        <div
          className="article-body text-[#111915]"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(article.body),
          }}
        />

        {/* Footer nav */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-[#0B3A2C] font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
