import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Star,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { apiService } from "../../services/api";
import { RightDrawerModal } from "../layout/RightDrawerModal";

/* =========================
   Types aligned to schema
========================= */
type BlockType = "section" | "image" | "quote" | "list" | "html" | "markdown";

type ImageBlock = { url: string; alt?: string };
type ListBlock = { ordered?: boolean; items: string[] };

type Block = {
  type: BlockType;
  subheading?: string;
  body?: string[]; // for "section"
  image?: ImageBlock; // for "image"
  quote?: string; // for "quote"
  cite?: string; // for "quote"
  list?: ListBlock; // for "list"
  html?: string; // for "html"
  markdown?: string; // for "markdown"
};

type Blog = {
  _id: string;
  heading: string;
  description: string[];
  slug: string;
  coverImage?: string;
  content: Block[];
  tags: string[];
  category?: string;
  author: { name: string; avatar?: string };
  status: "draft" | "published";
  publishedAt?: string | null;
  mainBlog: boolean;
  isActive: boolean;
  inactiveAt?: string | null;
  seo?: { title?: string; description?: string; ogImage?: string };
  createdAt: string;
  updatedAt: string;
};

type BlogForm = Omit<Blog, "_id" | "createdAt" | "updatedAt" | "inactiveAt">;

/* =========================
   Helpers
========================= */
const genSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyBlock = (t: BlockType): Block => {
  switch (t) {
    case "section":
      return { type: "section", subheading: "", body: [""] };
    case "image":
      return { type: "image", image: { url: "", alt: "" } };
    case "quote":
      return { type: "quote", quote: "", cite: "" };
    case "list":
      return { type: "list", list: { ordered: false, items: [""] } };
    case "html":
      return { type: "html", html: "" };
    case "markdown":
      return { type: "markdown", markdown: "" };
  }
};

