import type { ItemDef } from '@/game/types';

export const ITEMS: readonly ItemDef[] = [
  // 🧙‍♀️ The Witch — Hagra of the Bramblewood
  { id: 'cauldron', nm: 'Bubbling Cauldron', ico: '🧪', sz: 2, cd: 4.5, eff: { poison: 2 }, tags: ['Poison'], heroId: 'witch', flav: 'It only ever simmers. Never boils. Never cools.' },
  { id: 'hexpin', nm: 'Hexing Pin', ico: '📌', sz: 1, cd: 3.2, eff: { poison: 2 }, tags: ['Poison'], heroId: 'witch', flav: 'For dolls, and the people they resemble.' },
  { id: 'toadstool', nm: 'Toadstool Draught', ico: '🍄', sz: 1, cd: 5.0, eff: { poison: 2, heal: 6 }, tags: ['Poison', 'Heal'], heroId: 'witch', flav: "Cures what ails you. Causes what doesn't." },
  { id: 'blackcat', nm: 'Black Cat Familiar', ico: '🐈‍⬛', sz: 1, cd: 6.0, eff: { haste: 1.2 }, tags: ['Haste'], heroId: 'witch', flav: 'Nine lives, all of them spent watching you.' },
  { id: 'broom', nm: 'Bramblewood Broom', ico: '🧹', sz: 2, cd: 4.6, eff: { dmg: 7, poison: 2 }, tags: ['Damage', 'Poison'], heroId: 'witch', flav: 'Sweeps the porch. Sweeps the leg.' },
  { id: 'cursedoll', nm: 'Wax Curse-Doll', ico: '🪆', sz: 2, cd: 5.0, eff: { poison: 2, curse: 3 }, tags: ['Poison', 'Curse'], heroId: 'witch', flav: 'Looks just like your enemy. Hurts just like them too.' },

  // 🧛 The Vampire — Count Mordrel
  { id: 'chalice', nm: 'Crimson Chalice', ico: '🍷', sz: 2, cd: 4.4, eff: { dmg: 9 }, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', life: 0.5, flav: 'Vintage: last Tuesday. Notes of regret.' },
  { id: 'bats', nm: 'Swarm of Bats', ico: '🦇', sz: 2, cd: 4.0, eff: { dmg: 3 }, hits: 3, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', life: 0.5, flav: "They share everything. Especially what's yours." },
  { id: 'coffin', nm: 'Velvet Coffin', ico: '⚰️', sz: 2, cd: 5.5, eff: { shield: 10, heal: 5 }, tags: ['Shield', 'Heal'], heroId: 'vampire', flav: 'Rest in it. Rise from it. Repeat.' },
  { id: 'bloodfang', nm: 'Bloodletter Fang', ico: '🩸', sz: 1, cd: 3.6, eff: { dmg: 6 }, execute: 10, tags: ['Damage', 'Execute'], heroId: 'vampire', flav: 'Finds the vein on the first try. Always.' },
  { id: 'nightcloak', nm: 'Nightcloak', ico: '🦹', sz: 1, cd: 4.4, eff: { shield: 7, slow: 1 }, tags: ['Shield', 'Slow'], heroId: 'vampire', flav: 'They never see the second strike. Or the first.' },
  { id: 'rose', nm: 'Sanguine Rose', ico: '🌹', sz: 1, cd: 5.0, eff: { heal: 7 }, tags: ['Heal'], heroId: 'vampire', flav: 'A gift. With thorns, and a thirst.' },

  // 🐺 The Werewolf — Fenra Moonscar
  { id: 'claws', nm: 'Iron Claws', ico: '🐾', sz: 1, cd: 2.4, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'werewolf', flav: 'Manicure not included. Or possible.' },
  { id: 'moonfang', nm: 'Moonlit Fang', ico: '🌝', sz: 2, cd: 3.6, eff: { dmg: 8 }, tags: ['Damage'], heroId: 'werewolf', flav: 'Sharpens itself by the light of the full moon.' },
  { id: 'packtotem', nm: 'Pack Totem', ico: '🪵', sz: 2, cd: 5.0, eff: { haste: 1.5 }, tags: ['Haste'], heroId: 'werewolf', flav: 'The pack runs faster when the totem howls.' },
  { id: 'roar', nm: 'Feral Roar', ico: '📢', sz: 1, cd: 5.0, eff: { haste: 0.6, slow: 1.5 }, tags: ['Haste', 'Slow'], heroId: 'werewolf', flav: 'Less a sound, more a weather event.' },
  { id: 'silverbone', nm: 'Silvered Bone', ico: '🦴', sz: 2, cd: 4.2, eff: { dmg: 6 }, ramp: 3, tags: ['Damage', 'Ramp'], heroId: 'werewolf', flav: 'Gnaws back. Grows hungrier with every bite.' },
  { id: 'pelt', nm: "Hunter's Pelt", ico: '🧥', sz: 1, cd: 4.0, eff: { dmg: 4, shield: 6 }, tags: ['Damage', 'Shield'], heroId: 'werewolf', flav: 'Still warm. Best not to ask from what.' },

  // 🧙‍♂️ The Sorcerer — Azael Tide-Speaker
  { id: 'frostsigil', nm: 'Frost Sigil', ico: '❄️', sz: 1, cd: 4.0, eff: { dmg: 6, slow: 1.2 }, tags: ['Damage', 'Slow'], heroId: 'sorcerer', flav: 'Drawn in breath that never quite thaws.' },
  { id: 'arcaneorb', nm: 'Arcane Orb', ico: '🔮', sz: 2, cd: 6.0, eff: { dmg: 20 }, tags: ['Damage'], heroId: 'sorcerer', flav: 'Contains a small, furious universe.' },
  { id: 'lightningrod', nm: 'Lightning Rod', ico: '⚡', sz: 2, cd: 4.6, eff: { dmg: 5 }, hits: 2, tags: ['Damage'], heroId: 'sorcerer', flav: 'Conducts opinions directly to the unworthy.' },
  { id: 'manafont', nm: 'Mana Font', ico: '💧', sz: 1, cd: 5.5, eff: { shield: 6, haste: 1 }, tags: ['Shield', 'Haste'], heroId: 'sorcerer', flav: 'Drink deep. Mind the things that drink from it.' },
  { id: 'glacialspike', nm: 'Glacial Spike', ico: '🧊', sz: 2, cd: 5.0, eff: { dmg: 8 }, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'sorcerer', flav: 'Goes straight through. Politely.' },
  { id: 'starfalltome', nm: 'Starfall Tome', ico: '📖', sz: 3, cd: 7.5, eff: { dmg: 30, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'sorcerer', flav: 'Page one: the sky. Page two: where it lands.' },

  // 👑 The Queen — Seraphine, Lantern Queen
  { id: 'decree', nm: 'Royal Decree', ico: '📜', sz: 1, cd: 0, eff: { income: 2 }, tags: ['Gold'], heroId: 'queen', flav: 'It is so because she said so. (+2 gold each night)' },
  { id: 'crown', nm: 'Gilded Crown', ico: '👑', sz: 2, cd: 0, eff: { income: 3 }, tags: ['Gold'], heroId: 'queen', flav: 'Heavy is the head. Heavier is the purse. (+3 gold/night)' },
  { id: 'lanternguard', nm: 'Lanternguard', ico: '🛡️', sz: 1, cd: 3.6, eff: { dmg: 3, shield: 9 }, tags: ['Damage', 'Shield'], heroId: 'queen', flav: "Stands where it's told. Strikes what comes close." },
  { id: 'scepter', nm: 'Scepter of Dawn', ico: '🪄', sz: 2, cd: 6.0, eff: { heal: 12, cleanse: 1 }, tags: ['Heal', 'Cleanse'], heroId: 'queen', flav: 'One wave, and the night forgets your wounds.' },
  { id: 'banner', nm: 'Court Banner', ico: '🚩', sz: 2, cd: 5.0, eff: { shield: 6, haste: 1 }, tags: ['Shield', 'Haste'], heroId: 'queen', flav: 'Rally to it. Or be left behind it.' },
  { id: 'taxcollector', nm: 'The Tax Collector', ico: '💰', sz: 2, cd: 0, eff: { income: 1 }, tags: ['Gold'], heroId: 'queen', flav: 'Always collects. Sometimes in blood.' },

  // 🗿 The Fire Golem — Cinderhulk
  { id: 'magmacore', nm: 'Magma Core', ico: '🟥', sz: 2, cd: 4.0, eff: { burn: 4 }, tags: ['Burn'], heroId: 'golem', flav: 'The heart of the mountain, sold by the pound.' },
  { id: 'cinderfist', nm: 'Cinder Fist', ico: '👊', sz: 2, cd: 4.4, eff: { dmg: 8, burn: 2 }, tags: ['Damage', 'Burn'], heroId: 'golem', flav: 'Knocks first. Asks never.' },
  { id: 'bellows', nm: 'Ember Bellows', ico: '🎐', sz: 1, cd: 5.0, eff: { burn: 1, haste: 1 }, tags: ['Burn', 'Haste'], heroId: 'golem', flav: 'Stokes the fire. And the temper.' },
  { id: 'moltenplate', nm: 'Molten Plating', ico: '🧱', sz: 2, cd: 4.5, eff: { shield: 8 }, thorns: 4, tags: ['Shield', 'Thorns'], heroId: 'golem', flav: 'Touch it and learn. Quickly.' },
  { id: 'furnaceheart', nm: 'Furnace Heart', ico: '🔥', sz: 3, cd: 6.0, eff: { dmg: 5, burn: 8 }, tags: ['Damage', 'Burn'], heroId: 'golem', flav: "Never goes out. Believe me, they've tried." },
  { id: 'ashcenser', nm: 'Ashfall Censer', ico: '🪔', sz: 2, cd: 5.0, eff: { burn: 3, slow: 1.2 }, tags: ['Burn', 'Slow'], heroId: 'golem', flav: 'The smoke gets in everywhere. Permanently.' },

  // 👺 The Goblin — Snitch Coppertooth
  { id: 'coinbomb', nm: 'Coin Bomb', ico: '🧨', sz: 1, cd: 5.0, eff: { dmg: 6 }, goldScale: true, tags: ['Damage', 'Gold'], heroId: 'goblin', flav: 'Funded entirely by your enemies. Eventually.' },
  { id: 'wrench', nm: "Tinker's Wrench", ico: '🔧', sz: 1, cd: 5.5, eff: { haste: 1.4 }, tags: ['Haste'], heroId: 'goblin', flav: 'Fixes everything. By hitting it.' },
  { id: 'pocketsand', nm: 'Pocket Sand', ico: '🏖️', sz: 1, cd: 3.8, eff: { dmg: 3, slow: 1.3 }, tags: ['Damage', 'Slow'], heroId: 'goblin', flav: "Sssh! Don't tell them it's mostly glitter." },
  { id: 'scrapcannon', nm: 'Scrap Cannon', ico: '🛠️', sz: 2, cd: 5.5, eff: { dmg: 13 }, tags: ['Damage'], heroId: 'goblin', flav: 'Loaded with whatever was lying around. Including teeth.' },
  { id: 'luckydice', nm: 'Lucky Dice', ico: '🎲', sz: 1, cd: 5.0, eff: { dmg: 4 }, ramp: 2, tags: ['Damage', 'Ramp'], heroId: 'goblin', flav: 'Loaded. In your favor. Mostly. Usually. Sometimes.' },
  { id: 'smokepellet', nm: 'Smoke Pellet', ico: '💨', sz: 1, cd: 6.0, eff: { shield: 6, cleanse: 1 }, tags: ['Shield', 'Cleanse'], heroId: 'goblin', flav: "Now you see your wounds. Now you don't." },

  // 🦅 The Griffin — Sky-Marshal Aello
  { id: 'talon', nm: 'Talon Strike', ico: '🦅', sz: 1, cd: 3.0, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'griffin', flav: 'From above. Always from above.' },
  { id: 'updraft', nm: 'Updraft', ico: '🌀', sz: 1, cd: 5.0, eff: { haste: 1.3 }, tags: ['Haste'], heroId: 'griffin', flav: 'Catch the wind, or be caught by what rides it.' },
  { id: 'quiver', nm: 'Skyfeather Quiver', ico: '🏹', sz: 2, cd: 4.2, eff: { dmg: 4 }, hits: 3, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'griffin', flav: 'Arrows fletched with stormcloud. Aim is not optional.' },
  { id: 'stormcaller', nm: 'Stormcaller', ico: '🌩️', sz: 2, cd: 5.0, eff: { dmg: 9, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'griffin', flav: 'Calls the storm collect. You pay the toll.' },
  { id: 'aerieaegis', nm: 'Aerie Aegis', ico: '🪽', sz: 2, cd: 4.6, eff: { shield: 9, haste: 0.6 }, tags: ['Shield', 'Haste'], heroId: 'griffin', flav: 'Feathers like steel. Steel like feathers.' },
  { id: 'divingspear', nm: 'Diving Spear', ico: '🔱', sz: 2, cd: 5.0, eff: { dmg: 7 }, execute: 14, tags: ['Damage', 'Execute'], heroId: 'griffin', flav: 'Gravity does most of the work. You take the credit.' },

  // 🪦 Fiend-only wares — never sold in the market
  { id: 'tombstone', nm: 'Tombstone Bulwark', ico: '🪦', sz: 3, cd: 5.0, eff: { shield: 34 }, thorns: 3, tags: ['Shield', 'Thorns'], fiendOnly: true, flav: 'It turns aside every blade. Bring what slips through stone.' },
];

export const ITEM_BY_ID: Readonly<Record<string, ItemDef>> = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);

/** Wares purchasable in the market (excludes fiend-only gear). */
export const MARKET_ITEMS: readonly ItemDef[] = ITEMS.filter((i) => !i.fiendOnly);
