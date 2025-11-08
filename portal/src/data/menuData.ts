import { MenuItem } from '../types';

export const menuData: MenuItem[] = [
  // Appetizers
  {
    id: 'app1',
    name: {
      en: 'Ethiopian Samosa',
      am: 'የኢትዮጵያ ሳሞሳ'
    },
    description: {
      en: 'Crispy pastry filled with spiced lentils and vegetables',
      am: 'በቅመም የተጣመሩ ምስር እና አትክልት የተሞሉ ጥራጊ ሸክላ'
    },
    price: 45,
    category: 'appetizers',
    ingredients: {
      en: ['Lentils', 'Onions', 'Garlic', 'Berbere', 'Pastry'],
      am: ['ምስር', 'ሽንኩርት', 'ነጭ ሽንኩርት', 'በርበሬ', 'ሸክላ']
    },
    image: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg',
    available: true
  },
  {
    id: 'app2',
    name: {
      en: 'Tomato Salad',
      am: 'የቲማቲም ሰላጣ'
    },
    description: {
      en: 'Fresh tomatoes with onions and Ethiopian herbs',
      am: 'ትኩስ ቲማቲም ከሽንኩርት እና ከኢትዮጵያ ቅጠላ ቅጠሎች ጋር'
    },
    price: 35,
    category: 'appetizers',
    ingredients: {
      en: ['Tomatoes', 'Red Onions', 'Jalapeños', 'Olive Oil', 'Herbs'],
      am: ['ቲማቲም', 'ቀይ ሽንኩርት', 'ቃሪያ', 'የወይራ ዘይት', 'ቅጠላ ቅጠሎች']
    },
    image: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg',
    available: true
  },
  {
    id: 'app3',
    name: {
      en: 'Meat Rolls',
      am: 'የስጋ ጥቅልሎች'
    },
    description: {
      en: 'Seasoned ground meat wrapped in thin bread',
      am: 'በቅመም የተጣመረ የተፈጨ ስጋ በቀጭን ዳቦ ውስጥ'
    },
    price: 65,
    category: 'appetizers',
    ingredients: {
      en: ['Ground Beef', 'Onions', 'Spices', 'Thin Bread', 'Oil'],
      am: ['የተፈጨ የበሬ ስጋ', 'ሽንኩርት', 'ቅመማ ቅመሞች', 'ቀጭን ዳቦ', 'ዘይት']
    },
    image: 'https://images.pexels.com/photos/5419336/pexels-photo-5419336.jpeg',
    available: true
  },

  // Main Courses
  {
    id: 'main1',
    name: {
      en: 'Doro Wot',
      am: 'ዶሮ ወጥ'
    },
    description: {
      en: 'Traditional Ethiopian chicken stew with hard-boiled eggs',
      am: 'ባህላዊ የኢትዮጵያ የዶሮ ወጥ ከቀላ እንቁላሎች ጋር'
    },
    price: 180,
    category: 'main-courses',
    ingredients: {
      en: ['Chicken', 'Hard-boiled Eggs', 'Berbere', 'Onions', 'Garlic', 'Ginger'],
      am: ['ዶሮ', 'ቀላ እንቁላል', 'በርበሬ', 'ሽንኩርት', 'ነጭ ሽንኩርት', 'ዝንጅብል']
    },
    image: 'https://images.pexels.com/photos/5949892/pexels-photo-5949892.jpeg',
    available: true
  },
  {
    id: 'main2',
    name: {
      en: 'Kitfo',
      am: 'ክትፎ'
    },
    description: {
      en: 'Ethiopian-style steak tartare served with traditional sides',
      am: 'በኢትዮጵያ አይነት የጥሬ ስጋ ምግብ ከባህላዊ ጎዳናዎች ጋር'
    },
    price: 220,
    category: 'main-courses',
    ingredients: {
      en: ['Raw Beef', 'Mitmita', 'Clarified Butter', 'Collard Greens', 'Cottage Cheese'],
      am: ['ጥሬ የበሬ ስጋ', 'ሚጥሚጣ', 'ንጹህ ቅቤ', 'ጎመን', 'አይብ']
    },
    image: 'https://images.pexels.com/photos/7625029/pexels-photo-7625029.jpeg',
    available: true
  },
  {
    id: 'main3',
    name: {
      en: 'Vegetarian Combo',
      am: 'የአትክልት ኮምቦ'
    },
    description: {
      en: 'Assorted vegetarian dishes served on injera',
      am: 'በእንጀራ ላይ የተቀመጡ የተለያዩ የአትክልት ምግቦች'
    },
    price: 150,
    category: 'main-courses',
    ingredients: {
      en: ['Injera', 'Lentils', 'Cabbage', 'Collard Greens', 'Split Peas', 'Potatoes'],
      am: ['እንጀራ', 'ምስር', 'ጎመን ሙላ', 'ጎመን', 'ኣተር', 'ድንች']
    },
    image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
    available: true
  },
  {
    id: 'main4',
    name: {
      en: 'Beef Tibs',
      am: 'የበሬ ጥብስ'
    },
    description: {
      en: 'Sautéed beef with onions and jalapeños',
      am: 'ከሽንኩርት እና ከቃሪያ ጋር የተጠበሰ የበሬ ስጋ'
    },
    price: 200,
    category: 'main-courses',
    ingredients: {
      en: ['Beef', 'Onions', 'Jalapeños', 'Rosemary', 'Garlic', 'Tomatoes'],
      am: ['የበሬ ስጋ', 'ሽንኩርት', 'ቃሪያ', 'የሮዝማሪ', 'ነጭ ሽንኩርት', 'ቲማቲም']
    },
    image: 'https://images.pexels.com/photos/3992204/pexels-photo-3992204.jpeg',
    available: true
  },

  // Desserts
  {
    id: 'des1',
    name: {
      en: 'Honey Wine Cake',
      am: 'የማር ወይን ኬክ'
    },
    description: {
      en: 'Traditional cake made with honey wine and spices',
      am: 'ከማር ወይን እና ከቅመማ ቅመሞች የተሰራ ባህላዊ ኬክ'
    },
    price: 75,
    category: 'desserts',
    ingredients: {
      en: ['Flour', 'Honey Wine', 'Sugar', 'Eggs', 'Cinnamon', 'Cardamom'],
      am: ['ዱቄት', 'የማር ወይን', 'ስኳር', 'እንቁላል', 'ቀርፋ', 'ኤላፋ']
    },
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg',
    available: true
  },
  {
    id: 'des2',
    name: {
      en: 'Fruit Salad',
      am: 'የፍራፍሬ ሰላጣ'
    },
    description: {
      en: 'Fresh seasonal fruits with honey dressing',
      am: 'ትኩስ የወቅት ፍራፍሬዎች ከማር መለበሻ ጋር'
    },
    price: 50,
    category: 'desserts',
    ingredients: {
      en: ['Mango', 'Papaya', 'Banana', 'Orange', 'Honey', 'Lemon Juice'],
      am: ['ማንጎ', 'ፓፓያ', 'ሙዝ', 'ብርትኳን', 'ማር', 'የሎሚ ጭማቂ']
    },
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    available: true
  },

  // Drinks
  {
    id: 'drink1',
    name: {
      en: 'Ethiopian Coffee',
      am: 'የኢትዮጵያ ቡና'
    },
    description: {
      en: 'Freshly roasted and brewed Ethiopian coffee',
      am: 'በትኩሳት የተጠበሰ እና የተደፈረ የኢትዮጵያ ቡና'
    },
    price: 30,
    category: 'drinks',
    ingredients: {
      en: ['Ethiopian Coffee Beans', 'Sugar (optional)'],
      am: ['የኢትዮጵያ ቡና ፍሬ', 'ስኳር (አማራጭ)']
    },
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
    available: true
  },
  {
    id: 'drink2',
    name: {
      en: 'Tej (Honey Wine)',
      am: 'ተጅ'
    },
    description: {
      en: 'Traditional Ethiopian fermented honey wine',
      am: 'ባህላዊ የኢትዮጵያ የተፈላ የማር ወይን'
    },
    price: 85,
    category: 'drinks',
    ingredients: {
      en: ['Honey', 'Water', 'Gesho (Hops)', 'Time'],
      am: ['ማር', 'ውሃ', 'ገሾ', 'ጊዜ']
    },
    image: 'https://images.pexels.com/photos/5946966/pexels-photo-5946966.jpeg',
    available: true
  },
  {
    id: 'drink3',
    name: {
      en: 'Fresh Juice',
      am: 'ትኩስ ጭማቂ'
    },
    description: {
      en: 'Freshly squeezed seasonal fruit juice',
      am: 'በትኩሳት የተጨማለቀ የወቅት ፍራፍሬ ጭማቂ'
    },
    price: 40,
    category: 'drinks',
    ingredients: {
      en: ['Seasonal Fruits', 'Ice', 'Sugar (optional)'],
      am: ['የወቅት ፍራፍሬዎች', 'በረድ', 'ስኳር (አማራጭ)']
    },
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
    available: true
  },
  {
    id: 'drink4',
    name: {
      en: 'Soft Drinks',
      am: 'ለስላሳ መጠጦች'
    },
    description: {
      en: 'Assorted carbonated beverages',
      am: 'የተለያዩ ካርቦኔት መጠጦች'
    },
    price: 25,
    category: 'drinks',
    ingredients: {
      en: ['Carbonated Water', 'Flavoring', 'Sugar'],
      am: ['ካርቦኔት ውሃ', 'ጣዕም ሰጪ', 'ስኳር']
    },
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg',
    available: true
  }
];