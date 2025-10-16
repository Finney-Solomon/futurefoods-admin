export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: Category;
  pricePaise: number;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  pricePaise: number;
}

export interface Order {
  _id: string;
  user: User;
  items: OrderItem[];
  amountPaise: number;
  status: 'created' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  address: {
    line1: string;
    city: string;
    state: string;
    pin: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  status?: number;
}


// --- Blogs ---

export type BlogBlockType = 'section' | 'image' | 'quote' | 'list' | 'html' | 'markdown';

export interface BlogImage {
  url: string;
  alt?: string;
}

export interface BlogList {
  ordered?: boolean;
  items: string[];
}

/** Discriminated union for content blocks */
export type BlogBlock =
  | {
      type: 'section';
      subheading?: string;
      body?: string[]; // paragraphs
    }
  | {
      type: 'image';
      image: BlogImage;
    }
  | {
      type: 'quote';
      quote: string;
      cite?: string;
    }
  | {
      type: 'list';
      list: BlogList;
      subheading?: string;
    }
  | {
      type: 'html';
      html: string;
    }
  | {
      type: 'markdown';
      markdown: string;
    };

export type BlogStatus = 'draft' | 'published';

export interface BlogSEO {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface BlogAuthor {
  name: string;
  avatar?: string;
}

export interface Blog {
  _id: string;
  heading: string;
  description: string[];     // intro paragraphs
  slug: string;
  coverImage?: string;
  content: BlogBlock[];
  tags: string[];
  category?: string;
  author: BlogAuthor;
  status: BlogStatus;
  publishedAt?: string | null;

  // flags
  mainBlog: boolean;         // featured at top
  isActive: boolean;         // soft-delete flag
  inactiveAt?: string | null;

  seo?: BlogSEO;

  createdAt: string;
  updatedAt: string;
}

/** Payload for create */
export interface BlogCreate {
  heading: string;
  description: string[];
  slug: string;
  coverImage?: string;
  content: BlogBlock[];
  tags: string[];
  category?: string;
  author: BlogAuthor;
  status: BlogStatus;
  publishedAt?: string | null;
  mainBlog?: boolean;
  isActive?: boolean;
  seo?: BlogSEO;
}

/** Payload for update (partial) */
export type BlogUpdate = Partial<BlogCreate>;

/** Generic paginated envelope (your list endpoints) */
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Common blog API responses */
export type BlogListResponse = Paginated<Blog>;
export interface BlogDeleteResponse { message: string; post: Blog; }
export interface BlogRestoreResponse { message: string; post: Blog; }

/** Public query params */
export interface BlogPublicQuery {
  page?: number;
  limit?: number;
  tag?: string;
  category?: string;
  q?: string;
}

/** Admin query params */
export interface BlogAdminQuery extends BlogPublicQuery {
  includeInactive?: boolean; // default false
  allStatus?: boolean;       // default false (otherwise only published)
}


export type Recipe = {
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
};
