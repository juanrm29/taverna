'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Trash2, Plus, Zap, Play, Table } from 'lucide-react';
import { Button, Card, Badge, Input, Modal, EmptyState, Textarea } from '@/components/ui';
import * as api from '@/lib/api-client';
import { formatModifier } from '@/lib/types';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';

interface RollRecord {
  id: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
  label?: string;
  isAdvantage?: boolean;
  isDisadvantage?: boolean;
  keptRoll?: number;
  discardedRoll?: number;
}

const QUICK_DICE = [
  { label: 'd4', formula: '1d4' },
  { label: 'd6', formula: '1d6' },
  { label: 'd8', formula: '1d8' },
  { label: 'd10', formula: '1d10' },
  { label: 'd12', formula: '1d12' },
  { label: 'd20', formula: '1d20' },
  { label: 'd100', formula: '1d100' },
];

const COMMON_ROLLS: { label: string; formula: string; adv?: boolean; dis?: boolean }[] = [
  { label: 'Attack (d20)', formula: '1d20' },
  { label: 'Advantage', formula: '2d20kh1', adv: true },
  { label: 'Disadvantage', formula: '2d20kl1', dis: true },
  { label: 'Fireball (8d6)', formula: '8d6' },
  { label: 'Greatsword (2d6)', formula: '2d6' },
  { label: 'Sneak Attack (3d6)', formula: '3d6' },
  { label: 'Healing Word (1d4+3)', formula: '1d4+3' },
  { label: 'Stats (4d6kh3)', formula: '4d6kh3' },
];

type TabKey = 'roller' | 'macros' | 'tables';

