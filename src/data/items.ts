import type { ItemDef } from '@/game/types';

export const ITEMS: readonly ItemDef[] = [
  // 🧙‍♀️ The Witch — Hagra of the Bramblewood
  { id: 'cauldron', nm: 'Bubbling Cauldron', ico: '🍲', sz: 2, cd: 4.5, eff: { poison: 2 }, tags: ['Poison'], heroId: 'witch', flav: 'It only ever simmers. Never boils. Never cools.' },
  { id: 'hexpin', nm: 'Hexing Pin', ico: '📌', sz: 1, cd: 3.2, eff: { poison: 2 }, tags: ['Poison'], heroId: 'witch', flav: 'For dolls, and the people they resemble.' },
  { id: 'toadstool', nm: 'Toadstool Draught', ico: '🧪', sz: 1, cd: 5.0, eff: { poison: 2, heal: 6 }, tags: ['Poison', 'Heal'], heroId: 'witch', flav: "Cures what ails you. Causes what doesn't." },
  { id: 'blackcat', nm: 'Black Cat Familiar', ico: '🐈‍⬛', sz: 1, cd: 5.0, eff: { haste: 1.2, curse: 2 }, tags: ['Haste', 'Curse'], heroId: 'witch', flav: 'Nine lives, all of them spent watching you.' },
  { id: 'broom', nm: 'Bramblewood Broom', ico: '🧹', sz: 2, cd: 4.6, eff: { dmg: 7, poison: 2 }, tags: ['Damage', 'Poison'], heroId: 'witch', flav: 'Sweeps the porch. Sweeps the leg.' },
  { id: 'cursedoll', nm: 'Wax Curse-Doll', ico: '🪆', sz: 2, cd: 5.0, eff: { poison: 2, curse: 3 }, tags: ['Poison', 'Curse'], heroId: 'witch', flav: 'Looks just like your enemy. Hurts just like them too.' },
  { id: 'wardingbrew', nm: 'Warding Brew', ico: '🍵', sz: 1, cd: 5.5, eff: { heal: 6, cleanse: 1 }, tags: ['Heal', 'Cleanse'], heroId: 'witch', flav: 'Steeped against bites, blights and bad intentions.' },

  // 🧛 The Vampire — Count Mordrel
  { id: 'chalice', nm: 'Crimson Chalice', ico: '🥃', sz: 2, cd: 4.4, eff: { dmg: 9 }, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', life: 0.55, flav: 'Vintage: last Tuesday. Notes of regret.' },
  { id: 'bats', nm: 'Swarm of Bats', ico: '🦇', sz: 2, cd: 4.0, eff: { dmg: 3 }, hits: 3, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', life: 0.55, flav: "They share everything. Especially what's yours." },
  { id: 'coffin', nm: 'Velvet Coffin', ico: '⚰️', sz: 2, cd: 5.5, eff: { shield: 10, heal: 5 }, tags: ['Shield', 'Heal'], heroId: 'vampire', flav: 'Rest in it. Rise from it. Repeat.' },
  { id: 'bloodfang', nm: 'Bloodletter Fang', ico: '🦷', sz: 1, cd: 3.6, eff: { dmg: 6 }, execute: 10, tags: ['Damage', 'Execute'], heroId: 'vampire', flav: 'Finds the vein on the first try. Always.' },
  { id: 'nightcloak', nm: 'Nightcloak', ico: '🧥', sz: 1, cd: 4.4, eff: { shield: 7, slow: 1 }, tags: ['Shield', 'Slow'], heroId: 'vampire', flav: 'They never see the second strike. Or the first.' },
  { id: 'rose', nm: 'Sanguine Rose', ico: '🥀', sz: 1, cd: 5.0, eff: { heal: 7 }, tags: ['Heal'], heroId: 'vampire', flav: 'A gift. With thorns, and a thirst.' },

  // 🐺 The Werewolf — Fenra Moonscar
  { id: 'claws', nm: 'Iron Claws', ico: '⚔️', sz: 1, cd: 2.4, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'werewolf', flav: 'Manicure not included. Or possible.' },
  { id: 'moonfang', nm: 'Moonlit Fang', ico: '🌝', sz: 2, cd: 3.6, eff: { dmg: 8 }, tags: ['Damage'], heroId: 'werewolf', flav: 'Sharpens itself by the light of the full moon.' },
  { id: 'packtotem', nm: 'Pack Totem', ico: '🗿', sz: 2, cd: 5.0, eff: { haste: 1.5 }, tags: ['Haste'], heroId: 'werewolf', flav: 'The pack runs faster when the totem howls.' },
  { id: 'roar', nm: 'Feral Roar', ico: '🦁', sz: 1, cd: 5.0, eff: { haste: 0.6, slow: 1.5 }, tags: ['Haste', 'Slow'], heroId: 'werewolf', flav: 'Less a sound, more a weather event.' },
  { id: 'silverbone', nm: 'Silvered Bone', ico: '🍖', sz: 2, cd: 4.2, eff: { dmg: 6 }, ramp: 3, tags: ['Damage', 'Ramp'], heroId: 'werewolf', flav: 'Gnaws back. Grows hungrier with every bite.' },
  { id: 'pelt', nm: "Hunter's Pelt", ico: '🐾', sz: 1, cd: 4.0, eff: { dmg: 4, shield: 6 }, thorns: 2, tags: ['Damage', 'Shield', 'Thorns'], heroId: 'werewolf', flav: 'Still warm. Best not to ask from what.' },

  // 🧙‍♂️ The Sorcerer — Azael Tide-Speaker
  { id: 'frostsigil', nm: 'Frost Sigil', ico: '🧿', sz: 1, cd: 4.0, eff: { dmg: 6, slow: 1.2 }, tags: ['Damage', 'Slow'], heroId: 'sorcerer', flav: 'Drawn in breath that never quite thaws.' },
  { id: 'arcaneorb', nm: 'Arcane Orb', ico: '🟣', sz: 2, cd: 6.0, eff: { dmg: 20 }, tags: ['Damage'], heroId: 'sorcerer', flav: 'Contains a small, furious universe.' },
  { id: 'lightningrod', nm: 'Lightning Rod', ico: '🌩️', sz: 2, cd: 4.6, eff: { dmg: 5 }, hits: 2, tags: ['Damage'], heroId: 'sorcerer', flav: 'Conducts opinions directly to the unworthy.' },
  { id: 'manafont', nm: 'Mana Font', ico: '⛲', sz: 1, cd: 5.5, eff: { shield: 6, haste: 1 }, tags: ['Shield', 'Haste'], heroId: 'sorcerer', flav: 'Drink deep. Mind the things that drink from it.' },
  { id: 'glacialspike', nm: 'Glacial Spike', ico: '🔷', sz: 2, cd: 5.0, eff: { dmg: 8 }, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'sorcerer', flav: 'Goes straight through. Politely.' },
  { id: 'starfalltome', nm: 'Starfall Tome', ico: '📖', sz: 3, cd: 7.5, eff: { dmg: 30, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'sorcerer', flav: 'Page one: the sky. Page two: where it lands.' },

  // 👑 The Queen — Seraphine, Lantern Queen
  { id: 'decree', nm: 'Royal Decree', ico: '📋', sz: 1, cd: 0, eff: { income: 2 }, tags: ['Gold'], heroId: 'queen', flav: 'It is so because she said so. (+2 gold each night)' },
  { id: 'crown', nm: 'Gilded Crown', ico: '👑', sz: 2, cd: 0, eff: { income: 3 }, tags: ['Gold'], heroId: 'queen', flav: 'Heavy is the head. Heavier is the purse. (+3 gold/night)' },
  { id: 'lanternguard', nm: 'Lanternguard', ico: '🏮', sz: 1, cd: 3.6, eff: { dmg: 3, shield: 9 }, tags: ['Damage', 'Shield'], heroId: 'queen', flav: "Stands where it's told. Strikes what comes close." },
  { id: 'scepter', nm: 'Scepter of Dawn', ico: '🔱', sz: 2, cd: 6.0, eff: { heal: 12, cleanse: 1 }, tags: ['Heal', 'Cleanse'], heroId: 'queen', flav: 'One wave, and the night forgets your wounds.' },
  { id: 'banner', nm: 'Court Banner', ico: '🚩', sz: 2, cd: 5.0, eff: { shield: 6, haste: 1 }, tags: ['Shield', 'Haste'], heroId: 'queen', flav: 'Rally to it. Or be left behind it.' },
  { id: 'taxcollector', nm: 'The Tax Collector', ico: '🧾', sz: 2, cd: 5.0, eff: { dmg: 4, income: 1 }, goldScale: true, tags: ['Damage', 'Gold'], heroId: 'queen', flav: 'Always collects. Sometimes in blood. (+1 gold/night, strikes for your purse)' },

  // 🗿 The Fire Golem — Cinderhulk
  { id: 'magmacore', nm: 'Magma Core', ico: '🟠', sz: 2, cd: 4.0, eff: { burn: 3 }, tags: ['Burn'], heroId: 'golem', flav: 'The heart of the mountain, sold by the pound.' },
  { id: 'cinderfist', nm: 'Cinder Fist', ico: '👊', sz: 2, cd: 4.4, eff: { dmg: 8, burn: 2 }, tags: ['Damage', 'Burn'], heroId: 'golem', flav: 'Knocks first. Asks never.' },
  { id: 'bellows', nm: 'Ember Bellows', ico: '🪗', sz: 1, cd: 5.0, eff: { burn: 3, haste: 1 }, tags: ['Burn', 'Haste'], heroId: 'golem', flav: 'Stokes the fire. And the temper.' },
  { id: 'moltenplate', nm: 'Molten Plating', ico: '🦺', sz: 2, cd: 4.5, eff: { shield: 8 }, thorns: 4, tags: ['Shield', 'Thorns'], heroId: 'golem', flav: 'Touch it and learn. Quickly.' },
  { id: 'furnaceheart', nm: 'Furnace Heart', ico: '❤️‍🔥', sz: 3, cd: 6.0, eff: { dmg: 5, burn: 5 }, tags: ['Damage', 'Burn'], heroId: 'golem', flav: "Never goes out. Believe me, they've tried." },
  { id: 'ashcenser', nm: 'Ashfall Censer', ico: '🏺', sz: 2, cd: 5.0, eff: { burn: 3, slow: 1.2 }, tags: ['Burn', 'Slow'], heroId: 'golem', flav: 'The smoke gets in everywhere. Permanently.' },

  // 👺 The Goblin — Snitch Coppertooth
  { id: 'coinbomb', nm: 'Coin Bomb', ico: '💸', sz: 1, cd: 5.0, eff: { dmg: 6 }, goldScale: true, tags: ['Damage', 'Gold'], heroId: 'goblin', flav: 'Funded entirely by your enemies. Eventually.' },
  { id: 'wrench', nm: "Tinker's Wrench", ico: '🛠️', sz: 1, cd: 5.5, eff: { haste: 1.4 }, tags: ['Haste'], heroId: 'goblin', flav: 'Fixes everything. By hitting it.' },
  { id: 'pocketsand', nm: 'Pocket Sand', ico: '⏳', sz: 1, cd: 3.8, eff: { dmg: 3, slow: 1.3 }, tags: ['Damage', 'Slow'], heroId: 'goblin', flav: "Sssh! Don't tell them it's mostly glitter." },
  { id: 'scrapcannon', nm: 'Scrap Cannon', ico: '💥', sz: 2, cd: 5.5, eff: { dmg: 13 }, tags: ['Damage'], heroId: 'goblin', flav: 'Loaded with whatever was lying around. Including teeth.' },
  { id: 'luckydice', nm: 'Lucky Dice', ico: '🍀', sz: 1, cd: 5.0, eff: { dmg: 4 }, ramp: 2, tags: ['Damage', 'Ramp'], heroId: 'goblin', flav: 'Loaded. In your favor. Mostly. Usually. Sometimes.' },
  { id: 'smokepellet', nm: 'Smoke Pellet', ico: '🌫️', sz: 1, cd: 6.0, eff: { shield: 6, cleanse: 1 }, tags: ['Shield', 'Cleanse'], heroId: 'goblin', flav: "Now you see your wounds. Now you don't." },

  // 🦅 The Griffin — Sky-Marshal Aello
  { id: 'talon', nm: 'Talon Strike', ico: '🪽', sz: 1, cd: 3.0, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'griffin', flav: 'From above. Always from above.' },
  { id: 'updraft', nm: 'Updraft', ico: '🌬️', sz: 1, cd: 5.0, eff: { haste: 1.3 }, tags: ['Haste'], heroId: 'griffin', flav: 'Catch the wind, or be caught by what rides it.' },
  { id: 'quiver', nm: 'Skyfeather Quiver', ico: '🎯', sz: 2, cd: 4.2, eff: { dmg: 4 }, hits: 3, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'griffin', flav: 'Arrows fletched with stormcloud. Aim is not optional.' },
  { id: 'stormcaller', nm: 'Stormcaller', ico: '🌀', sz: 2, cd: 5.0, eff: { dmg: 9, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'griffin', flav: 'Calls the storm collect. You pay the toll.' },
  { id: 'aerieaegis', nm: 'Aerie Aegis', ico: '🪺', sz: 2, cd: 4.6, eff: { shield: 9, haste: 0.6 }, tags: ['Shield', 'Haste'], heroId: 'griffin', flav: 'Feathers like steel. Steel like feathers.' },
  { id: 'divingspear', nm: 'Diving Spear', ico: '🪃', sz: 2, cd: 5.0, eff: { dmg: 7 }, execute: 14, tags: ['Damage', 'Execute'], heroId: 'griffin', flav: 'Gravity does most of the work. You take the credit.' },

  // ──────────────────────────────────────────────────────────────────
  // Synergy wares — built around stall adjacency (left/right neighbours).
  // Emoji icons are placeholders pending painted art.
  // ──────────────────────────────────────────────────────────────────

  // 🧙‍♀️ The Witch — adjacency: poison & curse
  // Roles: go-wide scaler, coat-weapons enabler, detonate payoff, curse enabler,
  // positional dual-stack, the one (targeted) tempo aura.
  { id: 'viper', nm: 'Viper Coil', ico: '🐍', sz: 1, cd: 3.8, eff: { poison: 3 }, tags: ['Poison'], heroId: 'witch', adj: { mode: 'self', perTag: 'Poison', add: { poison: 2 }, desc: '+2 poison for each adjacent Poison ware.' }, flav: 'It coils tighter the more company it keeps.' },
  { id: 'sporecap', nm: 'Sporecap', ico: '🍄', sz: 1, cd: 4.6, eff: { poison: 2 }, tags: ['Poison'], heroId: 'witch', adj: { mode: 'aura', targetTag: 'Damage', add: { poison: 1 }, desc: 'Adjacent Damage wares also apply +1 poison.' }, flav: 'One puff and the whole shelf is breathing it.' },
  { id: 'plaguejar', nm: 'Plague Jar', ico: '🫙', sz: 2, cd: 5.0, eff: { dmg: 6 }, consume: 'poison', tags: ['Damage', 'Poison'], heroId: 'witch', flav: 'Sealed for freshness. The contents are desperate to leave.' },
  { id: 'evileye', nm: 'Evil Eye', ico: '👁️', sz: 1, cd: 4.4, eff: { curse: 2, dmg: 3 }, tags: ['Curse', 'Damage'], heroId: 'witch', adj: { mode: 'self', needTag: 'Poison', add: { curse: 2 }, desc: 'Beside a Poison ware: +2s curse.' }, flav: 'It watches for weakness, then makes more of it.' },
  { id: 'nightwreath', nm: 'Nightshade Wreath', ico: '🌑', sz: 2, cd: 4.8, eff: { poison: 2, curse: 2 }, tags: ['Poison', 'Curse'], heroId: 'witch', adj: { mode: 'self', flanked: true, add: { poison: 2, curse: 2 }, desc: 'Flanked on both sides: +2 poison & +2s curse.' }, flav: 'Woven on a moonless night, for a moonless heart.' },
  { id: 'blackcandle', nm: 'Black Candle', ico: '🕯️', sz: 1, cd: 5.0, eff: { curse: 3 }, tags: ['Curse'], heroId: 'witch', adj: { mode: 'aura', targetTag: 'Poison', cdMult: 0.85, desc: 'Adjacent Poison wares fire 15% faster.' }, flav: 'Its smoke hurries every brew that burns beside it.' },

  // 🧛 The Vampire — adjacency: lifesteal, drain & tainted blood
  // Roles: lifesteal enabler aura, go-wide multistrike, sustain aura, poison
  // enabler (feeds DoT lifesteal), positional thorns, detonate-drain payoff.
  { id: 'bloodpact', nm: 'Blood Pact', ico: '🩸', sz: 1, cd: 4.0, eff: { dmg: 5 }, life: 0.4, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', adj: { mode: 'aura', targetTag: 'Damage', add: { life: 0.25 }, desc: 'Adjacent Damage wares gain 25% lifesteal.' }, flav: 'Sign here. And here. In the usual ink.' },
  { id: 'broodroost', nm: 'Brood Roost', ico: '🦇', sz: 2, cd: 4.2, eff: { dmg: 4 }, hits: 2, life: 0.5, tags: ['Damage', 'Lifesteal'], heroId: 'vampire', adj: { mode: 'self', needTag: 'Damage', add: { hits: 1 }, desc: 'Beside a Damage ware: +1 hit.' }, flav: 'They roost in numbers. They feed in numbers.' },
  { id: 'cryptward', nm: 'Crypt Ward', ico: '⚰️', sz: 2, cd: 5.0, eff: { shield: 9 }, tags: ['Shield'], heroId: 'vampire', adj: { mode: 'aura', add: { heal: 2 }, desc: 'Adjacent wares heal +2 when they fire.' }, flav: 'The dead rest easy. The living, eventually.' },
  { id: 'decanter', nm: 'Crimson Decanter', ico: '🍷', sz: 1, cd: 4.0, eff: { poison: 3 }, life: 0.3, tags: ['Poison', 'Lifesteal'], heroId: 'vampire', adj: { mode: 'self', needTag: 'Lifesteal', add: { poison: 2 }, desc: 'Beside a Lifesteal ware: +2 poison (tainted blood you drink back).' }, flav: 'A vintage that bites the drinker and the poured-for alike.' },
  { id: 'thornchoker', nm: 'Thornvine Choker', ico: '🌹', sz: 1, cd: 4.2, eff: { dmg: 4, heal: 3 }, life: 0.3, thorns: 2, tags: ['Damage', 'Thorns', 'Lifesteal'], heroId: 'vampire', adj: { mode: 'self', flanked: true, add: { thorns: 2 }, desc: 'Flanked on both sides: +2 thorns.' }, flav: 'Pretty. Thirsty. Pretty thirsty.' },
  { id: 'nocturnebell', nm: 'Nocturne Bell', ico: '🔔', sz: 2, cd: 5.0, eff: { dmg: 4 }, life: 0.3, consume: 'poison', tags: ['Damage', 'Lifesteal'], heroId: 'vampire', flav: 'It tolls once for every drop you take back.' },

  // 🐺 The Werewolf — adjacency: damage & ramp
  // Roles: the one flat +dmg aura, targeted tempo aura, ramp scaler self,
  // ramp aura ("the pack grows"), positional burst, execute payoff nuke.
  { id: 'packbrand', nm: 'Pack Brand', ico: '🐾', sz: 1, cd: 3.6, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'werewolf', adj: { mode: 'aura', add: { dmg: 2 }, desc: 'Adjacent wares deal +2 damage.' }, flav: 'Marks the pack. The pack marks the prey.' },
  { id: 'mooncall', nm: 'Mooncall Horn', ico: '🌕', sz: 2, cd: 5.0, eff: { haste: 1.2 }, tags: ['Haste'], heroId: 'werewolf', adj: { mode: 'aura', targetTag: 'Damage', cdMult: 0.85, desc: 'Adjacent Damage wares fire 15% faster.' }, flav: 'It calls. Things with teeth answer, faster each time.' },
  { id: 'gorgefang', nm: 'Gorge Fang', ico: '🦴', sz: 2, cd: 4.0, eff: { dmg: 6 }, ramp: 2, tags: ['Damage', 'Ramp'], heroId: 'werewolf', adj: { mode: 'self', needTag: 'Damage', add: { ramp: 3 }, desc: 'Beside a Damage ware: +3 ramp (it grows faster).' }, flav: 'It eats best in good company, and never stops growing.' },
  { id: 'alphahowl', nm: 'Alpha Howl', ico: '🐺', sz: 2, cd: 5.0, eff: { dmg: 5 }, ramp: 1, tags: ['Damage', 'Ramp'], heroId: 'werewolf', adj: { mode: 'aura', targetTag: 'Damage', add: { ramp: 2 }, desc: 'Adjacent Damage wares gain +2 ramp — the pack grows.' }, flav: 'When the alpha calls, the whole pack hungers.' },
  { id: 'rendingmaw', nm: 'Rending Maw', ico: '🐗', sz: 1, cd: 3.0, eff: { dmg: 4 }, tags: ['Damage'], heroId: 'werewolf', adj: { mode: 'self', flanked: true, add: { dmg: 4 }, desc: 'Flanked on both sides: +4 damage.' }, flav: 'Corner it and it gets worse, not better.' },
  { id: 'bloodmoon', nm: 'Bloodmoon Idol', ico: '🌙', sz: 3, cd: 6.0, eff: { dmg: 12 }, execute: 10, tags: ['Damage', 'Execute'], heroId: 'werewolf', adj: { mode: 'aura', add: { execute: 8 }, desc: 'Adjacent wares gain +8 execute against wounded foes.' }, flav: 'It rises in your stall, and the pack goes for the throat.' },

  // 🧙‍♂️ The Sorcerer — adjacency: slow & spell power
  // Roles: the one +slow aura, go-wide spell scaler, positional multistrike,
  // slow self-stacker (feeds arcane), payoff aura for Slow, slow-gated nuke.
  { id: 'rimelens', nm: 'Rime Lens', ico: '❄️', sz: 1, cd: 4.0, eff: { dmg: 5, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'sorcerer', adj: { mode: 'aura', add: { slow: 0.6 }, desc: 'Adjacent wares slow the foe +0.6s.' }, flav: 'Focuses the cold to a single, patient point.' },
  { id: 'echocrystal', nm: 'Echo Crystal', ico: '🔮', sz: 2, cd: 5.0, eff: { dmg: 8 }, tags: ['Damage'], heroId: 'sorcerer', adj: { mode: 'self', perTag: 'Damage', add: { dmg: 4 }, desc: '+4 damage for each adjacent Damage ware.' }, flav: 'It echoes every spell around it. Loudly.' },
  { id: 'chainspark', nm: 'Chain Spark', ico: '⚡', sz: 1, cd: 4.2, eff: { dmg: 4 }, hits: 2, tags: ['Damage'], heroId: 'sorcerer', adj: { mode: 'self', flanked: true, add: { hits: 1 }, desc: 'Flanked on both sides: +1 hit (it arcs both ways).' }, flav: 'It leaps to whatever is nearest. Mind your hands.' },
  { id: 'permafrost', nm: 'Permafrost Ward', ico: '🧊', sz: 2, cd: 5.0, eff: { shield: 7, slow: 1 }, tags: ['Shield', 'Slow'], heroId: 'sorcerer', adj: { mode: 'self', needTag: 'Slow', add: { slow: 1 }, desc: 'Beside a Slow ware: +1s slow.' }, flav: 'The chill compounds. So does the wait.' },
  { id: 'astralconduit', nm: 'Astral Conduit', ico: '🌌', sz: 2, cd: 5.5, eff: { dmg: 6 }, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'sorcerer', adj: { mode: 'aura', targetTag: 'Slow', add: { dmg: 4 }, desc: 'Adjacent Slow wares deal +4 damage.' }, flav: 'A wire between worlds. Do not lick it.' },
  { id: 'starpiercer', nm: 'Starpiercer', ico: '✨', sz: 3, cd: 7.0, eff: { dmg: 26 }, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'sorcerer', adj: { mode: 'self', needTag: 'Slow', add: { dmg: 10 }, desc: 'Beside a Slow ware: +10 damage.' }, flav: 'It waits for the foe to slow, then arrives.' },

  // 👑 The Queen — adjacency: shields, gold & court
  // Roles: the one +shield aura, gold + small shield aura, gold + the canonical
  // GLOBAL tempo aura, shield-gated heal, the one +thorns aura, gold-gated shield.
  { id: 'bulwarkstd', nm: 'Bulwark Standard', ico: '🛡️', sz: 2, cd: 5.0, eff: { shield: 8 }, tags: ['Shield'], heroId: 'queen', adj: { mode: 'aura', add: { shield: 4 }, desc: 'Adjacent wares gain +4 shield.' }, flav: 'Plant it, and the line holds around it.' },
  { id: 'tithecoffer', nm: 'Tithe Coffer', ico: '💰', sz: 1, cd: 0, eff: { income: 2 }, tags: ['Gold'], heroId: 'queen', adj: { mode: 'aura', add: { shield: 3 }, desc: 'Adjacent wares gain +3 shield. (+2 gold each night)' }, flav: 'A full coffer buys a thicker wall.' },
  { id: 'regentword', nm: "Regent's Word", ico: '📜', sz: 2, cd: 0, eff: { income: 3 }, tags: ['Gold'], heroId: 'queen', adj: { mode: 'aura', cdMult: 0.88, desc: 'Adjacent wares fire 12% faster. (+3 gold each night)' }, flav: 'A royal order. Even your wares obey it.' },
  { id: 'dawnlight', nm: 'Dawnlight Reliquary', ico: '🕊️', sz: 2, cd: 6.0, eff: { heal: 12, cleanse: 1 }, tags: ['Heal', 'Cleanse'], heroId: 'queen', adj: { mode: 'self', needTag: 'Shield', add: { heal: 6 }, desc: 'Beside a Shield ware: +6 heal.' }, flav: 'Kept lit since the first dawn. It remembers.' },
  { id: 'keepwall', nm: 'Keep Wall', ico: '🏰', sz: 3, cd: 5.0, eff: { shield: 14 }, thorns: 3, tags: ['Shield', 'Thorns'], heroId: 'queen', adj: { mode: 'aura', add: { thorns: 1 }, desc: 'Adjacent wares gain +1 thorns.' }, flav: 'Old stone. Sharp intentions.' },
  { id: 'loyalguard', nm: 'Loyal Guard', ico: '⚜️', sz: 1, cd: 3.6, eff: { dmg: 3, shield: 7 }, tags: ['Damage', 'Shield'], heroId: 'queen', adj: { mode: 'self', needTag: 'Gold', add: { shield: 5 }, desc: 'Beside a Gold ware: +5 shield.' }, flav: 'Guards the purse first, the realm second.' },

  // 🗿 The Fire Golem — adjacency: burn & thorns
  // Roles: coat-weapons enabler, go-wide burn scaler, the one +thorns aura,
  // targeted burn aura + haste, burn-gated shield, detonate payoff.
  { id: 'emberbrand', nm: 'Emberbrand', ico: '🔥', sz: 1, cd: 4.0, eff: { burn: 3 }, tags: ['Burn'], heroId: 'golem', adj: { mode: 'aura', targetTag: 'Damage', add: { burn: 1 }, desc: 'Adjacent Damage wares also apply +1 burn.' }, flav: 'Touch a cold blade to it. Now it is a hot blade.' },
  { id: 'caldera', nm: 'Caldera Heart', ico: '🌋', sz: 3, cd: 6.0, eff: { burn: 5, dmg: 4 }, tags: ['Burn', 'Damage'], heroId: 'golem', adj: { mode: 'self', perTag: 'Burn', add: { burn: 2 }, desc: '+2 burn for each adjacent Burn ware.' }, flav: 'The mountain kept its temper here. Barely.' },
  { id: 'slagplate', nm: 'Slagplate', ico: '🪨', sz: 2, cd: 4.5, eff: { shield: 8 }, thorns: 3, tags: ['Shield', 'Thorns'], heroId: 'golem', adj: { mode: 'aura', add: { thorns: 2 }, desc: 'Adjacent wares gain +2 thorns.' }, flav: 'Cooled wrong, on purpose. Now it bites.' },
  { id: 'cindervents', nm: 'Cinder Vents', ico: '💨', sz: 1, cd: 5.0, eff: { burn: 3, haste: 1 }, tags: ['Burn', 'Haste'], heroId: 'golem', adj: { mode: 'aura', targetTag: 'Burn', add: { burn: 1 }, desc: 'Adjacent Burn wares apply +1 burn.' }, flav: 'It breathes for the fire next to it.' },
  { id: 'forgewall', nm: 'Forgewall', ico: '🧱', sz: 2, cd: 5.0, eff: { shield: 10 }, tags: ['Shield'], heroId: 'golem', adj: { mode: 'self', needTag: 'Burn', add: { shield: 5 }, desc: 'Beside a Burn ware: +5 shield.' }, flav: 'Tempered by the flame it stands beside.' },
  { id: 'magmalash', nm: 'Magma Lash', ico: '☄️', sz: 2, cd: 4.4, eff: { dmg: 7 }, consume: 'burn', tags: ['Damage', 'Burn'], heroId: 'golem', flav: 'Cracks the crust off a burning foe and lets it all out at once.' },

  // 👺 The Goblin — adjacency: gold & tempo
  // Roles: gold go-wide scaler, the one +haste-stat aura, gold-gated dmg+ramp,
  // gold + skim aura, positional multistrike, the one +slow aura.
  { id: 'powderkeg', nm: 'Powderkeg', ico: '💣', sz: 1, cd: 5.0, eff: { dmg: 6 }, goldScale: true, tags: ['Damage', 'Gold'], heroId: 'goblin', adj: { mode: 'self', perTag: 'Gold', add: { dmg: 3 }, desc: '+3 damage for each adjacent Gold ware.' }, flav: 'Funded, fused, and pointed away from you. Mostly.' },
  { id: 'juryrig', nm: 'Jury-Rig', ico: '🔧', sz: 1, cd: 5.0, eff: { haste: 1.2 }, tags: ['Haste'], heroId: 'goblin', adj: { mode: 'aura', add: { haste: 0.5 }, desc: 'Adjacent wares also haste your stall +0.5s when they fire.' }, flav: 'Held together with spite and one good bolt.' },
  { id: 'loadeddice', nm: 'Loaded Dice', ico: '🎲', sz: 1, cd: 4.6, eff: { dmg: 4 }, ramp: 2, tags: ['Damage', 'Ramp'], heroId: 'goblin', adj: { mode: 'self', needTag: 'Gold', add: { dmg: 3, ramp: 2 }, desc: 'Beside a Gold ware: +3 damage & +2 ramp.' }, flav: 'They roll your way, harder, when the price is right.' },
  { id: 'pickpocket', nm: 'Pickpocket Rig', ico: '🪙', sz: 1, cd: 0, eff: { income: 2 }, tags: ['Gold'], heroId: 'goblin', adj: { mode: 'aura', add: { dmg: 1, haste: 0.4 }, desc: 'Adjacent wares deal +1 damage and gain +0.4s haste. (+2 gold each night)' }, flav: 'Skims a little off everything nearby.' },
  { id: 'scraplobber', nm: 'Scrap Lobber', ico: '🧨', sz: 2, cd: 5.0, eff: { dmg: 10 }, tags: ['Damage'], heroId: 'goblin', adj: { mode: 'self', needTag: 'Damage', add: { hits: 1 }, desc: 'Beside a Damage ware: +1 hit.' }, flav: 'Reloads with whatever the neighbour dropped.' },
  { id: 'oilslick', nm: 'Oil Slick', ico: '🛢️', sz: 1, cd: 4.0, eff: { dmg: 3, slow: 1.3 }, tags: ['Damage', 'Slow'], heroId: 'goblin', adj: { mode: 'aura', add: { slow: 1 }, desc: 'Adjacent wares slow the foe +1s.' }, flav: "Spilled on purpose. Aren't they always?" },

  // 🦅 The Griffin — adjacency: crit & execute
  // Roles: the one +crit aura, execute self, big-crit self, go-wide crit scaler,
  // positional multistrike, the one +execute aura.
  { id: 'galefeather', nm: 'Gale Feather', ico: '🪶', sz: 1, cd: 3.0, eff: { dmg: 5 }, tags: ['Damage'], heroId: 'griffin', adj: { mode: 'aura', add: { crit: 0.08 }, desc: 'Adjacent wares gain +8% crit.' }, flav: 'Light enough to ride the wind. Sharp enough to end it.' },
  { id: 'cyclonedive', nm: 'Cyclone Dive', ico: '🌪️', sz: 2, cd: 5.0, eff: { dmg: 9 }, execute: 12, tags: ['Damage', 'Execute'], heroId: 'griffin', adj: { mode: 'self', needTag: 'Damage', add: { execute: 8 }, desc: 'Beside a Damage ware: +8 execute.' }, flav: 'Down it comes, and the wind comes with it.' },
  { id: 'wingmate', nm: 'Wingmate', ico: '🦅', sz: 1, cd: 4.0, eff: { dmg: 4 }, tags: ['Damage'], heroId: 'griffin', adj: { mode: 'self', needTag: 'Damage', add: { crit: 0.2 }, desc: 'Beside a Damage ware: +20% crit.' }, flav: 'Hunts in pairs. Never misses in pairs.' },
  { id: 'tempestcoil', nm: 'Tempest Coil', ico: '⛈️', sz: 2, cd: 4.6, eff: { dmg: 5, slow: 1 }, tags: ['Damage', 'Slow'], heroId: 'griffin', adj: { mode: 'self', perTag: 'Damage', add: { crit: 0.12 }, desc: '+12% crit for each adjacent Damage ware.' }, flav: 'A storm wound tight, fed by every blade near it.' },
  { id: 'skyvolley', nm: 'Skyvolley', ico: '🏹', sz: 2, cd: 4.2, eff: { dmg: 4 }, hits: 3, pierce: true, tags: ['Damage', 'Pierce'], heroId: 'griffin', adj: { mode: 'self', flanked: true, add: { hits: 1 }, desc: 'Flanked on both sides: +1 hit.' }, flav: 'Loose them all at once and ask questions never.' },
  { id: 'stoopingtalon', nm: 'Stooping Talon', ico: '🗡️', sz: 2, cd: 5.0, eff: { dmg: 7 }, execute: 14, tags: ['Damage', 'Execute'], heroId: 'griffin', adj: { mode: 'aura', add: { execute: 6 }, desc: 'Adjacent wares gain +6 execute.' }, flav: 'It teaches the wares beside it how to finish.' },

  // 🪦 Fiend-only wares — never sold in the market
  { id: 'tombstone', nm: 'Tombstone Bulwark', ico: '🪦', sz: 3, cd: 5.0, eff: { shield: 34 }, thorns: 3, tags: ['Shield', 'Thorns'], fiendOnly: true, flav: 'It turns aside every blade. Bring what slips through stone.' },
];

export const ITEM_BY_ID: Readonly<Record<string, ItemDef>> = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);

/** Wares purchasable in the market (excludes fiend-only gear). */
export const MARKET_ITEMS: readonly ItemDef[] = ITEMS.filter((i) => !i.fiendOnly);
