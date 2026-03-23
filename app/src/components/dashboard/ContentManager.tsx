import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  useAdminArticles,
  useArticle,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  useTogglePublishArticle,
  useArticleCategories,
} from '@/hooks/useContent';
import type { ApiArticleListItem } from '@/api/content';

type FormState = {
  title: string;
  category: string;
  tags: string;
  body: string;
  is_published: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  category: '',
  tags: '',
  body: '',
  is_published: false,
};

// ── Article form (handles body prefetch for edits) ────────────────────────────
function ArticleForm({
  editingSlug,
  onClose,
}: {
  editingSlug: string | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(editingSlug);
  const { data: existingArticle, isLoading: bodyLoading } = useArticle(editingSlug ?? '');
  const { data: categories = [] } = useArticleCategories();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [bodyReady, setBodyReady] = useState(!isEdit);

  // Pre-populate form when fetched article arrives — setState driven by server data, not render cascade
  useEffect(() => {
    if (existingArticle) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm({
        title: existingArticle.title,
        category: existingArticle.category,
        tags: existingArticle.tags ?? '',
        body: existingArticle.body,
        is_published: existingArticle.is_published,
      });
      setBodyReady(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [existingArticle]);

  async function handleSubmit() {
    if (!form.title.trim() || !form.category) {
      toast.error('Title and category are required');
      return;
    }
    if (!form.body.trim()) {
      toast.error('Article body cannot be empty');
      return;
    }
    try {
      if (isEdit && editingSlug) {
        await updateArticle.mutateAsync({
          slug: editingSlug,
          patch: {
            title: form.title,
            category: form.category,
            tags: form.tags,
            body: form.body,
          },
        });
        toast.success('Article updated');
      } else {
        await createArticle.mutateAsync({
          title: form.title,
          category: form.category,
          tags: form.tags,
          body: form.body,
          is_published: form.is_published,
        });
        toast.success('Article created');
      }
      onClose();
    } catch {
      toast.error('Failed to save article');
    }
  }

  const isSaving = createArticle.isPending || updateArticle.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? 'Edit Article' : 'New Article'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Article title"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="dairy, feeds, cattle (comma-separated)"
            />
          </div>

          {/* Body — rich text editor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Body *</label>
            {isEdit && (bodyLoading || !bodyReady) ? (
              <div className="border border-gray-200 rounded-md h-48 flex items-center justify-center text-muted-foreground text-sm skeleton-shimmer">
                Loading content…
              </div>
            ) : (
              <RichTextEditor
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                minHeight={320}
              />
            )}
          </div>

          {/* Publish toggle (create only) */}
          {!isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish_now"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="w-4 h-4 accent-brand"
              />
              <label htmlFor="publish_now" className="text-sm text-foreground cursor-pointer">
                Publish immediately
              </label>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || (isEdit && !bodyReady)}
            className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl"
          >
            {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ContentManager ───────────────────────────────────────────────────────
export default function ContentManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useAdminArticles();
  const deleteArticle = useDeleteArticle();
  const togglePublish = useTogglePublishArticle();

  async function handleDelete(article: ApiArticleListItem) {
    if (!confirm(`Delete "${article.title}"?`)) return;
    try {
      await deleteArticle.mutateAsync(article.slug);
      toast.success('Article deleted');
    } catch {
      toast.error('Failed to delete article');
    }
  }

  async function handleTogglePublish(article: ApiArticleListItem) {
    try {
      const result = await togglePublish.mutateAsync(article.slug);
      toast.success(result.is_published ? 'Article published' : 'Article unpublished');
    } catch {
      toast.error('Failed to update publish status');
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const published = articles.filter((a) => a.is_published).length;
  const drafts = articles.length - published;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Educational Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {articles.length} articles &nbsp;·&nbsp;
            <span className="text-emerald-600">{published} published</span>
            &nbsp;·&nbsp;
            <span className="text-amber-600">{drafts} drafts</span>
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> New Article
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: 'Total', value: articles.length, color: '#0B3A2C' },
          { icon: Globe, label: 'Published', value: published, color: '#059669' },
          { icon: FileText, label: 'Drafts', value: drafts, color: '#D97706' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Article Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading articles…</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-brand opacity-20" />
            <p className="font-medium text-foreground">No articles yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first educational article.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                  Date
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm text-foreground line-clamp-1">
                      {article.title}
                    </p>
                    {article.author_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">by {article.author_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs bg-brand-50 text-brand px-2 py-0.5 rounded-full font-medium">
                      {article.category_name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {article.published_at
                      ? formatDate(article.published_at)
                      : formatDate(article.created_at)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        article.is_published
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {article.is_published ? (
                        <>
                          <Eye className="w-3 h-3" /> Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleTogglePublish(article)}
                        title={article.is_published ? 'Unpublish' : 'Publish'}
                        className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground hover:text-brand transition-colors"
                      >
                        {article.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingSlug(article.slug)}
                        title="Edit"
                        className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground hover:text-brand transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        title="Delete"
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <ArticleForm editingSlug={null} onClose={() => setShowCreate(false)} />
      )}

      {/* Edit form */}
      {editingSlug && (
        <ArticleForm editingSlug={editingSlug} onClose={() => setEditingSlug(null)} />
      )}
    </div>
  );
}
