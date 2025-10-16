import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, StarOff, Edit, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';
import { RightDrawerModal } from '../layout/RightDrawerModal';
import { apiService } from '../../services/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface Recipe {
  _id: string;
  title: string;
  slug: string;
  imageUrl?: string;
  shortDescription: string;
  ingredients: string[];
  steps: string[];
  prepTimeMins?: number;
  cookTimeMins?: number;
  servings?: number;
  tags?: string[];
  category?: { _id: string; name: string; slug: string };
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

const generateSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const Recipes: React.FC = () => {
  const toast = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState(''); // '', 'true', 'false'
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    imageUrl: '',
    shortDescription: '',
    ingredients: [''],
    steps: [''],
    prepTimeMins: 0,
    cookTimeMins: 0,
    servings: 1,
    tags: '' as string, // comma-separated in UI
    category: '',
    isActive: true,
    featured: false,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rec, cats] = await Promise.all([
        apiService.getRecipes({ page: 1, limit: 50, sort: '-createdAt' }),
        // reuse your existing categories API
        apiService.getCategories?.() ?? Promise.resolve([]),
      ]);
      setRecipes(rec?.items || []);
      setCategories(Array.isArray(cats) ? cats : (cats?.items || []));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = recipes;
    const term = searchTerm.toLowerCase();
    if (term) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.shortDescription?.toLowerCase().includes(term) ||
          r.tags?.some((t) => t.toLowerCase().includes(term)) ||
          r.slug.toLowerCase().includes(term)
      );
    }
    if (featuredFilter) {
      const want = featuredFilter === 'true';
      list = list.filter((r) => r.featured === want);
    }
    if (statusFilter) {
      const want = statusFilter === 'active';
      list = list.filter((r) => (r.isActive ? 'active' : 'inactive') === (want ? 'active' : 'inactive'));
    }
    if (categoryFilter) {
      list = list.filter((r) => r.category?._id === categoryFilter);
    }
    return list;
  }, [recipes, searchTerm, featuredFilter, statusFilter, categoryFilter]);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];
  const categoryFormOptions = [
    { value: '', label: 'Select a category (optional)' },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const featuredOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Featured' },
    { value: 'false', label: 'Not Featured' },
  ];
  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const openDrawer = (r?: Recipe) => {
    if (r) {
      setEditing(r);
      setForm({
        title: r.title,
        slug: r.slug,
        imageUrl: r.imageUrl || '',
        shortDescription: r.shortDescription || '',
        ingredients: r.ingredients?.length ? r.ingredients : [''],
        steps: r.steps?.length ? r.steps : [''],
        prepTimeMins: r.prepTimeMins || 0,
        cookTimeMins: r.cookTimeMins || 0,
        servings: r.servings || 1,
        tags: Array.isArray(r.tags) ? r.tags.join(', ') : '',
        category: r.category?._id || '',
        isActive: r.isActive,
        featured: r.featured,
      });
    } else {
      setEditing(null);
      setForm({
        title: '',
        slug: '',
        imageUrl: '',
        shortDescription: '',
        ingredients: [''],
        steps: [''],
        prepTimeMins: 0,
        cookTimeMins: 0,
        servings: 1,
        tags: '',
        category: '',
        isActive: true,
        featured: false,
      });
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditing(null);
  };

  const onChangeField = (key: keyof typeof form, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const onChangeTitle = (title: string) => {
    setForm((p) => ({ ...p, title, slug: p.slug || generateSlug(title) }));
  };

  const updateArrayField = (key: 'ingredients' | 'steps', idx: number, value: string) => {
    setForm((p) => {
      const arr = [...p[key]];
      arr[idx] = value;
      return { ...p, [key]: arr };
    });
  };

  const addArrayItem = (key: 'ingredients' | 'steps') => {
    setForm((p) => ({ ...p, [key]: [...p[key], ''] }));
  };

  const removeArrayItem = (key: 'ingredients' | 'steps', idx: number) => {
    setForm((p) => {
      const arr = [...p[key]];
      arr.splice(idx, 1);
      return { ...p, [key]: arr.length ? arr : [''] };
    });
  };

  const toggleFeatured = async (r: Recipe) => {
    try {
      await apiService.updateRecipe(r._id, { featured: !r.featured });
      toast.success(!r.featured ? 'Marked as Featured' : 'Removed from Featured');
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update featured');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    try {
      await apiService.deleteRecipe(id);
      toast.success('Deleted');
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || generateSlug(form.title),
        imageUrl: form.imageUrl?.trim() || undefined,
        shortDescription: form.shortDescription.trim(),
        ingredients: (form.ingredients || []).map((s) => s.trim()).filter(Boolean),
        steps: (form.steps || []).map((s) => s.trim()).filter(Boolean),
        prepTimeMins: Number(form.prepTimeMins) || 0,
        cookTimeMins: Number(form.cookTimeMins) || 0,
        servings: Number(form.servings) || 1,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        category: form.category || undefined,
        isActive: !!form.isActive,
        featured: !!form.featured,
      };

      if (editing) {
        await apiService.updateRecipe(editing._id, payload);
        toast.success('Recipe updated');
      } else {
        await apiService.createRecipe(payload);
        toast.success('Recipe created');
      }
      await fetchAll();
      closeDrawer();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-600">Create and manage recipes</p>
        </div>
        <Button onClick={() => openDrawer()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search title, tags, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              options={[
                { value: '', label: 'All (Featured)' },
                { value: 'true', label: 'Featured' },
                { value: 'false', label: 'Not Featured' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All (Status)' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryOptions}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.title} className="h-10 w-10 rounded-lg object-cover mr-3" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.title}</div>
                        <div className="text-xs text-gray-500">{r.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.category?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.tags?.length ? r.tags.join(', ') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          r.featured
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {r.featured ? 'Featured' : '—'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => toggleFeatured(r)}>
                        {r.featured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.isActive ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" /> Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openDrawer(r)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {(searchTerm || featuredFilter || statusFilter || categoryFilter)
                ? 'No recipes match your filters'
                : 'No recipes found'}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Form */}
      <RightDrawerModal
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Edit Recipe' : 'Add Recipe'}
      >
        <form className="space-y-5" onSubmit={onSubmit}>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g., Kimchi Grilled Cheese"
            required
          />

          {/* Hidden / readonly slug field (you can show it if you want to edit) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => onChangeField('slug', generateSlug(e.target.value))}
              placeholder="will auto-generate"
            />
            <Input
              label="Image URL"
              value={form.imageUrl}
              onChange={(e) => onChangeField('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <textarea
              value={form.shortDescription}
              onChange={(e) => onChangeField('shortDescription', e.target.value)}
              rows={5}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="One or two lines for the card..."
              required
            />
          </div>

          {/* Times and servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Prep Time (mins)"
              type="number"
              value={form.prepTimeMins}
              onChange={(e) => onChangeField('prepTimeMins', Number(e.target.value) || 0)}
              placeholder="0"
            />
            <Input
              label="Cook Time (mins)"
              type="number"
              value={form.cookTimeMins}
              onChange={(e) => onChangeField('cookTimeMins', Number(e.target.value) || 0)}
              placeholder="0"
            />
            <Input
              label="Servings"
              type="number"
              value={form.servings}
              onChange={(e) => onChangeField('servings', Number(e.target.value) || 1)}
              placeholder="1"
            />
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => onChangeField('category', e.target.value)}
              options={categoryFormOptions}
            />
            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => onChangeField('tags', e.target.value)}
              placeholder="kimchi, sandwich, probiotic"
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Ingredients</label>
              <Button type="button" variant="secondary" onClick={() => addArrayItem('ingredients')}>+ Add</Button>
            </div>
            <div className="mt-2 space-y-2 max-h-60 overflow-auto pr-1">
              {form.ingredients.map((val, idx) => (
                <div key={`ing-${idx}`} className="flex gap-2">
                  <input
                    value={val}
                    onChange={(e) => updateArrayField('ingredients', idx, e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Ingredient #${idx + 1}`}
                  />
                  <Button type="button" variant="ghost" onClick={() => removeArrayItem('ingredients', idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Steps</label>
              <Button type="button" variant="secondary" onClick={() => addArrayItem('steps')}>+ Add</Button>
            </div>
            <div className="mt-2 space-y-2 max-h-60 overflow-auto pr-1">
              {form.steps.map((val, idx) => (
                <div key={`step-${idx}`} className="flex gap-2">
                  <textarea
                    value={val}
                    onChange={(e) => updateArrayField('steps', idx, e.target.value)}
                    rows={2}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Step #${idx + 1}`}
                  />
                  <Button type="button" variant="ghost" onClick={() => removeArrayItem('steps', idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Status + Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onChangeField('isActive', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                {form.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => onChangeField('featured', e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Star className="w-4 h-4" />
                Featured
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 p-8">
            <Button type="submit" loading={formLoading} className="flex-1">
              {editing ? 'Update Recipe' : 'Create Recipe'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Cancel
            </Button>
          </div>
        </form>
      </RightDrawerModal>
    </div>
  );
};