/* =========================
   Block Editor
========================= */
function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch });

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Block type</label>
          <select
            className="border rounded p-2"
            value={block.type}
            onChange={(e) => onChange(emptyBlock(e.target.value as BlockType))}
          >
            <option value="section">section</option>
            <option value="image">image</option>
            <option value="quote">quote</option>
            <option value="list">list</option>
            <option value="html">html</option>
            <option value="markdown">markdown</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            title="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} title="Remove block">
            <X className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Dynamic fields based on type */}
      {block.type === "section" && (
        <div className="space-y-2">
          <Input
            label="Subheading"
            value={block.subheading || ""}
            onChange={(e) => set({ subheading: e.target.value })}
            placeholder="Enter subheading"
          />
          <label className="text-sm font-medium text-gray-700">
            Body paragraphs
          </label>
          {(block.body || []).map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={3}
                value={p}
                onChange={(e) => {
                  const body = [...(block.body || [])];
                  body[i] = e.target.value;
                  set({ body });
                }}
                className="w-full border rounded p-2"
                placeholder={`Paragraph ${i + 1}`}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const body = (block.body || []).filter((_, idx) => idx !== i);
                  set({ body: body.length ? body : [""] });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => set({ body: [...(block.body || []), ""] })}
          >
            + Add paragraph
          </Button>
        </div>
      )}

      {block.type === "image" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Image URL"
            value={block.image?.url || ""}
            onChange={(e) =>
              set({ image: { url: e.target.value, alt: block.image?.alt || "" } })
            }
            placeholder="https://cdn..."
            required
          />
          <Input
            label="Alt text"
            value={block.image?.alt || ""}
            onChange={(e) =>
              set({ image: { url: block.image?.url || "", alt: e.target.value } })
            }
            placeholder="Describe the image"
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Quote"
            value={block.quote || ""}
            onChange={(e) => set({ quote: e.target.value })}
            placeholder="“A tasty truth…”"
          />
          <Input
            label="Cite"
            value={block.cite || ""}
            onChange={(e) => set({ cite: e.target.value })}
            placeholder="— Author"
          />
        </div>
      )}

      {block.type === "list" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="ordered"
              type="checkbox"
              checked={!!block.list?.ordered}
              onChange={(e) =>
                set({
                  list: { ordered: e.target.checked, items: block.list?.items || [""] },
                })
              }
            />
            <label htmlFor="ordered" className="text-sm text-gray-700">
              Ordered list
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700">Items</label>
          {(block.list?.items || []).map((it, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={2}
                value={it}
                onChange={(e) => {
                  const items = [...(block.list?.items || [])];
                  items[i] = e.target.value;
                  set({ list: { ordered: !!block.list?.ordered, items } });
                }}
                className="w-full border rounded p-2"
                placeholder={`Item ${i + 1}`}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const items = (block.list?.items || []).filter((_, idx) => idx !== i);
                  set({
                    list: {
                      ordered: !!block.list?.ordered,
                      items: items.length ? items : [""],
                    },
                  });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              set({
                list: {
                  ordered: !!block.list?.ordered,
                  items: [...(block.list?.items || []), ""],
                },
              })
            }
          >
            + Add item
          </Button>
        </div>
      )}

      {block.type === "html" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">HTML</label>
          <textarea
            rows={6}
            value={block.html || ""}
            onChange={(e) => set({ html: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="<p>HTML here…</p>"
          />
        </div>
      )}

      {block.type === "markdown" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Markdown</label>
          <textarea
            rows={6}
            value={block.markdown || ""}
            onChange={(e) => set({ markdown: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="**Bold** _Italic_ ..."
          />
        </div>
      )}
    </div>
  );
}

/* =========================
   Main Page
========================= */
export const Blogs: React.FC = () => {
  const toast = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<BlogForm>({
    heading: "",
    description: [""],
    slug: "",
    coverImage: "",
    content: [],
    tags: [],
    category: "",
    author: { name: "", avatar: "" },
    status: "draft",
    publishedAt: null,
    mainBlog: false,
    isActive: true,
    seo: { title: "", description: "", ogImage: "" },
  } as unknown as BlogForm);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBlogsAdmin({
        includeInactive: true,
        allStatus: true,
        page: 1,
        limit: 200,
      });
      setBlogs(data.items || data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (b?: Blog) => {
    if (b) {
      setEditing(b);
      setForm({
        heading: b.heading,
        description: b.description?.length ? [...b.description] : [""],
        slug: b.slug,
        coverImage: b.coverImage || "",
        content: b.content || [],
        tags: b.tags || [],
        category: b.category || "",
        author: { name: b.author?.name || "", avatar: b.author?.avatar || "" },
        status: b.status,
        publishedAt: b.publishedAt || null,
        mainBlog: !!b.mainBlog,
        isActive: !!b.isActive,
        seo: {
          title: b.seo?.title || "",
          description: b.seo?.description || "",
          ogImage: b.seo?.ogImage || "",
        },
      } as BlogForm);
    } else {
      setEditing(null);
      setForm({
        heading: "",
        description: [""],
        slug: "",
        coverImage: "",
        content: [],
        tags: [],
        category: "",
        author: { name: "", avatar: "" },
        status: "draft",
        publishedAt: null,
        mainBlog: false,
        isActive: true,
        seo: { title: "", description: "", ogImage: "" },
      } as BlogForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const updateForm = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heading.trim()) return toast.error("Heading is required");
    if (!form.slug.trim()) updateForm("slug", genSlug(form.heading));

    const payload: Partial<BlogForm> = {
      ...form,
      publishedAt:
        form.status === "published" && !form.publishedAt
          ? new Date().toISOString()
          : form.publishedAt || null,
      tags: form.tags.map((t) => t.trim()).filter(Boolean),
      description: form.description.map((p) => p.trim()).filter(Boolean),
      content: form.content, // already structured
    };

    setSaving(true);
    try {
      if (editing) {
        await apiService.updateBlog(editing._id, payload);
        toast.success("Blog updated");
      } else {
        await apiService.createBlog(payload);
        toast.success("Blog created");
      }
      await fetchBlogs();
      closeModal();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async (id: string) => {
    if (!confirm("Mark this blog as inactive?")) return;
    try {
      await apiService.deleteBlog(id);
      toast.success("Blog marked inactive");
      fetchBlogs();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete blog");
    }
  };

  const restore = async (id: string) => {
    try {
      await apiService.restoreBlog(id);
      toast.success("Blog restored");
      fetchBlogs();
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore blog");
    }
  };

  const toggleFeatured = async (id: string, next: boolean) => {
    try {
      await apiService.updateBlog(id, { mainBlog: next });
      toast.success(next ? "Blog featured" : "Blog unfeatured");
      fetchBlogs();
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle featured");
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return blogs.filter(
      (b) =>
        b.heading.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.description || []).some((p) => p.toLowerCase().includes(q)) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [blogs, searchTerm]);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const next = [...form.content];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updateForm("content", next);
  };

  const genSlugWithTimestamp = (title: string) => {
    const base = (title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumerics
      .replace(/\s+/g, "-") // spaces → dashes
      .replace(/-+/g, "-"); // collapse dashes
    return base ? `${Date.now()}-${base}` : "";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600">
            Create, edit, feature, soft-delete, and restore blog posts
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Blog
        </Button>
      </div>

      {/* List + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search blogs…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
        {/* <div className="overflow-x-auto w-full"> */}
          <table className="w-full text-sm">
          {/* <table className="min-w-full divide-y divide-gray-200"> */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Heading
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Slug
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Published
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((b) => (
                <tr key={b._id}>
                  {/* <td className="px-6 py-4"> */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {/* <div className="font-medium text-gray-900 max-w-sm break-words whitespace-normal"> */}
                      {b.heading?.length > 50
                        ? b.heading.slice(0, 40) + "…"
                        : b.heading}
                    {/* </div> */}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">{b.slug?.length > 50 ? b.slug.slice(0, 40) + "…" : b.slug}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${b.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${b.isActive ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${b.mainBlog
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                        }`}
                      onClick={() => toggleFeatured(b._id, !b.mainBlog)}
                      title={b.mainBlog ? "Unfeature" : "Feature at top"}
                    >
                      <Star className="w-3.5 h-3.5 mr-1" />
                      {b.mainBlog ? "Featured" : "Feature"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal(b)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {b.isActive ? (
                      <Button variant="ghost" size="sm" onClick={() => softDelete(b._id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => restore(b._id)}>
                        <RotateCcw className="w-4 h-4 text-emerald-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? "No blogs match your search" : "No blogs yet"}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <RightDrawerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? "Edit Blog" : "Add Blog"}
      >
        <form onSubmit={onSave} className="space-y-5">
          {/* Basics */}
          <Input
            label="Heading"
            value={form.heading}
            onChange={(e) => {
              const heading = e.target.value;
              setForm((p) => ({
                ...p,
                heading,
                // always keep slug in sync with timestamp + heading
                slug: genSlugWithTimestamp(heading),
              }));
            }}
            placeholder="Enter blog heading"
            required
          />
          {/* <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => updateForm('slug', e.target.value)}
            placeholder="blog-slug"
            required
          /> */}
          <Input
            label="Cover Image URL"
            value={form.coverImage || ""}
            onChange={(e) => updateForm("coverImage", e.target.value)}
            placeholder="https://cdn..."
          />

          {/* Description array */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description (paragraphs)
            </label>
            {form.description.map((para, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => {
                    const next = [...form.description];
                    next[i] = e.target.value;
                    updateForm("description", next);
                  }}
                  className="w-full border rounded p-2"
                  placeholder={`Paragraph ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = form.description.filter((_, idx) => idx !== i);
                    updateForm("description", next.length ? next : [""]);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => updateForm("description", [...form.description, ""])}
            >
              + Add paragraph
            </Button>
          </div>

          {/* Content blocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Content Blocks
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="newBlockType"
                  className="border rounded p-2"
                  defaultValue="section"
                  onChange={() => { }}
                >
                  <option value="section">section</option>
                  <option value="image">image</option>
                  <option value="quote">quote</option>
                  <option value="list">list</option>
                  <option value="html">html</option>
                  <option value="markdown">markdown</option>
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const sel = (
                      document.getElementById("newBlockType") as HTMLSelectElement
                    )?.value as BlockType;
                    updateForm("content", [...form.content, emptyBlock(sel)]);
                  }}
                >
                  + Add block
                </Button>
              </div>
            </div>

            {form.content.length === 0 && (
              <div className="text-sm text-gray-500">
                No blocks yet — add your first block.
              </div>
            )}

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {form.content.map((b, idx) => (
                <BlockEditor
                  key={idx}
                  block={b}
                  onChange={(nb) => {
                    const next = [...form.content];
                    next[idx] = nb;
                    updateForm("content", next);
                  }}
                  onRemove={() =>
                    updateForm(
                      "content",
                      form.content.filter((_, i) => i !== idx)
                    )
                  }
                  onMoveUp={() => moveBlock(idx, -1)}
                  onMoveDown={() => moveBlock(idx, 1)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < form.content.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Tags / Category / Author */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* <Input
       label="Tags (comma-separated)"
       value={form.tags.join(", ")}
       onChange={(e) =>
        updateForm(
         "tags",
         e.target.value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        )
       }
       placeholder="kimchi, recipe, comfort-food"
      /> */}
            {/* <Input
       label="Category"
       value={form.category || ""}
       onChange={(e) => updateForm("category", e.target.value)}
       placeholder="Recipes"
      /> */}
            <Input
              label="Author Name"
              value={form.author?.name || ""}
              onChange={(e) =>
                updateForm("author", { ...form.author, name: e.target.value })
              }
              placeholder="Futurefoodz Team"
              required
            />
          </div>
          <Input
            label="Author Avatar URL"
            value={form.author?.avatar || ""}
            onChange={(e) =>
              updateForm("author", { ...form.author, avatar: e.target.value })
            }
            placeholder="https://cdn..."
          />

          {/* Status / Featured / PublishedAt / Active */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateForm("status", e.target.value as "draft" | "published")
                }
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-6 md:mt-7">
              <input
                id="mainBlog"
                type="checkbox"
                checked={!!form.mainBlog}
                onChange={(e) => updateForm("mainBlog", e.target.checked)}
              />
              <label htmlFor="mainBlog" className="text-sm text-gray-700">
                Feature at Top (mainBlog)
              </label>
            </div>
          </div>

          <div>
            <div>
              <label className="text-sm font-medium text-gray-700">Published At</label>
              <input
                type="datetime-local"
                value={
                  form.publishedAt
                    ? new Date(form.publishedAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  updateForm(
                    "publishedAt",
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                className="mt-1 block w-full border rounded p-2"
                disabled={form.status !== "published"}
              />
            </div>

            <div className="flex items-center gap-2 mt-6 md:mt-7">
              <input
                id="isActive"
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => updateForm("isActive", e.target.checked)}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3 p-16">
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? "Update Blog" : "Create Blog"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </RightDrawerModal>
    </div>
  );
};
