export interface RentalItem {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  images: string[];
  location: string;
  rating: number;
  reviewCount: number;
  category: string;
  owner: {
    name: string;
    avatar: string;
    memberSince: string;
  };
  features: string[];
  availability: boolean;
}

export const mockItems: RentalItem[] = [
  {
    id: "1",
    title: "Professional DSLR Camera Kit",
    description: "Canon EOS R5 with 24-70mm f/2.8 lens, perfect for photography enthusiasts and professionals. Includes extra batteries, memory cards, and a protective case.",
    price: 75,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
    ],
    location: "San Francisco, CA",
    rating: 4.9,
    reviewCount: 47,
    category: "Electronics",
    owner: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      memberSince: "2022",
    },
    features: ["4K Video", "45MP Sensor", "In-body Stabilization", "Dual Card Slots"],
    availability: true,
  },
  {
    id: "2",
    title: "Electric Mountain Bike",
    description: "High-performance e-bike with 500W motor and 50-mile range. Perfect for trail riding or commuting. Includes helmet and lock.",
    price: 45,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
    ],
    location: "Portland, OR",
    rating: 4.7,
    reviewCount: 23,
    category: "Sports",
    owner: {
      name: "Jordan Mills",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
      memberSince: "2023",
    },
    features: ["500W Motor", "50-mile Range", "Hydraulic Brakes", "Full Suspension"],
    availability: true,
  },
  {
    id: "3",
    title: "Professional Power Drill Set",
    description: "DeWalt 20V MAX drill kit with complete accessory set. Includes charger, two batteries, and over 100 drill bits and accessories.",
    price: 25,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",
    ],
    location: "Austin, TX",
    rating: 4.8,
    reviewCount: 89,
    category: "Tools",
    owner: {
      name: "Mike Roberts",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
      memberSince: "2021",
    },
    features: ["20V Brushless", "2 Batteries", "100+ Accessories", "Carrying Case"],
    availability: true,
  },
  {
    id: "4",
    title: "4-Person Camping Tent",
    description: "Spacious waterproof tent perfect for family camping. Easy setup in under 5 minutes. Includes ground mat and carrying bag.",
    price: 30,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    ],
    location: "Denver, CO",
    rating: 4.6,
    reviewCount: 34,
    category: "Outdoor",
    owner: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
      memberSince: "2022",
    },
    features: ["Waterproof", "4-Person", "Easy Setup", "Ventilated"],
    availability: true,
  },
  {
    id: "5",
    title: "DJ Equipment Bundle",
    description: "Complete DJ setup with Pioneer DDJ controller, studio monitors, and headphones. Perfect for parties and events.",
    price: 120,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1571935441003-93cdc0c13e49?w=800&q=80",
    ],
    location: "Los Angeles, CA",
    rating: 4.9,
    reviewCount: 56,
    category: "Electronics",
    owner: {
      name: "Chris Taylor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      memberSince: "2020",
    },
    features: ["Pioneer DDJ-1000", "KRK Monitors", "Pro Headphones", "All Cables"],
    availability: true,
  },
  {
    id: "6",
    title: "Vintage Film Projector",
    description: "Beautiful working 16mm film projector, perfect for film nights or events. Includes a selection of classic short films.",
    price: 60,
    priceUnit: "day",
    images: [
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    ],
    location: "Brooklyn, NY",
    rating: 4.5,
    reviewCount: 12,
    category: "Entertainment",
    owner: {
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
      memberSince: "2021",
    },
    features: ["16mm Compatible", "Restored", "Includes Films", "Quiet Operation"],
    availability: true,
  },
];

export const categories = [
  "All",
  "Electronics",
  "Sports",
  "Tools",
  "Outdoor",
  "Entertainment",
  "Vehicles",
  "Party",
];
