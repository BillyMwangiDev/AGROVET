import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Tag, ChevronRight } from 'lucide-react';
import { useArticles, useArticleCategories } from '@/hooks/useContent';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleList() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data: categories = [], isLoading: catLoading } = useArticleCategories();
  const { data: articles = [], isLoading } = useArticles(activeCategory);

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <title>Farming Articles &amp; Guides | Nicmah Agrovet</title>
      <meta name="description" content="Expert farming guides, livestock tips and agricultural best practices from Nicmah Agrovet — helping Kenya's farmers succeed." />
      {/* Header */}
      <div className="bg-[#0B3A2C] text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-[#E4B83A]" />
            <h1 className="text-3xl font-bold">Educational Hub</h1>
          </div>
          <p className="text-[#a8c4b6] text-lg max-w-xl">
            Expert guides on livestock farming, crop management, and agricultural best practices.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Category Filter */}
        {!catLoading && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === undefined
                  ? 'bg-[#0B3A2C] text-white border-[#0B3A2C]'
                  : 'bg-white text-[#6B7A72] border-gray-200 hover:border-[#0B3A2C] hover:text-[#0B3A2C]'
              }`}
            >
              All Articles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === cat.slug
                    ? 'bg-[#0B3A2C] text-white border-[#0B3A2C]'
                    : 'bg-white text-[#6B7A72] border-gray-200 hover:border-[#0B3A2C] hover:text-[#0B3A2C]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-[#6B7A72]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No articles found</p>
            <p className="text-sm">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-44 bg-[#e8f5ee] flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-[#0B3A2C] opacity-30" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[#0B3A2C] bg-[#e8f5ee] px-2 py-0.5 rounded-full">
                      {article.category_name}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#111915] text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#0B3A2C] transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#6B7A72] mt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.published_at ? formatDate(article.published_at) : formatDate(article.created_at)}
                    </span>
                    {article.tags && (
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{article.tags.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-[#0B3A2C] group-hover:gap-2 transition-all">
                    Read more <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
