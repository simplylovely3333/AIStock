// Mock data for AI assets
export const CATEGORIES = [
  { id: 'all',     label: 'Все',        icon: '✦',  count: 2840 },
  { id: 'images',  label: 'Изображения',     icon: '🖼',  count: 1200 },
  { id: 'video',   label: 'Видео',      icon: '🎬',  count: 340  },
  { id: 'audio',   label: 'Аудио',      icon: '🎵',  count: 280  },
  { id: '3d',      label: '3D Модели',  icon: '🧊',  count: 180  },
  { id: 'prompts', label: 'Промпты',    icon: '✍️',  count: 840  },
  { id: 'agents',  label: 'ИИ Агенты',  icon: '🤖',  count: 420  },
];

export const AUTHORS = [
  { id: 1, name: 'Luna Pixel',   avatar: 'LP', verified: true,  sales: 4200 },
  { id: 2, name: 'Axel Dreamer', avatar: 'AD', verified: true,  sales: 3800 },
  { id: 3, name: 'Nova Craft',   avatar: 'NC', verified: false, sales: 2100 },
  { id: 4, name: 'Kai Visions',  avatar: 'KV', verified: true,  sales: 5600 },
  { id: 5, name: 'Zara Synth',   avatar: 'ZS', verified: false, sales: 890  },
  { id: 6, name: 'Orion Studio', avatar: 'OS', verified: true,  sales: 7200 },
];

// Generate gradient backgrounds for asset thumbnails
const PALETTES = [
  ['#7c5cfc','#c06cf8'],
  ['#f0b429','#ff6b6b'],
  ['#22c55e','#0ea5e9'],
  ['#ec4899','#f43f5e'],
  ['#3b82f6','#8b5cf6'],
  ['#14b8a6','#22c55e'],
  ['#f97316','#eab308'],
  ['#a855f7','#ec4899'],
  ['#06b6d4','#3b82f6'],
  ['#84cc16','#10b981'],
];

const TAGS_POOL = [
  'ai-art','midjourney','stable-diffusion','portrait','abstract','neon','cyberpunk',
  'fantasy','sci-fi','nature','architecture','character','texture','background',
  'concept-art','illustration','photorealistic','anime','dark','colorful',
  'minimalist','futuristic','surreal','landscape','urban',
];

const ASSET_NAMES = [
  'Городской неоновый пейзаж на рассвете','Эфирный дух леса','Квантовая визуализация данных',
  'Киберпанк персонажи','Глубины мистического океана','Формирование галактической туманности',
  'Абстрактный геометрический поток','Портрет будущего','Кристальные пейзажи',
  'Биомеханическая сущность','Закат над колониями Марса','Цифровой фрагмент души',
  'Заброшенные древние руины','Нейросетевая красота','Персонаж из пустоты',
  'Шторм светящихся частиц','Мандала сакральной геометрии','Глубоководные существа',
  'Городская антиутопия','Световая композиция ангела','Индустриальный упадок',
  'Синтетическая форма жизни','Космический пейзаж ужаса','Интерьер дворца памяти',
  'Открытие временного разлома','Небесная садовая тропа','Бинарные духи леса',
  'Хромированная статуя дракона','Голографическая модель','Расколотый портал реальности',
  'Полуночная биолюминесценция','Электрический шторм','Карта ИИ-сознания',
  'Кристальная архитектура','Силуэт корабля-призрака',
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomTags(n = 3) {
  const shuffled = [...TAGS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export const ASSETS = Array.from({ length: 36 }, (_, i) => {
  const palette = PALETTES[i % PALETTES.length];
  const cat = i < 3 ? 'images' : randomFrom(['images','images','video','audio','3d','prompts']);
  const author = AUTHORS[i % AUTHORS.length];
  const rating = (3.5 + Math.random() * 1.5).toFixed(1);
  const reviews = randomInt(12, 640);
  const price = cat === 'prompts' ? randomFrom([0, 4.99, 9.99]) : randomFrom([9.99, 19.99, 29.99, 49.99, 79.99]);
  return {
    id:          i + 1,
    title:       ASSET_NAMES[i % ASSET_NAMES.length],
    category:    cat,
    author,
    price,
    isFree:      price === 0,
    palette,
    tags:        randomTags(randomInt(2, 4)),
    rating:      parseFloat(rating),
    reviews,
    sales:       randomInt(50, 3000),
    isNew:       i < 6,
    isFeatured:  [0,3,7,11,15].includes(i),
    isHot:       randomInt(0, 4) === 0,
    resolution:  cat === 'images' ? randomFrom(['4K','8K','HD']) : null,
    duration:    cat === 'video' || cat === 'audio' ? `${randomInt(0,3)}:${String(randomInt(10,59)).padStart(2,'0')}` : null,
    license:     randomFrom(['Стандартная','Расширенная','Коммерческая']),
    description: `Потрясающий AI-сгенерированный ${cat} ассет, созданный с помощью передовых моделей. Идеально подходит для творческих проектов, коллекций цифрового искусства и коммерческого использования.`,
    createdAt:   new Date(Date.now() - randomInt(0, 90) * 86400000).toISOString(),
  };
});

export const FEATURED_ASSETS = ASSETS.filter(a => a.isFeatured);
export const NEW_ASSETS      = ASSETS.filter(a => a.isNew).slice(0, 8);
export const HOT_ASSETS      = ASSETS.filter(a => a.isHot).slice(0, 6);
