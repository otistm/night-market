import type { ItemDef } from '@/game/types';

export const ITEMS: readonly ItemDef[] = [
  { id: 'dagger', nm: 'Tin Dagger', ico: '🗡️', sz: 1, cd: 3.0, eff: { dmg: 6 }, flav: 'Cheap steel, eager edge.' },
  { id: 'knives', nm: "Juggler's Knives", ico: '🔪', sz: 1, cd: 2.2, eff: { dmg: 4 }, crit: 0.25, flav: 'Three in the air, one in your ribs.' },
  { id: 'sling', nm: 'River-Stone Sling', ico: '🪨', sz: 1, cd: 2.6, eff: { dmg: 5 }, flav: 'Smoothed by a thousand miles of water.' },
  { id: 'emberwand', nm: 'Ember Wand', ico: '🕯️', sz: 1, cd: 4.0, eff: { burn: 3 }, flav: 'Still warm from the last customer.' },
  { id: 'fang', nm: 'Adder Fang', ico: '🐍', sz: 1, cd: 4.0, eff: { poison: 2 }, flav: 'Sold with a complimentary apology.' },
  { id: 'charm', nm: 'Tortoise Charm', ico: '🐢', sz: 1, cd: 3.4, eff: { shield: 6 }, flav: 'Slow to anger. Slower to break.' },
  { id: 'tonic', nm: 'Plum Tonic', ico: '🍶', sz: 1, cd: 5.0, eff: { heal: 8 }, flav: 'Tastes like a second chance.' },
  { id: 'hourglass', nm: 'Hasty Hourglass', ico: '⏳', sz: 1, cd: 6.0, eff: { haste: 1 }, flav: 'The sand falls upward when no one watches.' },
  { id: 'buckler', nm: 'Spiked Buckler', ico: '🛞', sz: 1, cd: 4.2, eff: { shield: 5, dmg: 4 }, flav: 'The best defense, nailed to a defense.' },
  { id: 'bell', nm: 'Singing Bell', ico: '🔔', sz: 1, cd: 5.0, eff: { dmg: 5, haste: 0.5 }, flav: 'Rings once for luck, twice for blood.' },
  { id: 'scale', nm: 'Gilded Scale', ico: '⚖️', sz: 1, cd: 0, eff: { income: 1 }, flav: 'It always tips your way. (+1 gold each night)' },
  { id: 'crossbow', nm: 'Pepperbox Crossbow', ico: '🏹', sz: 2, cd: 5.0, eff: { dmg: 15 }, flav: 'Four bolts. No questions.' },
  { id: 'moonblade', nm: 'Moon-Cut Blade', ico: '🌙', sz: 2, cd: 4.2, eff: { dmg: 9 }, life: 0.5, flav: 'Drinks light. And other things.' },
  { id: 'kettle', nm: 'Iron Kettle', ico: '🫖', sz: 2, cd: 4.0, eff: { shield: 12 }, flav: 'Battle-grade. Also makes tea.' },
  { id: 'flask', nm: "Alchemist's Flask", ico: '⚗️', sz: 2, cd: 5.0, eff: { poison: 3, burn: 3 }, flav: 'Shake well. Stand back.' },
  { id: 'stormlamp', nm: 'Storm Lantern', ico: '🏮', sz: 2, cd: 5.0, eff: { dmg: 10, haste: 1 }, flav: 'Bottled weather, slightly used.' },
  { id: 'censer', nm: 'Leech Censer', ico: '🪔', sz: 2, cd: 6.0, eff: { dmg: 12 }, life: 1, flav: 'The smoke remembers you.' },
  { id: 'frostorb', nm: 'Frost Orb', ico: '🔮', sz: 2, cd: 6.0, eff: { dmg: 7, slow: 1.5 }, flav: 'Winter, to go.' },
  { id: 'feather', nm: 'Phoenix Feather', ico: '🪶', sz: 2, cd: 7.0, eff: { heal: 14, cleanse: 1 }, flav: 'Guaranteed at least one rebirth.' },
  { id: 'ledger', nm: "Merchant's Ledger", ico: '📒', sz: 2, cd: 0, eff: { income: 2 }, flav: 'Every debt collected, eventually. (+2 gold each night)' },
  { id: 'keg', nm: 'Powder Keg', ico: '🛢️', sz: 2, cd: 9.0, eff: { dmg: 34 }, flav: 'Strictly no refunds.' },
  { id: 'cannon', nm: 'Festival Cannon', ico: '💣', sz: 3, cd: 8.0, eff: { dmg: 32 }, crit: 0.2, flav: 'For celebrations and sieges alike.' },
  { id: 'brazier', nm: 'Dragonfire Brazier', ico: '🔥', sz: 3, cd: 6.0, eff: { burn: 7, dmg: 6 }, flav: 'Feed it coal. Never feed it after midnight.' },
  { id: 'aegis', nm: 'Royal Aegis', ico: '🛡️', sz: 3, cd: 7.0, eff: { shield: 30 }, flav: 'Once guarded a king. The king is available separately.' },
  { id: 'idol', nm: 'Obsidian Idol', ico: '🗿', sz: 3, cd: 10.0, eff: { dmg: 26, slow: 1.5 }, flav: 'It blinked first. Now you owe it.' },
  { id: 'organ', nm: 'Calliope of Woe', ico: '🎹', sz: 3, cd: 7.5, eff: { dmg: 14, haste: 1, burn: 3 }, flav: 'Plays itself. Badly. Devastatingly.' },
];

export const ITEM_BY_ID: Readonly<Record<string, ItemDef>> = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);
