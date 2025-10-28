import { Blog, Recipe } from "../types/api";

// apiService.ts
// const API_BASE_URL =
//  (import.meta as any)?.env?.VITE_API_BASE?.replace(/\/+$/, "") ||
//  "http://localhost:5999"; // no trailing slash, consistent root
const API_BASE_URL = "http://localhost:5999";
//  const API_BASE_URL = "https://futurefoods-api.vercel.app";
type Json =
 | Record<string, any>
 | any[]
 | string
 | number
 | boolean
 | null
 | undefined;

class ApiService {
 private TOKEN_KEY = "authToken";

 private get token() {
  return localStorage.getItem(this.TOKEN_KEY);
 }

 private getAuthHeaders() {
  return this.token ? { Authorization: `Bearer ${this.token}` } : {};
 }

 private buildUrl(path: string, qs?: Record<string, any>) {
  const base = `${API_BASE_URL}`;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!qs) return url;
  const sp = new URLSearchParams();
  Object.entries(qs).forEach(([k, v]) => {
   if (v === undefined || v === null) return;
   sp.set(k, String(v));
  });
  const query = sp.toString();
  return query ? `${url}?${query}` : url;
 }

 private async parseResponse<T>(response: Response): Promise<T> {
  // No content
  if (response.status === 204) return undefined as unknown as T;

  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
   return (await response.json()) as T;
  }

  // Fallback to text for non-JSON responses
  const text = await response.text();
  try {
   return JSON.parse(text) as T;
  } catch {
   return text as T;
  }
 }

 private async request<T>(
  path: string,
  options: RequestInit & { qs?: Record<string, any> } = {}
 ): Promise<T> {
  const { qs, headers, ...rest } = options;

  const url = this.buildUrl(path, qs);
  const config: RequestInit = {
   method: rest.method || "GET",
   headers: {
    "Content-Type": "application/json",
    ...this.getAuthHeaders(),
    ...(headers || {}),
   },
   ...rest,
  };

  try {
   const response = await fetch(url, config);
   const data = await this.parseResponse<T>(response);

   if (!response.ok) {
    // Normalize error shape
    const message =
     (data && (data as any).message) ||
     (typeof data === "string" ? data : "An error occurred");
    const err = { message, status: response.status };

    if (response.status === 401) {
     localStorage.removeItem(this.TOKEN_KEY);
     // Optional: keep the current path to redirect back after login
     const redirect = encodeURIComponent(
      window.location.pathname + window.location.search
     );
     window.location.href = `/login?next=${redirect}`;
    }

    throw err;
   }

   return data;
  } catch (error: any) {
   // Network or parsing failures
   if (error?.status === 401) {
    localStorage.removeItem(this.TOKEN_KEY);
    const redirect = encodeURIComponent(
     window.location.pathname + window.location.search
    );
    window.location.href = `/login?next=${redirect}`;
   }
   throw error;
  }
 }

 // ---- Auth ----
 async login(email: string, password: string) {
  const res = await this.request<{ user: any; token: string }>("/auth/login", {
   method: "POST",
   body: JSON.stringify({ email, password }),
  });
  // Persist token for subsequent calls
  localStorage.setItem(this.TOKEN_KEY, res.token);
  return res;
 }

 async register(name: string, email: string, password: string) {
  const res = await this.request<{ user: any; token: string }>(
   "/auth/register",
   {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
   }
  );
  localStorage.setItem(this.TOKEN_KEY, res.token);
  return res;
 }

 // ---- Categories ----
 async getCategories() {
  return this.request<any[]>("/categories");
 }

 async createCategory(data: { name: string; slug: string }) {
  return this.request<any>("/categories", {
   method: "POST",
   body: JSON.stringify(data),
  });
 }

 async updateCategory(id: string, data: { name: string; slug: string }) {
  return this.request<any>(`/categories/${id}`, {
   method: "PUT",
   body: JSON.stringify(data),
  });
 }

 async deleteCategory(id: string) {
  return this.request<void>(`/categories/${id}`, { method: "DELETE" });
 }

 // ---- Products ----
 async getProducts() {
  return this.request<any[]>("/products");
 }

 async getProduct(slug: string) {
  return this.request<any>(`/products/${encodeURIComponent(slug)}`);
 }

 async createProduct(data: Json) {
  return this.request<any>("/products", {
   method: "POST",
   body: JSON.stringify(data),
  });
 }

 async updateProduct(id: string, data: Json) {
  return this.request<any>(`/products/${id}`, {
   method: "PUT",
   body: JSON.stringify(data),
  });
 }

 async deleteProduct(id: string) {
  return this.request<void>(`/products/${id}`, { method: "DELETE" });
 }

 // ---- Orders ----
 async getOrders() {
  return this.request<any[]>("/orders");
 }

 // ---- Blogs (Admin) ----
 async getBlogsAdmin({
  includeInactive,
  allStatus,
  page = 1,
  limit = 50,
 }: {
  includeInactive?: boolean;
  allStatus?: boolean;
  page?: number;
  limit?: number;
 }) {
  return this.request<{
   items: Blog[];
   page: number;
   limit: number;
   total: number;
   totalPages: number;
  }>("/blogs", {
   qs: {
    includeInactive: String(!!includeInactive),
    allStatus: String(!!allStatus),
    page,
    limit,
   },
  });
 }

 async createBlog(body: Partial<Blog>) {
  return this.request<Blog>("/blogs", {
   method: "POST",
   body: JSON.stringify(body),
  });
 }

 async updateBlog(id: string, body: Partial<Blog>) {
  return this.request<Blog>(`/blogs/${id}`, {
   method: "PUT",
   body: JSON.stringify(body),
  });
 }

 async setBlogFeatured(id: string, mainBlog: boolean) {
  return this.updateBlog(id, { mainBlog });
 }

 // soft delete (inactive)
 async deleteBlog(id: string) {
  return this.request<{ message: string; post: Blog }>(`/blogs/${id}`, {
   method: "DELETE",
  });
 }

 async restoreBlog(id: string) {
  return this.request<{ message: string; post: Blog }>(`/blogs/${id}/restore`, {
   method: "POST",
  });
 }

 async createRecipe(payload: Partial<Recipe>) {
  return this.request<Recipe>("/recipes", {
   method: "POST",
   body: JSON.stringify(payload),
  });
 }

 async getRecipes(params = {}) {
  const qs = new URLSearchParams(
   Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .reduce((acc, [k, v]) => {
     acc[k] = String(v);
     return acc;
    }, {})
  ).toString();

  return this.request(`/recipes${qs ? `?${qs}` : ""}`);
 }

 async getRecipeBySlug(slug: string) {
  return this.request(`/recipes/slug/${encodeURIComponent(slug)}`);
 }

 async updateRecipe(id:any, body:any) {
  return this.request(`/recipes/${id}`, {
   method: "PUT",
   body: JSON.stringify(body),
  });
 }

 // Toggle featured via update (mirrors setBlogFeatured)
 async setRecipeFeatured(id:any, featured:any) {
  return this.updateRecipe(id, { featured });
 }

 // Soft delete (mark inactive or isDeleted=true; see backend below)
 async deleteRecipe(id:any) {
  return this.request(`/recipes/${id}`, { method: "DELETE" });
 }

 // Restore (make active again)
 async restoreRecipe(id:any) {
  return this.request(`/recipes/${id}/restore`, { method: "POST" });
 }
}

export const apiService = new ApiService();
