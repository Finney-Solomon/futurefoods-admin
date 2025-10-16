import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Star, StarOff } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useToast } from "../ui/Toast";
import { RightDrawerModal } from "../layout/RightDrawerModal";
import { apiService } from "../../services/api";

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: { _id: string; name: string; slug: string };
  pricePaise: number;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  description: string;
  featuredProducts: boolean; // NEW
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

type FeaturedView = "all" | "featured";

const formatINR = (paise?: number) => {
  if (typeof paise !== "number") return "—";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
};

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[] | { items: Product[] }>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredView, setFeaturedView] = useState<FeaturedView>("all"); // NEW
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    pricePaise: 0, // rupees in UI, converted on submit
    imageUrl: "",
    stock: 100,
    isActive: true,
    description: "",
    featuredProducts: false, // NEW
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    setFormLoading(true);
    try {
      const productData = {
        ...formData,
        pricePaise: Math.round((formData.pricePaise || 0) * 100), // convert rupees -> paise
      };

      if (editingProduct) {
        await apiService.updateProduct(editingProduct._id, productData);
        toast.success("Product updated successfully");
      } else {
        await apiService.createProduct(productData);
        toast.success("Product created successfully");
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiService.deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete product");
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        category: product.category?._id,
        pricePaise: (product.pricePaise || 0) / 100, // paise -> rupees for UI
        imageUrl: product.imageUrl || "",
        stock: product.stock ?? 0,
        isActive: product.isActive,
        description: product.description || "",
        featuredProducts: !!product.featuredProducts, // NEW
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        slug: "",
        category: "",
        pricePaise: 0,
        imageUrl: "",
        stock: 100,
        isActive: true,
        description: "",
        featuredProducts: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Normalize products list whether API returns array or { items: [] }
  const allProducts: Product[] = useMemo(() => {
    const p = products as any;
    return Array.isArray(p) ? p : Array.isArray(p?.items) ? p.items : [];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const bySearch = allProducts.filter((product) => {
      const term = searchTerm.toLowerCase();
      return (
        product?.name?.toLowerCase().includes(term) ||
        product?.category?.name?.toLowerCase().includes(term)
      );
    });
    return featuredView === "featured"
      ? bySearch.filter((p) => !!p.featuredProducts)
      : bySearch;
  }, [allProducts, searchTerm, featuredView]);

  const categoryOptions = [
    { value: "", label: "Select a category" },
    ...categories.map((cat) => ({ value: cat._id, label: cat.name })),
  ];

  const toggleFeatured = async (product: Product) => {
    try {
      await apiService.updateProduct(product._id, {
        featuredProducts: !product.featuredProducts,
      });
      toast.success(
        `Marked as ${!product.featuredProducts ? "Featured" : "Not Featured"}`
      );
      fetchData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update featured state");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          {/* Featured view toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setFeaturedView("all")}
              className={`px-3 py-2 text-sm ${
                featuredView === "all" ? "bg-gray-100 font-medium" : "bg-white"
              }`}
              aria-pressed={featuredView === "all"}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFeaturedView("featured")}
              className={`px-3 py-2 text-sm flex items-center gap-1 ${
                featuredView === "featured"
                  ? "bg-yellow-50 text-yellow-700 font-medium"
                  : "bg-white"
              }`}
              aria-pressed={featuredView === "featured"}
              title="Show only Featured products"
            >
              <Star className="w-4 h-4" />
              Featured
            </button>
          </div>

          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Top bar */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {featuredView === "featured" && (
            <div className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 inline-flex items-center gap-1 w-fit">
              <Star className="w-3 h-3" /> Showing Featured products
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {/* NEW: Featured column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.imageUrl ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          src={product.imageUrl}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 mr-3 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product?.category?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatINR(product.pricePaise)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* NEW: Featured cell with badge + toggle */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          product.featuredProducts
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {product.featuredProducts ? "Featured" : "—"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={
                          product.featuredProducts ? "Unfeature" : "Mark as Featured"
                        }
                        onClick={() => toggleFeatured(product)}
                      >
                        {product.featuredProducts ? (
                          <Star className="w-4 h-4" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product._id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {searchTerm || featuredView === "featured"
                ? "No products match your filters"
                : "No products found"}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <RightDrawerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter product name"
              required
            />
            {/* Hidden slug for now, still stored */}
            <input
              type="hidden"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="border rounded-md p-3">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categoryOptions}
              required
            />
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              value={formData.pricePaise}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePaise: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              required
            />
          </div>

          <Input
            label="Image URL"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            helperText="Optional: URL to product image"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
              }
              placeholder="100"
              required
            />

            {/* Status */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <label className="flex items-center gap-2 ">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 "
                />
                <span className="text-sm text-gray-700 flex items-center gap-4">
                  {formData.isActive ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>

          {/* NEW: Featured toggle */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Featured</label>
            <label className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={formData.featuredProducts}
                onChange={(e) =>
                  setFormData({ ...formData, featuredProducts: e.target.checked })
                }
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 w-5 h-5"
              />
              <span className="text-lg text-gray-700 flex items-center gap-1">
                {/* <Star className="w-8 h-8" /> */}
                Mark this product as Featured
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={formLoading} className="flex-1">
              {editingProduct ? "Update" : "Create"} Product
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
          </div>
        </form>
      </RightDrawerModal>
    </div>
  );
};
