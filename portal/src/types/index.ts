export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizers' | 'main-courses' | 'desserts' | 'drinks';
  // ingredients: {
  //   en: string[];
  //   am: string[];
  // };
  image: string;
  isAvailable: boolean;
  imageUrl:string
  // Optional UI and meta fields
  isNew?: boolean;
  isHot?: boolean;
  discount?: number;
  calories?: number;
}

export interface CartItem {
_id: string;
  quantity: number;
  menuItem: MenuItem;
}

export interface Order {
  serviceType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  phoneNumber: string;
  items: CartItem[];
  total: number;
  timestamp: string;
}

export type Language = 'en' | 'am';
export type Theme = 'light' | 'dark';
export type ServiceType = 'dine-in' | 'takeaway' | 'delivery';