export default function DiceRollerPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: session } = useSession();
  const user = session?.user;
  const [formula, setFormula] = useState('1d20');
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [lastRoll, setLastRoll] = useState<RollRecord | null>(null);
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [tab, setTab] = useState<TabKey>('roller');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  // Macros
  const [macros, setMacros] = useState<any[]>([]);
  const [showAddMacro, setShowAddMacro] = useState(false);
  const [macroName, setMacroName] = useState('');
  const [macroFormula, setMacroFormula] = useState('');
  const [macroLabel, setMacroLabel] = useState('');

  // Tables
  const [tables, setTables] = useState<any[]>([]);
  const [showAddTable, setShowAddTable] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableEntries, setTableEntries] = useState('');

  // Load campaigns
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const camps = await api.getCampaigns();
        setCampaigns(camps);
        if (camps.length > 0 && !selectedCampaign) setSelectedCampaign(camps[0].id);
      } catch (err) { console.error(err); }
    })();
  }, [user, selectedCampaign]);

  // Load macros and tables for selected campaign
  useEffect(() => {
    if (!selectedCampaign) return;
    (async () => {
      try {
        const [m, t] = await Promise.all([
          api.getMacros(selectedCampaign),
          api.getRollableTables(selectedCampaign),
        ]);
        setMacros(m);
        setTables(t);
      } catch (err) { console.error(err); }
    })();
  }, [selectedCampaign]);

  const roll = useCallback((f?: string, adv?: boolean, dis?: boolean) => {
    const target = f || formula;
    const mode = adv ? 'advantage' : dis ? 'disadvantage' : rollMode;

    if (mode === 'advantage') {
      const r1 = api.rollDiceLocal(target);
      const r2 = api.rollDiceLocal(target);
      const kept = r1.total >= r2.total ? r1 : r2;
      const discarded = r1.total >= r2.total ? r2 : r1;
      const record: RollRecord = { id: Date.now().toString(), formula: target, ...kept, timestamp: new Date(), isAdvantage: true, keptRoll: kept.total, discardedRoll: discarded.total, label: 'Advantage' };
      setLastRoll(record);
      setHistory(prev => [record, ...prev].slice(0, 50));
      window.dispatchEvent(new CustomEvent('taverna:dice-roll', { detail: { formula: target, rolls: kept.rolls, total: kept.total, modifier: kept.modifier, source: 'dice-page', label: 'Advantage' } }));
    } else if (mode === 'disadvantage') {
      const r1 = api.rollDiceLocal(target);
      const r2 = api.rollDiceLocal(target);
      const kept = r1.total <= r2.total ? r1 : r2;
      const discarded = r1.total <= r2.total ? r2 : r1;
      const record: RollRecord = { id: Date.now().toString(), formula: target, ...kept, timestamp: new Date(), isDisadvantage: true, keptRoll: kept.total, discardedRoll: discarded.total, label: 'Disadvantage' };
      setLastRoll(record);
      setHistory(prev => [record, ...prev].slice(0, 50));
      window.dispatchEvent(new CustomEvent('taverna:dice-roll', { detail: { formula: target, rolls: kept.rolls, total: kept.total, modifier: kept.modifier, source: 'dice-page', label: 'Disadvantage' } }));
    } else {
      const result = api.rollDiceLocal(target);
      const record: RollRecord = { id: Date.now().toString(), formula: target, ...result, timestamp: new Date() };
      setLastRoll(record);
      setHistory(prev => [record, ...prev].slice(0, 50));
      window.dispatchEvent(new CustomEvent('taverna:dice-roll', { detail: { formula: target, rolls: result.rolls, total: result.total, modifier: result.modifier, source: 'dice-page' } }));
    }
  }, [formula, rollMode]);

  const clearHistory = () => { setHistory([]); setLastRoll(null); };

  // Macro actions
  const addMacro = async () => {
    if (!macroName.trim() || !macroFormula.trim()) return;
    try {
      const m = await api.createMacro(selectedCampaign, { name: macroName.trim(), formula: macroFormula.trim(), label: macroLabel.trim() || undefined });
      setMacros(prev => [...prev, m]);
      setShowAddMacro(false);
      setMacroName(''); setMacroFormula(''); setMacroLabel('');
      toast.success(t.dice.macroCreated);
    } catch (err: any) { toast.error(err.message); }
  };

  const runMacro = (macro: any) => {
    const result = api.rollDiceLocal(macro.formula);
    const record: RollRecord = { id: Date.now().toString(), formula: macro.formula, ...result, timestamp: new Date(), label: macro.label || macro.name };
    setLastRoll(record);
    setHistory(prev => [record, ...prev].slice(0, 50));
    setTab('roller');
    toast.info(`🎲 ${macro.name}: ${result.total}`);
    window.dispatchEvent(new CustomEvent('taverna:dice-roll', { detail: { formula: macro.formula, rolls: result.rolls, total: result.total, modifier: result.modifier, source: 'dice-page', label: macro.label || macro.name } }));
  };

  // Table actions
  const addTable = async () => {
    if (!tableName.trim() || !tableEntries.trim()) return;
    try {
      const entries = tableEntries.split('\n').filter(Boolean).map((line, i) => ({ rangeMin: i + 1, rangeMax: i + 1, text: line.trim(), weight: 1 }));
      const t = await api.createRollableTable(selectedCampaign, { name: tableName.trim(), entries, diceFormula: `1d${entries.length}` });
      setTables(prev => [...prev, t]);
      setShowAddTable(false);
      setTableName(''); setTableEntries('');
      toast.success(t.dice.tableCreated);
    } catch (err: any) { toast.error(err.message); }
  };

  const rollOnTableFn = async (tableId: string) => {
    try {
      const result = await api.rollOnTable(tableId);
      if (result) toast.info(`🎲 ${typeof result === 'string' ? result : JSON.stringify(result)}`);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">{t.dice.advancedDice}</h1>
      <p className="text-text-secondary text-sm mb-6">{t.dice.subtitle}</p>

      {campaigns.length > 1 && (
        <div className="mb-4">
          <select className="bg-surface-1 border border-border rounded-md px-3 py-1.5 text-sm" value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}>
            {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-1 mb-6">
        {([
          { key: 'roller' as TabKey, label: t.dice.roller, icon: <Dices className="w-4 h-4" /> },
          { key: 'macros' as TabKey, label: `${t.dice.macros} (${macros.length})`, icon: <Zap className="w-4 h-4" /> },
          { key: 'tables' as TabKey, label: `${t.dice.tables} (${tables.length})`, icon: <Table className="w-4 h-4" /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${tab === t.key ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-2'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'roller' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card className="text-center py-8">
              <AnimatePresence mode="wait">
                {lastRoll ? (
                  <motion.div key={lastRoll.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <div className="text-6xl font-bold text-accent font-mono mb-2">{lastRoll.total}</div>
                    <div className="text-sm text-text-tertiary font-mono">
                      {lastRoll.formula} → [{lastRoll.rolls.join(', ')}]
                      {lastRoll.modifier !== 0 && ` ${formatModifier(lastRoll.modifier)}`}
                    </div>
                    {lastRoll.label && <div className="text-xs text-accent mt-1">{lastRoll.label}</div>}
                    {lastRoll.isAdvantage && <p className="text-xs text-success mt-1">Advantage — kept {lastRoll.keptRoll}, discarded {lastRoll.discardedRoll}</p>}
                    {lastRoll.isDisadvantage && <p className="text-xs text-danger mt-1">Disadvantage — kept {lastRoll.keptRoll}, discarded {lastRoll.discardedRoll}</p>}
                    {lastRoll.formula.includes('d20') && lastRoll.rolls.length === 1 && lastRoll.rolls[0] === 20 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm font-bold text-success">{t.dice.nat20}</motion.div>
                    )}
                    {lastRoll.formula.includes('d20') && lastRoll.rolls.length === 1 && lastRoll.rolls[0] === 1 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm font-bold text-danger">{t.dice.nat1}</motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-tertiary">
                    <Dices className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.dice.rollSomeDice}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            <div className="flex gap-2">
              <input type="text" className="flex-1 bg-surface-1 border border-border rounded-md px-4 py-3 text-lg font-mono text-center focus:outline-none focus:border-accent-dim" value={formula} onChange={e => setFormula(e.target.value)} onKeyDown={e => e.key === 'Enter' && roll()} placeholder="2d6+3" />
              <Button onClick={() => roll()} className="px-6"><Dices className="w-5 h-5" /> Roll</Button>
            </div>

            <div className="flex gap-2">
              {(['normal', 'advantage', 'disadvantage'] as const).map(mode => (
                <button key={mode} onClick={() => setRollMode(mode)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${rollMode === mode ? mode === 'advantage' ? 'bg-success/15 text-success' : mode === 'disadvantage' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent' : 'text-text-tertiary hover:bg-surface-2'}`}>
                  {mode === 'normal' ? t.dice.normal : mode === 'advantage' ? t.dice.advantage : t.dice.disadvantage}
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">{t.dice.quickRoll}</h3>
              <div className="flex flex-wrap gap-2">
                {QUICK_DICE.map(d => (
                  <button key={d.formula} onClick={() => { setFormula(d.formula); roll(d.formula); }} className="px-4 py-2 bg-surface-1 border border-border rounded-md text-sm font-mono hover:border-accent hover:text-accent transition-colors cursor-pointer">{d.label}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">{t.dice.commonRolls}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMMON_ROLLS.map(d => (
                  <button key={d.label} onClick={() => { setFormula(d.formula); roll(d.formula, d.adv, d.dis); }} className="px-3 py-2 bg-surface-1 border border-border rounded-md text-sm text-left hover:border-accent transition-colors cursor-pointer">
                    <div className="text-text-primary text-xs font-medium">{d.label}</div>
                    <div className="text-text-tertiary text-[10px] font-mono">{d.formula}</div>
                  </button>
                ))}
              </div>
            </div>

            {macros.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">{t.dice.yourMacros}</h3>
                <div className="flex flex-wrap gap-2">
                  {macros.map((m: any) => (
                    <button key={m.id} onClick={() => runMacro(m)} className="px-3 py-2 bg-accent/10 border border-accent/20 rounded-md text-sm hover:bg-accent/20 transition-colors cursor-pointer">
                      <div className="text-accent text-xs font-medium">{m.name}</div>
                      <div className="text-text-tertiary text-[10px] font-mono">{m.formula}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase">{t.dice.history}</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-text-tertiary hover:text-danger transition-colors cursor-pointer flex items-center gap-1"><Trash2 className="w-3 h-3" /> {t.dice.clear}</button>
              )}
            </div>
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {history.length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-8">{t.dice.noRolls}</p>
              ) : (
                history.map((r, i) => (
                  <motion.div key={r.id} initial={i === 0 ? { opacity: 0, x: 10 } : false} animate={{ opacity: 1, x: 0 }}>
                    <Card className={`!p-2.5 ${i === 0 ? 'border-accent/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs text-text-tertiary">{r.formula}</span>
                          {r.label && <span className="text-[10px] text-accent ml-1">({r.label})</span>}
                          <span className="text-text-tertiary text-xs mx-1.5">→</span>
                          <span className="font-mono text-xs text-text-tertiary">[{r.rolls.join(',')}]</span>
                        </div>
                        <span className="font-bold text-accent font-mono">{r.total}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'macros' && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddMacro(true)}><Plus className="w-3.5 h-3.5" /> {t.dice.newMacro}</Button></div>
          {macros.length === 0 ? (
            <EmptyState icon={<Zap className="w-12 h-12" />} title={t.dice.noMacros} description={t.dice.noMacrosDesc} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {macros.map((m: any) => (
                <Card key={m.id} className="group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-sm">{m.name}</h3>
                      <p className="font-mono text-xs text-accent">{m.formula}</p>
                      {m.label && <p className="text-[10px] text-text-tertiary">{m.label}</p>}
                    </div>
                    <button onClick={async () => { try { await api.deleteMacro(m.id); setMacros(prev => prev.filter((x: any) => x.id !== m.id)); } catch {} }} className="text-text-tertiary hover:text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => runMacro(m)} className="w-full"><Play className="w-3 h-3" /> Roll</Button>
                </Card>
              ))}
            </div>
          )}
          <Modal open={showAddMacro} onClose={() => setShowAddMacro(false)} title={t.dice.newMacro}>
            <div className="space-y-4">
              <Input label="Name" value={macroName} onChange={e => setMacroName(e.target.value)} placeholder="Attack Roll" />
              <Input label={t.dice.formula} value={macroFormula} onChange={e => setMacroFormula(e.target.value)} placeholder="1d20+5" />
              <Input label={t.dice.labelOptional} value={macroLabel} onChange={e => setMacroLabel(e.target.value)} placeholder="Longsword Attack" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddMacro(false)}>Cancel</Button>
                <Button size="sm" onClick={addMacro} disabled={!macroName.trim() || !macroFormula.trim()}>Create</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddTable(true)}><Plus className="w-3.5 h-3.5" /> {t.dice.newTable}</Button></div>
          {tables.length === 0 ? (
            <EmptyState icon={<Table className="w-12 h-12" />} title={t.dice.noTables} description={t.dice.noTablesDesc} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tables.map((t: any) => (
                <Card key={t.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">{t.name}</h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => rollOnTableFn(t.id)}><Dices className="w-3 h-3" /> Roll</Button>
                      <button onClick={async () => { try { await api.deleteRollableTable(t.id); setTables(prev => prev.filter((x: any) => x.id !== t.id)); } catch {} }} className="text-text-tertiary hover:text-danger cursor-pointer p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {(t.entries || []).map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-text-tertiary font-mono w-6 text-right">{i + 1}</span>
                        <span className="text-text-secondary">{e.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Modal open={showAddTable} onClose={() => setShowAddTable(false)} title={t.dice.newTable}>
            <div className="space-y-4">
              <Input label={t.dice.tableName} value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Random Encounter" />
              <Textarea label={t.dice.entries} value={tableEntries} onChange={e => setTableEntries(e.target.value)} placeholder={"Goblin patrol\nWandering merchant\nNothing happens\nWild beast attack"} />
              <p className="text-[10px] text-text-tertiary">{t.dice.entriesHelp}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddTable(false)}>Cancel</Button>
                <Button size="sm" onClick={addTable} disabled={!tableName.trim() || !tableEntries.trim()}>Create</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
