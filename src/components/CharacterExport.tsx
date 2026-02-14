'use client';

import React from 'react';
import { FileDown, Printer } from 'lucide-react';
import { Character, ALL_SKILLS, CLASS_SAVING_THROWS } from '@/lib/types';

// ============================================================
// Character PDF Export — Generates a printable D&D 5e character sheet
// Uses a hidden iframe with print-ready HTML
// ============================================================

function mod(score: number) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function generateCharacterHTML(ch: Character): string {
  const s = ch.abilityScores;
  const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
  const profBonus = ch.proficiencyBonus;

  const skillRows = ALL_SKILLS.map(sk => {
    const charSkill = ch.skills.find(s => s.name === sk.name);
    const isProficient = charSkill?.proficient || false;
    const ability = sk.ability;
    const abilityMod = Math.floor((s[ability] - 10) / 2);
    const bonus = abilityMod + (isProficient ? profBonus : 0);
    return `<tr><td>${isProficient ? '●' : '○'}</td><td>${bonus >= 0 ? '+' : ''}${bonus}</td><td>${sk.name}</td><td style="font-size:9px;color:#888">(${ability.slice(0, 3).toUpperCase()})</td></tr>`;
  }).join('');

  const savingThrowProfs = CLASS_SAVING_THROWS[ch.class] || [];

  const savingThrows = abilities.map(ab => {
    const isProficient = savingThrowProfs.includes(ab);
    const abilityMod = Math.floor((s[ab] - 10) / 2);
    const bonus = abilityMod + (isProficient ? profBonus : 0);
    return `<tr><td>${isProficient ? '●' : '○'}</td><td>${bonus >= 0 ? '+' : ''}${bonus}</td><td>${ab.charAt(0).toUpperCase() + ab.slice(1)}</td></tr>`;
  }).join('');

  const inventory = (ch.inventory || []).map(item =>
    `<tr><td>${item.name}</td><td style="text-align:center">${item.quantity}</td><td style="font-size:9px">${item.weight ? item.weight + ' lb' : ''}</td></tr>`
  ).join('');

  const spells = (ch.knownSpells || []).map(sp =>
    `<tr><td>${sp.name}</td><td style="text-align:center">${sp.level === 0 ? 'C' : sp.level}</td><td style="font-size:9px">${sp.school || ''}</td><td>${sp.prepared ? '✓' : ''}</td></tr>`
  ).join('');

  const feats = (ch.feats || []).map(f =>
    `<div style="margin-bottom:4px"><strong>${f.name}</strong>${f.description ? ': <span style="font-size:9px;color:#555">' + f.description + '</span>' : ''}</div>`
  ).join('');

  return `<!DOCTYPE html><html><head><title>${ch.name} — Character Sheet</title>
<style>
  @media print { body { margin: 0; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11px; color: #1a1a1a; padding: 16px; max-width: 800px; margin: auto; }
  h1 { font-size: 20px; margin-bottom: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 2px; margin: 12px 0 6px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .ability-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center; margin-bottom: 8px; }
  .ability-box { border: 2px solid #ccc; border-radius: 6px; padding: 4px; }
  .ability-box .label { font-size: 9px; text-transform: uppercase; color: #666; }
  .ability-box .score { font-size: 18px; font-weight: bold; }
  .ability-box .mod { font-size: 12px; color: #7c3aed; }
  .stat-box { background: #f5f5f5; border-radius: 6px; padding: 6px 8px; text-align: center; }
  .stat-box .label { font-size: 9px; text-transform: uppercase; color: #888; }
  .stat-box .value { font-size: 16px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  td { padding: 2px 4px; }
  .personality { background: #fafafa; border-radius: 6px; padding: 6px; margin-bottom: 4px; }
  .personality .plabel { font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 2px; }
  .section { break-inside: avoid; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style></head><body>
  <div class="header">
    <div>
      <h1>${ch.name}</h1>
      <div style="color:#666">${ch.race} ${ch.class} (Level ${ch.level})${ch.alignment ? ' — ' + ch.alignment : ''}</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#888">
      <div>Proficiency Bonus: +${profBonus}</div>
      <div>Experience: ${ch.experiencePoints || 0} XP</div>
    </div>
  </div>

  <!-- Ability Scores -->
  <div class="ability-grid">
    ${abilities.map(ab => `<div class="ability-box"><div class="label">${ab.slice(0, 3)}</div><div class="score">${s[ab]}</div><div class="mod">${mod(s[ab])}</div></div>`).join('')}
  </div>

  <!-- Combat Stats -->
  <div class="grid" style="margin-bottom:12px">
    <div class="stat-box"><div class="label">Armor Class</div><div class="value">${ch.armorClass}</div></div>
    <div class="stat-box"><div class="label">Hit Points</div><div class="value">${ch.hp.current}/${ch.hp.max}</div></div>
    <div class="stat-box"><div class="label">Speed</div><div class="value">${ch.speed} ft</div></div>
  </div>

  <div class="columns">
    <div>
      <!-- Saving Throws -->
      <div class="section">
        <h2>Saving Throws</h2>
        <table>${savingThrows}</table>
      </div>

      <!-- Skills -->
      <div class="section">
        <h2>Skills</h2>
        <table>${skillRows}</table>
      </div>
    </div>
    <div>
      <!-- Personality -->
      <div class="section">
        <h2>Personality</h2>
        ${ch.traits ? `<div class="personality"><div class="plabel">Traits</div>${ch.traits}</div>` : ''}
        ${ch.ideals ? `<div class="personality"><div class="plabel">Ideals</div>${ch.ideals}</div>` : ''}
        ${ch.bonds ? `<div class="personality"><div class="plabel">Bonds</div>${ch.bonds}</div>` : ''}
        ${ch.flaws ? `<div class="personality"><div class="plabel">Flaws</div>${ch.flaws}</div>` : ''}
        ${ch.backstory ? `<div class="personality"><div class="plabel">Backstory</div>${ch.backstory}</div>` : ''}
      </div>

      <!-- Feats -->
      ${feats ? `<div class="section"><h2>Feats & Features</h2>${feats}</div>` : ''}

      <!-- Currency -->
      <div class="section">
        <h2>Currency</h2>
        <div class="grid" style="grid-template-columns: repeat(5,1fr)">
          <div class="stat-box"><div class="label">CP</div><div class="value">${ch.currency?.cp || 0}</div></div>
          <div class="stat-box"><div class="label">SP</div><div class="value">${ch.currency?.sp || 0}</div></div>
          <div class="stat-box"><div class="label">EP</div><div class="value">${ch.currency?.ep || 0}</div></div>
          <div class="stat-box"><div class="label">GP</div><div class="value">${ch.currency?.gp || 0}</div></div>
          <div class="stat-box"><div class="label">PP</div><div class="value">${ch.currency?.pp || 0}</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Inventory -->
  ${(ch.inventory || []).length > 0 ? `<div class="section"><h2>Inventory</h2><table><tr><th style="text-align:left">Item</th><th>Qty</th><th>Weight</th></tr>${inventory}</table></div>` : ''}

  <!-- Spells -->
  ${(ch.knownSpells || []).length > 0 ? `<div class="section"><h2>Spells</h2><table><tr><th style="text-align:left">Spell</th><th>Lvl</th><th>School</th><th>Prep</th></tr>${spells}</table></div>` : ''}

  <!-- Spell Slots -->
  ${(ch.spellSlots || []).length > 0 ? `
  <div class="section"><h2>Spell Slots</h2>
  <div class="grid" style="grid-template-columns: repeat(${Math.min(ch.spellSlots!.length, 9)}, 1fr)">
    ${(ch.spellSlots || []).map(sl => `<div class="stat-box"><div class="label">Level ${sl.level}</div><div class="value">${sl.total - sl.used}/${sl.total}</div></div>`).join('')}
  </div></div>` : ''}

  <div style="margin-top:16px;text-align:center;color:#ccc;font-size:9px">Generated by TAVERNA — taverna.app</div>
</body></html>`;
}

// ============================================================
// Export Button Component
// ============================================================
interface CharacterExportProps {
  character: Character;
  variant?: 'button' | 'icon';
}

export default function CharacterExport({ character, variant = 'button' }: CharacterExportProps) {
  const handleExport = () => {
    const html = generateCharacterHTML(character);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadHTML = () => {
    const html = generateCharacterHTML(character);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_character_sheet.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (variant === 'icon') {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleExport}
          className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-md hover:bg-surface-2 transition-colors"
          title="Print Character Sheet"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={handleDownloadHTML}
          className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-md hover:bg-surface-2 transition-colors"
          title="Download Character Sheet"
        >
          <FileDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium cursor-pointer hover:bg-accent/20 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" /> Print Sheet
      </button>
      <button
        onClick={handleDownloadHTML}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 text-text-secondary rounded-lg text-xs font-medium cursor-pointer hover:bg-surface-3 transition-colors"
      >
        <FileDown className="w-3.5 h-3.5" /> Download HTML
      </button>
    </div>
  );
}
