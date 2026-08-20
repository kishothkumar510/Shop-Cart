import bcrypt from 'bcryptjs';
import { Product, PromoCode, Order, TransactionLog, CartItem, User } from '../src/types';

// In-Memory Database store with atomic transaction support
interface UserRecord extends User {
  passwordHash: string;
}

export interface DatabaseState {
  users: Map<string, UserRecord>;
  products: Map<string, Product>;
  userCarts: Map<string, CartItem[]>;
  orders: Map<string, Order>;
  promoCodes: Map<string, PromoCode>;
  logs: TransactionLog[];
}

export const db: DatabaseState = {
  users: new Map(),
  products: new Map(),
  userCarts: new Map(),
  orders: new Map(),
  promoCodes: new Map(),
  logs: []
};

export function logTransaction(
  type: TransactionLog['type'],
  status: TransactionLog['status'],
  details: string,
  userId?: string,
  metadata?: Record<string, unknown>
): TransactionLog {
  const log: TransactionLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    status,
    details,
    userId,
    metadata
  };
  db.logs.unshift(log);
  if (db.logs.length > 150) {
    db.logs.pop();
  }
  return log;
}

export async function initializeDatabase() {
  db.users.clear();
  db.products.clear();
  db.userCarts.clear();
  db.orders.clear();
  db.promoCodes.clear();
  db.logs = [];

  // Seed default demo users with bcrypt hashed passwords (salt rounds: 10)
  const salt = await bcrypt.genSalt(10);
  const customerPasswordHash = await bcrypt.hash('Password123!', salt);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', salt);

  const demoCustomer: UserRecord = {
    id: 'usr_cust_in_101',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    role: 'customer',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    phone: '+91 98201 44521',
    passwordHash: customerPasswordHash,
    defaultAddress: {
      fullName: 'Rahul Sharma',
      street: 'Flat 402, Sai Heritage Apartments, Linking Road',
      apartment: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India',
      phone: '+91 98201 44521'
    }
  };

  const demoAdmin: UserRecord = {
    id: 'usr_admin_in_001',
    name: 'ShopCart Admin Ops',
    email: 'admin@shopcart.in',
    role: 'admin',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    phone: '+91 80 4019 8800',
    passwordHash: adminPasswordHash,
    defaultAddress: {
      fullName: 'ShopCart Logistics Hub',
      street: 'Tower B, Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560103',
      country: 'India',
      phone: '+91 80 4019 8800'
    }
  };

  // User personal account pre-seeded for quick login
  const userAccount: UserRecord = {
    id: 'usr_kishoth_510',
    name: 'Kishoth Kumar',
    email: 'rkishothkumar510@gmail.com',
    role: 'customer',
    createdAt: new Date().toISOString(),
    phone: '+91 98765 43210',
    passwordHash: customerPasswordHash,
    defaultAddress: {
      fullName: 'Kishoth Kumar',
      street: '402, Lotus Residency, 12th Main Road',
      apartment: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'India',
      phone: '+91 98765 43210'
    }
  };

  // Backward compatibility alias demo account
  const legacyCustomer: UserRecord = {
    ...demoCustomer,
    id: 'usr_cust_alex_001',
    name: 'Rahul Sharma',
    email: 'alex.customer@example.com'
  };

  const legacyAdmin: UserRecord = {
    ...demoAdmin,
    id: 'usr_admin_store_001',
    email: 'admin@store.io'
  };

  db.users.set(demoCustomer.email.toLowerCase(), demoCustomer);
  db.users.set(demoAdmin.email.toLowerCase(), demoAdmin);
  db.users.set(userAccount.email.toLowerCase(), userAccount);
  db.users.set(legacyCustomer.email.toLowerCase(), legacyCustomer);
  db.users.set(legacyAdmin.email.toLowerCase(), legacyAdmin);

  // Seed curated Indian Home Appliances & Grocery Catalog in Indian Rupees (₹)
  const initialProducts: Product[] = [
    // HOME APPLIANCES
    {
      id: 'app_inverter_ac',
      name: 'Voltex AI Inverter 1.5 Ton 5-Star Split AC',
      tagline: 'Copper condenser with PM 2.5 air purification & 4-way swing',
      description: 'Engineered for extreme Indian summers (up to 54°C). Features 100% inner grooved copper tubes, AI dual inverter compressor, 5-in-1 convertible cooling modes, and stabilizer-free operation (140V-280V).',
      price: 36990,
      compareAtPrice: 48990,
      category: 'appliances',
      stock: 12,
      sku: 'SKU-APP-AC501',
      rating: 4.8,
      reviewCount: 234,
      imageUrl: 'https://images.unsplash.com/photo-1618944847823-28c0b561c28c?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit (Indoor + Outdoor)',
      features: [
        '5-Star BEE Energy Rating (Annual Electricity: 780 kWh)',
        '4-in-1 Convertible Super-Cooling Modes',
        'Anti-Corrosion Blue Fin Coating for coastal durability',
        'PM 2.5 & HD Dust Micro-Filter'
      ],
      specs: {
        'Cooling Capacity': '5050 Watts (1.5 Ton)',
        'Noise Level': '26 dB Ultra-Quiet',
        'Refrigerant': 'Eco-friendly R32 Gas',
        'Warranty': '1 Year Comprehensive, 10 Years Compressor'
      },
      isFeatured: true
    },
    {
      id: 'app_front_load_wm',
      name: 'HydroClean 8kg Front Load Smart Washing Machine',
      tagline: 'Steam wash allergen care with Direct Drive Inverter motor',
      description: 'Intelligent AI DD fabric sensing, 14 wash programs with in-built heater, 99.9% virus reduction steam wash, and 1400 RPM spin speed for fast drying during monsoon seasons.',
      price: 28490,
      compareAtPrice: 35990,
      category: 'appliances',
      stock: 8,
      sku: 'SKU-APP-WM802',
      rating: 4.9,
      reviewCount: 189,
      imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit',
      features: [
        'AI Direct Drive Motor with 6-motion drum movements',
        'In-built water heater (up to 90°C hygiene wash)',
        'Tough Stainless Steel Drum with child safety lock',
        '5-Star BEE Certified Water & Energy Saver'
      ],
      specs: {
        'Capacity': '8.0 Kg (Family of 4-6)',
        'Spin Speed': '1400 RPM',
        'Water Pressure': '0.3 to 10 bar compatibility',
        'Warranty': '2 Years on Product, 10 Years on Motor'
      },
      isFeatured: true
    },
    {
      id: 'app_smart_tv_55',
      name: 'VisionPro 55" 4K Ultra HD Smart QLED TV',
      tagline: 'Dolby Vision Atmos, 120Hz MEMC with Google TV & Voice Assistant',
      description: 'Stunning Quantum Dot color reproduction with 1000 nits peak brightness, hands-free far-field voice control, 40W soundbar-grade stereo speakers, and seamless OTT streaming apps.',
      price: 32990,
      compareAtPrice: 44990,
      category: 'electronics',
      stock: 15,
      sku: 'SKU-ELE-TV550',
      rating: 4.7,
      reviewCount: 312,
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit with Wall Mount Kit',
      features: [
        '4K Quantum Dot Display with HDR10+ & Dolby Vision',
        '40W Sound Output with Dolby Atmos Surround',
        'Google TV with personalized Indian regional content profiles',
        '3 HDMI 2.1 ports, 2 USB ports & Dual Band Wi-Fi'
      ],
      specs: {
        'Screen Size': '55 Inch (139 cm)',
        'Resolution': '3840 x 2160 Pixels (4K UHD)',
        'Refresh Rate': '60Hz / 120Hz MEMC',
        'Warranty': '1 Year Comprehensive + 1 Year Panel'
      },
      isFeatured: true
    },
    {
      id: 'app_convection_microwave',
      name: 'ChefMaster 28L Convection Microwave Oven',
      tagline: 'Tandoor baking, curd maker & auto-cook Indian recipes',
      description: 'Versatile cooking with baking, grilling, reheating, and defrosting. Features ceramic enamel cavity (scratch resistant & antibacterial), fermentation mode for homemade yogurt, and 125 Indian preset menus.',
      price: 11490,
      compareAtPrice: 15990,
      category: 'kitchen',
      stock: 14,
      sku: 'SKU-KIT-MW280',
      rating: 4.8,
      reviewCount: 97,
      imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit with Starter Kit',
      features: [
        '28 Litre Capacity for medium to large families',
        'Ceramic Enamel Cavity with 10 Year cavity warranty',
        'Tandoor & Crusty Plate for authentic crispy naans & tikkas',
        'Slim Fry technology for oil-free snacks'
      ],
      specs: {
        'Power Output': '900W Microwave / 1500W Grill / 2100W Convection',
        'Cavity': 'Ceramic Enamel Anti-bacterial',
        'Weight': '16.5 Kg'
      }
    },
    {
      id: 'app_mixer_grinder',
      name: 'TurboGrind 750W Heavy Duty Mixer Grinder (4 Jars)',
      tagline: 'Pure copper armature motor with Flow-Breaker stainless jars',
      description: 'Crush tough spices, turmeric roots, and smooth idli/dosa batter in minutes. Includes 1.5L wet jar, 1.25L multipurpose jar, 0.5L chutney jar, and 1.75L fruit juicer jar with extractor mesh.',
      price: 3299,
      compareAtPrice: 4999,
      category: 'kitchen',
      stock: 24,
      sku: 'SKU-KIT-MG750',
      rating: 4.9,
      reviewCount: 420,
      imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
      unit: '1 Machine + 4 Jars',
      features: [
        '100% Pure Copper 750-Watt Motor (20,000 RPM)',
        '304 High-Grade Stainless Steel Heavy Gauge Jars',
        'Tri-Blade technology for ultra-fine dry masala grinding',
        'Overload protector switch with reset button'
      ],
      specs: {
        'Wattage': '750 Watts',
        'Speeds': '3 Speed Control + Pulse Function',
        'Warranty': '2 Years on Product, 5 Years on Motor'
      },
      isFeatured: true
    },
    {
      id: 'app_digital_air_fryer',
      name: 'AeroCrisp Pro 4.5L Digital Touch Air Fryer',
      tagline: 'Rapid 360° air circulation with 85% less oil snacking',
      description: 'Cook samosas, french fries, paneer tikka, and roasted nuts with crispy golden texture and minimal oil. Touchscreen panel with 8 pre-programmed Indian cooking presets.',
      price: 4499,
      compareAtPrice: 6999,
      category: 'kitchen',
      stock: 18,
      sku: 'SKU-KIT-AF450',
      rating: 4.8,
      reviewCount: 165,
      imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit with Recipe Book',
      features: [
        '4.5L Non-stick Teflon-free food basket',
        'Rapid TurboAir 360° technology with 1400W heating element',
        'Adjustable temperature 80°C to 200°C with 60-min timer',
        'Dishwasher-safe removable basket with cool-touch handle'
      ],
      specs: {
        'Capacity': '4.5 Litres',
        'Power': '1400 Watts',
        'Timer': 'Auto-Shutoff 60 Minutes'
      }
    },
    {
      id: 'app_induction_cooktop',
      name: 'VedicFlame 2000W Touch Induction Cooktop',
      tagline: 'Automatic voltage regulator with customized Indian cooking menus',
      description: 'Energy-efficient flameless cooking. Features Indian menu modes (Roti/Dosa, Milk Boil, Pressure Cook, Deep Fry, Idli), crystal glass surface, and auto-pan detection.',
      price: 1899,
      compareAtPrice: 2899,
      category: 'kitchen',
      stock: 22,
      sku: 'SKU-KIT-IC200',
      rating: 4.6,
      reviewCount: 145,
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
      unit: '1 Unit',
      features: [
        '2000 Watts Fast Heating with 8 power levels',
        'Indian Menu Presets: Chapati, Dosa, Curry, Milk Boiling',
        'Anti-magnetic micro-crystal glass top plate',
        'Built-in dual surge and voltage fluctuation protection'
      ],
      specs: {
        'Power': '2000 Watts',
        'Cord Length': '1.2 meters',
        'Warranty': '1 Year Comprehensive'
      }
    },

    // GROCERY & STAPLES
    {
      id: 'groc_basmati_rice_5kg',
      name: 'Royal Heritage 2-Year Aged Extra Long Basmati Rice (5 Kg)',
      tagline: 'Naturally aged Himalayan grains with aromatic sweet flavor',
      description: 'Elongates to double its raw size after cooking (up to 24mm length). Non-sticky, fluffy texture ideal for authentic Biryanis, Pulao, and daily royal meals.',
      price: 649,
      compareAtPrice: 799,
      category: 'grocery',
      stock: 45,
      sku: 'SKU-GRO-BR5KG',
      rating: 4.9,
      reviewCount: 520,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      unit: '5 Kg Bag',
      features: [
        '2-Year Natural Aging in temperature-controlled grain silos',
        'Pearl white slender grains with rich natural aroma',
        '100% Sortex Cleaned & pesticide-tested quality',
        'Zero artificial fragrance or polishing chemicals'
      ],
      specs: {
        'Net Weight': '5 Kilograms',
        'Grain Type': '1121 XXL Grain Basmati',
        'Shelf Life': '24 Months'
      },
      isFeatured: true
    },
    {
      id: 'groc_cow_ghee_1l',
      name: 'Vedic Farms Pure Desi Cow Ghee (1 Litre)',
      tagline: 'Traditional Bilona churned golden aromatic ghee in glass jar',
      description: 'Crafted from pure grass-fed cow milk using traditional slow-cooking methods. Rich granular (Danedar) golden texture with divine aroma, perfect for tadkas, rotis, and sweets.',
      price: 699,
      compareAtPrice: 850,
      category: 'grocery',
      stock: 35,
      sku: 'SKU-GRO-GH1L',
      rating: 5.0,
      reviewCount: 388,
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop&q=80',
      unit: '1 Litre Glass Jar',
      features: [
        '100% Pure Cow Ghee with rich natural beta-carotene',
        'Danedar granular texture with heavenly aroma',
        'Zero preservatives, additives, or palm oil adulteration',
        'Packed in food-grade recyclable glass jar'
      ],
      specs: {
        'Net Volume': '1 Litre (905g)',
        'Container': 'Glass Jar with tamper-evident seal',
        'Diet Type': 'Vegetarian'
      },
      isFeatured: true
    },
    {
      id: 'groc_mustard_oil_5l',
      name: 'Kachi Ghani Cold-Pressed Pure Mustard Oil (5 Litre Can)',
      tagline: 'First-press pungent mustard oil rich in natural Omega-3',
      description: 'Cold pressed using traditional Kolhu wooden expellers without chemical solvents. Imparts authentic pungent zest to North and East Indian curries, pickles, and stir fries.',
      price: 890,
      compareAtPrice: 1050,
      category: 'grocery',
      stock: 28,
      sku: 'SKU-GRO-MO5L',
      rating: 4.8,
      reviewCount: 215,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      unit: '5 Litres Tin Can',
      features: [
        'Cold-pressed Kachi Ghani extraction preserves natural nutrients',
        'Rich in Omega-3 and Monounsaturated Fatty Acids (MUFA)',
        'Strong natural pungency and golden clarity',
        'Ideal for cooking and traditional Indian pickles'
      ],
      specs: {
        'Volume': '5 Litres',
        'Packaging': 'Food Grade Leak-Proof Metal Can',
        'Shelf Life': '12 Months'
      }
    },
    {
      id: 'groc_sharbati_atta_10kg',
      name: 'FarmFresh 100% Sharbati Whole Wheat Atta (10 Kg)',
      tagline: 'Stone-ground MP Sehore wheat for soft fluffy rotis all day',
      description: 'Made from sun-golden Sharbati wheat grains from Madhya Pradesh. High water absorption capacity ensures rotis stay soft, moist, and puffed for up to 8 hours.',
      price: 489,
      compareAtPrice: 560,
      category: 'grocery',
      stock: 40,
      sku: 'SKU-GRO-AT10KG',
      rating: 4.9,
      reviewCount: 460,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      unit: '10 Kg Bag',
      features: [
        '100% Whole Wheat with Zero Maida addition',
        'Traditional slow Chakki grinding keeps natural bran & dietary fiber',
        'High moisture retention for pillow-soft rotis',
        'Source of natural Vitamin B, Iron, and Fiber'
      ],
      specs: {
        'Net Weight': '10 Kilograms',
        'Source': 'MP Sehore Sharbati Wheat',
        'Shelf Life': '4 Months from packaging'
      }
    },
    {
      id: 'groc_almonds_cashews_combo',
      name: 'NutriKing California Almonds & Goan Cashews Combo (1 Kg)',
      tagline: 'Jumbo whole dry fruits packed with protein and crunch',
      description: 'Hand-sorted premium dry fruits combo pack containing 500g crunchy California Badam and 500g sweet W240 whole Kaju. Vacuum nitrogen flushed for long-lasting freshness.',
      price: 949,
      compareAtPrice: 1299,
      category: 'grocery',
      stock: 32,
      sku: 'SKU-GRO-DF1KG',
      rating: 4.9,
      reviewCount: 275,
      imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&auto=format&fit=crop&q=80',
      unit: '1 Kg (500g + 500g Zipper Pouches)',
      features: [
        '500g Premium Grade California Badam',
        '500g Whole Goan W240 Cashews (Kaju)',
        'Resealable zip-lock pouches to lock in crunch',
        'Rich in heart-healthy unsaturated fats & Vitamin E'
      ],
      specs: {
        'Net Weight': '1000g (1 Kg Total)',
        'Storage': 'Store in cool, dry place / airtight container',
        'Shelf Life': '9 Months'
      }
    },
    {
      id: 'groc_assam_tea_1kg',
      name: 'MountainMist Royal Assam Gold CTC Tea (1 Kg)',
      tagline: 'Rich robust liquor with aromatic secondary long leaves',
      description: 'Carefully blended from high-grown Assam tea estates in Upper Brahmaputra valley. Gives kadak golden liquor, brisk malty taste, and rejuvenating morning aroma with milk.',
      price: 499,
      compareAtPrice: 620,
      category: 'grocery',
      stock: 3, // Low stock intentionally to test stock limiter
      sku: 'SKU-GRO-TEA1KG',
      rating: 4.8,
      reviewCount: 310,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      unit: '1 Kg Jar Pack',
      features: [
        '100% Upper Assam Estate Second Flush CTC granules',
        'Infused with 15% handcrafted whole golden orthodox leaf tips',
        'Creates rich aromatic Kadak Chai with deep amber liquor',
        'Sealed in airtight pet jar to preserve garden freshness'
      ],
      specs: {
        'Net Weight': '1 Kilogram',
        'Type': 'CTC + Orthodox Blend',
        'Shelf Life': '18 Months'
      }
    },
    {
      id: 'groc_dal_combo_2kg',
      name: 'Organic Desi Toor Dal & Yellow Moong Dal Combo (2 Kg)',
      tagline: 'Unpolished protein-rich pulses with quick cooking time',
      description: 'Chemical-free unpolished dals sourced from organic certified farmers. Retains natural dietary fibers, micro-nutrients, and rich earthy taste without artificial water-polishing.',
      price: 349,
      compareAtPrice: 420,
      category: 'grocery',
      stock: 50,
      sku: 'SKU-GRO-DAL2KG',
      rating: 4.7,
      reviewCount: 180,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      unit: '2 Kg (1kg Toor + 1kg Moong)',
      features: [
        '100% Unpolished naturally sun-dried dals',
        'High protein content (24g per 100g serving)',
        'Easy to digest and cooks smoothly in pressure cooker',
        'Hygienically sorted and vacuum packed'
      ],
      specs: {
        'Net Weight': '2 Kilograms',
        'Contents': '1 Kg Toor Dal + 1 Kg Yellow Moong Dal'
      }
    },
    {
      id: 'groc_spices_box',
      name: 'PureSpices Royal 5-in-1 Indian Whole Spice Box (500g)',
      tagline: 'Single-origin Alleppey Cardamom, Malabar Pepper, Clove, Cinnamon & Cumin',
      description: 'Hand-picked aromatic spices directly from Kerala and Rajasthan plantations. Strong essential oil content delivers rich fragrant flavors to curries, biryanis, and garam masalas.',
      price: 599,
      compareAtPrice: 799,
      category: 'daily_essentials',
      stock: 20,
      sku: 'SKU-GRO-SPC500',
      rating: 4.9,
      reviewCount: 140,
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
      unit: '500g Spice Box',
      features: [
        '8mm Jumbo Alleppey Green Cardamom (Elaichi)',
        'Bold Tellicherry Black Pepper & Zanzibar Cloves',
        'Cassia-free Ceylon True Cinnamon sticks',
        'Aromatic Rajasthani Jeera (Cumin Seeds)'
      ],
      specs: {
        'Net Weight': '500 Grams (100g each x 5 compartments)',
        'Packaging': 'Airtight Masala Spice Box Included'
      }
    }
  ];

  initialProducts.forEach(p => db.products.set(p.id, p));

  // Seed Indian Rupee Promo Codes
  const promoCodes: PromoCode[] = [
    {
      code: 'SHOP200',
      discountType: 'fixed',
      discountValue: 200,
      minSpend: 999,
      description: '₹200 Instant Off on orders above ₹999'
    },
    {
      code: 'GROCERY15',
      discountType: 'percentage',
      discountValue: 15,
      minSpend: 499,
      description: '15% Off on daily groceries & staples'
    },
    {
      code: 'APPLIANCE1000',
      discountType: 'fixed',
      discountValue: 1000,
      minSpend: 9999,
      description: '₹1,000 Flat Off on Home Appliances above ₹9,999'
    },
    {
      code: 'FREESHIP',
      discountType: 'fixed',
      discountValue: 49,
      description: 'Free Express Delivery across India'
    }
  ];

  promoCodes.forEach(p => db.promoCodes.set(p.code.toUpperCase(), p));

  // Seed one historical order for Rahul in INR
  const sampleOrder: Order = {
    id: 'ORD-IN-784920',
    userId: demoCustomer.id,
    userEmail: demoCustomer.email,
    userName: demoCustomer.name,
    items: [
      {
        productId: 'app_mixer_grinder',
        name: 'TurboGrind 750W Heavy Duty Mixer Grinder (4 Jars)',
        sku: 'SKU-KIT-MG750',
        quantity: 1,
        price: 3299,
        imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80'
      },
      {
        productId: 'groc_basmati_rice_5kg',
        name: 'Royal Heritage 2-Year Aged Extra Long Basmati Rice (5 Kg)',
        sku: 'SKU-GRO-BR5KG',
        quantity: 1,
        price: 649,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 3948,
    discount: 200,
    shipping: 0,
    tax: 187.4,
    total: 3935.4,
    promoCode: 'SHOP200',
    shippingAddress: demoCustomer.defaultAddress!,
    shippingMethod: {
      id: 'ship_standard',
      name: 'Fast Courier Ground (Free over ₹499)',
      price: 0,
      estimatedDelivery: 'Delivered in Mumbai'
    },
    payment: {
      transactionId: 'txn_sbx_in_994827103859',
      paymentMethod: 'RuPay / Visa •••• 4242',
      cardLast4: '4242',
      status: 'succeeded',
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      gateway: 'Stripe Sandbox Engine v2.4',
      fingerprint: 'fp_sim_in_892348a87b1c'
    },
    status: 'delivered',
    trackingNumber: 'DELHIVERY-IN-9938102948',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  };

  db.orders.set(sampleOrder.id, sampleOrder);

  // Seed sample cart item for Rahul
  db.userCarts.set(demoCustomer.id, [
    {
      productId: 'groc_cow_ghee_1l',
      quantity: 1,
      price: 699,
      product: db.products.get('groc_cow_ghee_1l')!
    }
  ]);

  logTransaction('auth', 'success', 'ShopCart database initialized with Indian Home Appliances, Groceries, and ₹ INR pricing.', 'system');
}
