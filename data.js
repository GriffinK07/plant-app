const INITIAL_PLANTS = [
  {
    id: "sample-monstera",
    name: "Monstera",
    species: "Monstera deliciosa",
    interval: 7,
    daysSinceWatered: 8,
    notes: "Likes bright, indirect light. Let the top few centimetres of soil dry before watering.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "sample-snake-plant",
    name: "Snake plant",
    species: "Dracaena trifasciata",
    interval: 14,
    daysSinceWatered: 5,
    notes: "Very forgiving. Keep out of cold drafts and avoid leaving water in the saucer.",
    image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "sample-peace-lily",
    name: "Peace lily",
    species: "Spathiphyllum",
    interval: 5,
    daysSinceWatered: 4,
    notes: "Prefers steady moisture and medium, indirect light. Leaves may droop when thirsty.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85"
  }
];

const SAMPLE_GARDENS = [
  { id: "north-window", name: "North Window Club", location: "Community demo", plants: 8, onSchedule: 7, style: "Leafy indoor mix" },
  { id: "balcony-blooms", name: "Balcony Blooms", location: "Community demo", plants: 12, onSchedule: 9, style: "Sunny container garden" },
  { id: "small-space", name: "Small Space Jungle", location: "Community demo", plants: 5, onSchedule: 5, style: "Low-light favorites" }
];

const SHOP_LISTINGS = [
  {
    id: "rubber-plant",
    name: "Rubber plant",
    species: "Ficus elastica",
    shop: "Foxglove & Fern",
    neighborhood: "Town centre · demo",
    price: 26,
    stock: 3,
    light: "bright",
    interval: 7,
    notes: "Give it bright, indirect light. Let the top of the soil dry between waterings.",
    image: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "zz-plant",
    name: "ZZ plant",
    species: "Zamioculcas zamiifolia",
    shop: "Mosslight Floral",
    neighborhood: "West End · demo",
    price: 22,
    stock: 5,
    light: "low",
    interval: 14,
    notes: "Tolerates lower light and prefers to dry out well between waterings.",
    image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "calathea",
    name: "Calathea",
    species: "Goeppertia orbifolia",
    shop: "The Greenhouse Corner",
    neighborhood: "College Street · demo",
    price: 24,
    stock: 2,
    light: "medium",
    interval: 5,
    notes: "Enjoys medium, indirect light and evenly moist soil. Keep away from cold drafts.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "golden-pothos",
    name: "Golden pothos",
    species: "Epipremnum aureum",
    shop: "Foxglove & Fern",
    neighborhood: "Town centre · demo",
    price: 18,
    stock: 6,
    light: "medium",
    interval: 7,
    notes: "An adaptable trailing plant. Water when the top few centimetres of soil are dry.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "bird-nest-fern",
    name: "Bird's nest fern",
    species: "Asplenium nidus",
    shop: "The Greenhouse Corner",
    neighborhood: "College Street · demo",
    price: 21,
    stock: 0,
    light: "low",
    interval: 5,
    notes: "Likes a humid spot and consistently light moisture. Water around the soil, not the centre.",
    image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: "peace-lily-shop",
    name: "Peace lily",
    species: "Spathiphyllum",
    shop: "Mosslight Floral",
    neighborhood: "West End · demo",
    price: 20,
    stock: 4,
    light: "medium",
    interval: 5,
    notes: "Prefers medium, indirect light and regular moisture. Avoid letting it sit in water.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85"
  }
];
