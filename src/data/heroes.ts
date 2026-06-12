import type { HeroDef } from '@/game/types';

export const HEROES: readonly HeroDef[] = [
  {
    id: 'pyra',
    nm: 'Pyra of the Coalwalk',
    face: '🧝',
    tag: 'Flame Peddler',
    pass: 'Her burn effects are 40% stronger.',
    mult: { burn: 1.4 },
  },
  {
    id: 'vex',
    nm: 'Vex Halfpocket',
    face: '🧌',
    tag: 'Knife Merchant',
    pass: 'His weapon damage is 20% higher.',
    mult: { dmg: 1.2 },
  },
  {
    id: 'orla',
    nm: 'Orla the Kettlewitch',
    face: '🧙',
    tag: 'Ward Seller',
    pass: 'Her shields and heals are 35% stronger.',
    mult: { shield: 1.35, heal: 1.35 },
  },
];
