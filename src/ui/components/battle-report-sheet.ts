import type { BattleReport, SideBattleReport } from '@/game/battle-report';
import { sideTotals, totalDamage } from '@/game/battle-report';
import { animateSheet } from '@/fx/animations';
import { $ } from '@/ui/dom';
import { itemIconHtml } from '@/ui/item-icon';

/** Ranked "top contributors" list — the default, phone-friendly view. */
function renderTop(side: SideBattleReport): string {
  const ranked = side.rows
    .map((r) => ({ r, total: totalDamage(r) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  if (ranked.length === 0) {
    return '<p class="br-empty">No damage dealt</p>';
  }

  const max = ranked[0].total;
  return `<ul class="br-top">${ranked
    .map(({ r, total }, i) => {
      const pct = Math.max(6, Math.round((total / max) * 100));
      const dot = r.burnDamage + r.poisonDamage;
      const sub = [
        r.damage > 0 ? `${r.damage} hit` : '',
        dot > 0 ? `${dot} DoT` : '',
        r.thornsDamage > 0 ? `${r.thornsDamage} thorns` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `<li class="br-top-row${i === 0 ? ' mvp' : ''}">
        <span class="br-ico">${itemIconHtml(r.ico, r.nm)}</span>
        <span class="br-top-main">
          <span class="br-top-name">${r.nm}${i === 0 ? ' <em class="br-mvp-tag">MVP</em>' : ''}</span>
          <span class="br-bar"><i style="width:${pct}%"></i></span>
          ${sub ? `<span class="br-top-sub">${sub}</span>` : ''}
        </span>
        <span class="br-top-total">${total}</span>
      </li>`;
    })
    .join('')}</ul>`;
}

function renderSummary(side: SideBattleReport): string {
  const t = sideTotals(side.rows);
  const dealt = t.damage + t.burnDamage + t.poisonDamage + t.thornsDamage;
  const dot = t.burnDamage + t.poisonDamage;

  const stats = [
    { v: dealt, l: 'dealt', cls: 'dealt' },
    { v: dot, l: 'DoT', cls: 'dot' },
    { v: t.thornsDamage, l: 'thorns', cls: 'thorns' },
    { v: t.heal, l: 'healed', cls: 'heal' },
    { v: t.shield, l: 'shield', cls: 'shield' },
  ].filter((s) => s.v > 0);

  if (stats.length === 0) stats.push({ v: 0, l: 'dealt', cls: 'dealt' });

  return `<div class="br-summary">${stats
    .map((s) => `<div class="br-stat ${s.cls}"><b>${s.v}</b><span>${s.l}</span></div>`)
    .join('')}</div>`;
}

function renderSide(side: SideBattleReport): string {
  return `
    <section class="br-side">
      <h4 class="br-side-title">${side.label}</h4>
      ${renderSummary(side)}
      ${renderTop(side)}
    </section>`;
}

export function openBattleReport(report: BattleReport): void {
  const sheet = $('battle-report-sheet');
  sheet.innerHTML = `
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head">
      <h3><span class="sheet-title">Battle Report</span></h3>
    </div>
    <div class="sheet-body battle-report-body">
      ${renderSide(report.player)}
      ${renderSide(report.enemy)}
    </div>
    <div class="sheet-foot">
      <div class="actions">
        <button class="btn primary" data-action="close">Close</button>
      </div>
    </div>`;

  $('report-overlay').classList.add('on');
  animateSheet(sheet);
  sheet.querySelector('[data-action="close"]')?.addEventListener('click', closeBattleReport);
}

export function closeBattleReport(): void {
  $('report-overlay').classList.remove('on');
}

export function bindReportOverlay(onClose: () => void): void {
  $('report-overlay').addEventListener('pointerdown', (e) => {
    if (e.target === $('report-overlay')) onClose();
  });
}
