import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

const bannersData = [
  {
    id: "banner-1",
    title: "Super Saver Grocery Deals!",
    sub: "Flat 50% Off on Fresh Fruits & Dairy Products",
    icon: "🥑",
    bg: "from-emerald-500 to-teal-600",
    tag: "Monsoon Sale",
    order: 1
  },
  {
    id: "banner-2",
    title: "Ice Creams & Cold Drinks",
    sub: "Beating the heat? Delivered in 10 minutes",
    icon: "🍦",
    bg: "from-blue-500 to-indigo-650",
    tag: "Summer Special",
    order: 2
  },
  {
    id: "banner-3",
    title: "Munchies & Snack Fest",
    sub: "Buy 2 Get 1 Free on Select Brand Crisps",
    icon: "🍿",
    bg: "from-amber-500 to-rose-600",
    tag: "Snack Time",
    order: 3
  }
];

const categoriesData = [
  { id: "cat-1", name: 'Fruits & Veggies', color: 'bg-emerald-50 text-emerald-700', icon: '🥦', order: 1 },
  { id: "cat-2", name: 'Dairy & Bread', color: 'bg-blue-50 text-blue-700', icon: '🥛', order: 2 },
  { id: "cat-3", name: 'Snacks & Crisps', color: 'bg-amber-50 text-amber-700', icon: '🍟', order: 3 },
  { id: "cat-4", name: 'Cold Drinks', color: 'bg-red-50 text-red-700', icon: '🥤', order: 4 },
  { id: "cat-5", name: 'Bakery Items', color: 'bg-pink-50 text-pink-700', icon: '🍞', order: 5 },
  { id: "cat-6", name: 'Instant Foods', color: 'bg-purple-50 text-purple-700', icon: '🍜', order: 6 },
  { id: "cat-7", name: 'Tea & Coffee', color: 'bg-orange-50 text-orange-700', icon: '☕', order: 7 },
  { id: "cat-8", name: 'Home Utilities', color: 'bg-cyan-50 text-cyan-700', icon: '🧼', order: 8 }
];

const productsData = [
  // Best Sellers
  { id: 'prod-bs-1', name: 'Fresh Toned Milk', size: '500 ml', price: 27, originalPrice: 30, icon: '🥛', discount: '10% OFF', isBestSeller: true, isRecommended: false },
  { id: 'prod-bs-2', name: 'Britannia Brown Bread', size: '400 g', price: 42, originalPrice: 50, icon: '🍞', discount: '16% OFF', isBestSeller: true, isRecommended: false },
  { id: 'prod-bs-3', name: 'Amul Salted Butter', size: '100 g', price: 56, originalPrice: 60, icon: '🧈', discount: '6% OFF', isBestSeller: true, isRecommended: false },
  { id: 'prod-bs-4', name: 'Lay\'s Classic Salted', size: '50 g', price: 20, originalPrice: 20, icon: '🍟', discount: 'Best Price', isBestSeller: true, isRecommended: true },
  
  // Recommended
  { id: 'prod-rec-1', name: 'Fresh Country Tomatoes', size: '500 g', price: 34, originalPrice: 45, icon: '🍅', discount: '24% OFF', isBestSeller: false, isRecommended: true },
  { id: 'prod-rec-2', name: 'Coca-Cola Zero Sugar', size: '750 ml', price: 40, originalPrice: 40, icon: '🥤', discount: 'Popular', isBestSeller: false, isRecommended: true },
  { id: 'prod-rec-3', name: 'Oreo Chocolate Biscuits', size: '120 g', price: 30, originalPrice: 35, icon: '🍪', discount: '14% OFF', isBestSeller: false, isRecommended: true },
  { id: 'prod-rec-4', name: 'Farm Fresh White Eggs', size: '6 pcs', price: 48, originalPrice: 55, icon: '🥚', discount: '12% OFF', isBestSeller: false, isRecommended: true }
];

/**
 * Seeds the Firestore database if collections are currently empty.
 * Returns true if seeding occurred, false otherwise.
 */
export const seedDatabase = async (db: Firestore): Promise<boolean> => {
  try {
    // 1. Check if categories collection already has documents
    const catSnap = await getDocs(collection(db, 'categories'));
    if (!catSnap.empty) {
      console.log('Firestore is already seeded.');
      return false; // Skip seeding if data exists
    }

    console.log('Seeding Firestore database with initial Blinkit clone demo data...');
    const batch = writeBatch(db);

    // Seed Banners
    bannersData.forEach((banner) => {
      const docRef = doc(db, 'banners', banner.id);
      batch.set(docRef, banner);
    });

    // Seed Categories
    categoriesData.forEach((cat) => {
      const docRef = doc(db, 'categories', cat.id);
      batch.set(docRef, cat);
    });

    // Seed Products
    productsData.forEach((prod) => {
      const docRef = doc(db, 'products', prod.id);
      batch.set(docRef, prod);
    });

    await batch.commit();
    console.log('Firestore seeding completed successfully.');
    return true;
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
    throw error;
  }
};
