export type DestinationPlaceholder = {
  id: string;
  name: string;
  location: string;
  description: string;
  bestMonths: string;
  tag: 'Beach' | 'Nature' | 'History' | 'Adventure' | 'Landmark';
  tagColor: string;
  imageUri: string;
  transport: string;
  estimatedBudget: string;
};

export const EXPLORE_DESTINATIONS: DestinationPlaceholder[] = [
  {
    id: '1',
    name: 'Bora Bora',
    location: 'French Polynesia',
    description:
      'Iconic overwater bungalows, crystal-clear lagoons, and lush volcanic peaks. A luxury-heavy destination where even budget options feel premium.',
    bestMonths: 'May - Oct',
    tag: 'Beach',
    tagColor: '#4A90E2',
    imageUri: 'https://images.unsplash.com/photo-1501615965209-5deb4f44c8a4?w=800&q=80',
    transport: 'Flight',
    estimatedBudget: '$300 - $1,000+ / day',
  },
  {
    id: '2',
    name: 'Maldives',
    location: 'South Asia',
    description:
      'Turquoise atolls, coral reefs, and private island resorts. Wide range from affordable local islands to ultra-luxury overwater villas.',
    bestMonths: 'Nov - Apr',
    tag: 'Beach',
    tagColor: '#4A90E2',
    imageUri: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
    transport: 'Flight + Speedboat',
    estimatedBudget: '$150 - $800 / day',
  },
  {
    id: '3',
    name: 'Banff National Park',
    location: 'Alberta, Canada',
    description:
      'Emerald lakes, glaciers, and the Canadian Rockies. World-class hiking and skiing with costs covering lodging, food, and park fees.',
    bestMonths: 'Jun - Sep',
    tag: 'Nature',
    tagColor: '#1F9D74',
    imageUri: 'https://images.unsplash.com/photo-1609881543302-1bef3d0f19e6?w=800&q=80',
    transport: 'Car / Bus',
    estimatedBudget: '$100 - $300 / day',
  },
  {
    id: '4',
    name: 'Amazon Rainforest',
    location: 'Brazil / Peru',
    description:
      'The lungs of the Earth. Guided jungle tours, wildlife spotting, and river expeditions, mostly bundled packages that simplify budgeting.',
    bestMonths: 'Jun - Nov',
    tag: 'Nature',
    tagColor: '#1F9D74',
    imageUri: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80',
    transport: 'Flight + Boat',
    estimatedBudget: '$150 - $400 / day',
  },
  {
    id: '5',
    name: 'Rome',
    location: 'Italy',
    description:
      'The Eternal City with the Colosseum, Vatican, and centuries of history on every street. Flexible budget from hostels to boutique hotels.',
    bestMonths: 'Apr - Jun, Sep - Oct',
    tag: 'History',
    tagColor: '#7B5EA7',
    imageUri: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&q=80',
    transport: 'Flight + Metro',
    estimatedBudget: '$80 - $250 / day',
  },
  {
    id: '6',
    name: 'Machu Picchu',
    location: 'Cusco, Peru',
    description:
      'The lost Incan citadel perched high in the Andes. Tours, entrance permits, and transport are included in most packages.',
    bestMonths: 'May - Oct',
    tag: 'History',
    tagColor: '#7B5EA7',
    imageUri: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
    transport: 'Flight + Train',
    estimatedBudget: '$100 - $300 / day',
  },
  {
    id: '7',
    name: 'Queenstown',
    location: 'New Zealand',
    description:
      'The adventure capital of the world with bungee jumping, skydiving, jet boating, and skiing. Activities are the main cost driver.',
    bestMonths: 'Dec - Feb, Jun - Aug',
    tag: 'Adventure',
    tagColor: '#D0534A',
    imageUri: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
    transport: 'Flight + Car',
    estimatedBudget: '$120 - $350 / day',
  },
  {
    id: '8',
    name: 'Patagonia',
    location: 'Argentina / Chile',
    description:
      'Dramatic glaciers, jagged peaks, and untouched wilderness at the tip of South America. Self-guided hiking keeps costs manageable.',
    bestMonths: 'Nov - Mar',
    tag: 'Adventure',
    tagColor: '#D0534A',
    imageUri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    transport: 'Flight + Bus',
    estimatedBudget: '$80 - $250 / day',
  },
  {
    id: '9',
    name: 'Eiffel Tower',
    location: 'Paris, France',
    description:
      'The iron lady of Paris and one of the world\'s most recognizable landmarks. Accommodation is the primary expense in the City of Light.',
    bestMonths: 'Apr - Jun, Sep - Nov',
    tag: 'Landmark',
    tagColor: '#E39A2D',
    imageUri: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80',
    transport: 'Flight + Metro',
    estimatedBudget: '$120 - $300 / day',
  },
  {
    id: '10',
    name: 'Great Wall of China',
    location: 'Beijing, China',
    description:
      'Stretching over 13,000 miles, the Great Wall is one of history\'s greatest engineering feats and one of the most budget-friendly major landmarks.',
    bestMonths: 'Apr - May, Sep - Oct',
    tag: 'Landmark',
    tagColor: '#E39A2D',
    imageUri: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80',
    transport: 'Flight + Bus',
    estimatedBudget: '$50 - $150 / day',
  },
];