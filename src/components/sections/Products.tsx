import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { apiService } from "../../services/api";
import { useToast } from "../ui/Toast";
import { RightDrawerModal } from "../layout/RightDrawerModal";

interface Product {
 _id: string;
 name: string;
 slug: string;
 category: {
  _id: string;
  name: string;
  slug: string;
 };
 pricePaise: number;
 imageUrl?: string;
 isActive: boolean;
 stock: number;
 createdAt: string;
 updatedAt: string;
}

interface Category {
 _id: string;
 name: string;
 slug: string;
}

export const Products: React.FC = () => {
 const [products, setProducts] = useState<Product[]>([]);
 const [categories, setCategories] = useState<Category[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingProduct, setEditingProduct] = useState<Product | null>(null);
 const [formData, setFormData] = useState({
  name: "",
  slug: "",
  category: "",
  pricePaise: 0,
  imageUrl: "",
  stock: 100,
  isActive: true,
 });
 const [formLoading, setFormLoading] = useState(false);
 const toast = useToast();

 useEffect(() => {
  fetchData();
 }, []);

 const fetchData = async () => {
  try {
   const [productsData, categoriesData] = await Promise.all([
    apiService.getProducts(),
    apiService.getCategories(),
   ]);
   setProducts(productsData);
   setCategories(categoriesData);
  } catch (error: any) {
   toast.error(error.message || "Failed to fetch data");
  } finally {
   setLoading(false);
  }
 };

 const generateSlug = (name: string) => {
  return name
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, "-")
   .replace(/(^-|-$)/g, "");
 };

 const handleNameChange = (name: string) => {
  setFormData((prev) => ({
   ...prev,
   name,
   slug: generateSlug(name),
  }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData?.name.trim() || !formData?.category) return;

  setFormLoading(true);
  try {
   const productData = {
    ...formData,
    pricePaise: Math.round(formData?.pricePaise * 100), // Convert to paise
   };

   if (editingProduct) {
    await apiService?.updateProduct(editingProduct._id, productData);
    toast.success("Product updated successfully");
   } else {
    await apiService.createProduct(productData);
    toast.success("Product created successfully");
   }

   fetchData();
   handleCloseModal();
  } catch (error: any) {
   toast.error(error.message || "Failed to save product");
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
   toast.error(error.message || "Failed to delete product");
  }
 };

 const handleOpenModal = (product?: Product) => {
  if (product) {
   setEditingProduct(product);
   setFormData({
    name: product?.name,
    slug: product?.slug,
    category: product?.category._id,
    pricePaise: product?.pricePaise / 100, // Convert from paise
    imageUrl: product?.imageUrl || "",
    stock: product?.stock,
    isActive: product?.isActive,
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
   });
  }
  setIsModalOpen(true);
 };

 const handleCloseModal = () => {
  setIsModalOpen(false);
  setEditingProduct(null);
 };

 console.log(products, "products");
 const filteredProducts =
  products?.items &&
  products?.items?.filter(
   (product:any) =>
    product?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
    product?.category?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

 const categoryOptions = [
  { value: "", label: "Select a category" },
  ...categories.map((cat) => ({ value: cat?._id, label: cat?.name })),
 ];

 if (loading) {
  return (
   <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-gray-900">Products</h1>
     <p className="text-gray-600">Manage your product catalog</p>
    </div>
    <Button onClick={() => handleOpenModal()}>
     <Plus className="w-4 h-4 mr-2" />
     Add Product
    </Button>
   </div>

   <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200">
     <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
       type="text"
       placeholder="Search products..."
       value={searchTerm}
       onChange={(e) => setSearchTerm(e?.target?.value)}
       className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
     </div>
    </div>

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
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
       {filteredProducts &&
        filteredProducts?.map((product:any) => (
         <tr key={product?._id}>
          <td className="px-6 py-4 whitespace-nowrap">
           <div className="flex items-center">
            {product?.imageUrl ? (
             <img
              className="h-10 w-10 rounded-lg object-cover mr-3"
              src={product?.imageUrl}
              alt={product?.name}
             />
            ) : (
             <div className="h-10 w-10 rounded-lg bg-gray-200 mr-3 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No img</span>
             </div>
            )}
            <div>
             <div className="text-sm font-medium text-gray-900">
              {product?.name}
             </div>
             <div className="text-sm text-gray-500">{product?.slug}</div>
            </div>
           </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
           {product?.category?.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
           ₹{(product?.pricePaise / 100).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
           {product?.stock}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
           <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
             product?.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
            }`}
           >
            {product?.isActive ? "Active" : "Inactive"}
           </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
           <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(product)}
           >
            <Edit className="w-4 h-4" />
           </Button>
           <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product?._id)}
           >
            <Trash2 className="w-4 h-4 text-red-500" />
           </Button>
          </td>
         </tr>
        ))}
      </tbody>
     </table>
     {filteredProducts?.length === 0 && (
      <div className="p-6 text-center text-gray-500">
       {searchTerm
        ? "No products found matching your search"
        : "No products found"}
      </div>
     )}
    </div>
   </div>

 <RightDrawerModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  title={editingProduct ? "Edit Product" : "Add Product"}
  // maxWidth="lg"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid ">
      <Input
        label="Product Name"
        value={formData?.name}
        onChange={(e) => handleNameChange(e?.target.value)}
        placeholder="Enter product name"
        required
      />

      {/* Hidden Slug Field */}
      <input
        type="hidden"
        value={formData?.slug}
        onChange={(e) => setFormData({ ...formData, slug: e?.target.value })}
      />
    </div>

    {/* Description Field */}
    <div className="border p-2 ">
      <label className="block text-sm font-medium text-gray-700">Description</label>
      <textarea
        value={formData?.description || ""}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Enter product description"
        rows={10}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        required
      ></textarea>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Category"
        value={formData?.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        options={categoryOptions}
        required
      />
      <Input
        label="Price (₹)"
        type="number"
        step="0.01"
        value={formData?.pricePaise}
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
      value={formData?.imageUrl}
      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
      placeholder="https://example.com/image.jpg"
      helperText="Optional: URL to product image"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Stock Quantity"
        type="number"
        value={formData?.stock}
        onChange={(e) =>
          setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
        }
        placeholder="100"
        required
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData?.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 flex items-center">
            {formData?.isActive ? (
              <>
                <Eye className="w-4 h-4 mr-1" /> Active
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-1" /> Inactive
              </>
            )}
          </span>
        </label>
      </div>
    </div>

    <div className="flex space-x-3 pt-4">
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
