'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  description: string | null;
  category: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

type GroupedSettings = Record<string, SystemSetting[]>;

const CATEGORY_ICONS: Record<string, string> = {
  general: '⚙️',
  gameplay: '🎮',
  moderation: '🛡️',
  notifications: '🔔',
  appearance: '🎨',
  limits: '📏',
  features: '✨',
  security: '🔒',
};

const DEFAULT_SETTINGS: { key: string; value: string; label: string; description: string; category: string; type: string }[] = [
  { key: 'site.name', value: 'TAVERNA', label: 'Site Name', description: 'Platform display name', category: 'general', type: 'string' },
  { key: 'site.description', value: 'Virtual Tabletop for D&D', label: 'Site Description', description: 'Short platform description', category: 'general', type: 'string' },
  { key: 'site.maintenance', value: 'false', label: 'Maintenance Mode', description: 'Enable to put the site in maintenance mode', category: 'general', type: 'boolean' },
  { key: 'registration.enabled', value: 'true', label: 'Registration Enabled', description: 'Allow new user registrations', category: 'general', type: 'boolean' },
  { key: 'campaign.maxPlayers', value: '8', label: 'Max Players per Campaign', description: 'Maximum players allowed in a single campaign', category: 'limits', type: 'number' },
  { key: 'campaign.maxPerUser', value: '10', label: 'Max Campaigns per User', description: 'Maximum campaigns a user can own', category: 'limits', type: 'number' },
  { key: 'character.maxPerUser', value: '20', label: 'Max Characters per User', description: 'Maximum characters a user can create', category: 'limits', type: 'number' },
  { key: 'chat.maxMessageLength', value: '2000', label: 'Max Message Length', description: 'Maximum characters per chat message', category: 'limits', type: 'number' },
  { key: 'chat.rateLimitPerMinute', value: '30', label: 'Chat Rate Limit', description: 'Max messages per minute per user', category: 'limits', type: 'number' },
  { key: 'moderation.autoban.enabled', value: 'false', label: 'Auto-Ban System', description: 'Automatically ban users after threshold reports', category: 'moderation', type: 'boolean' },
  { key: 'moderation.autoban.threshold', value: '5', label: 'Auto-Ban Report Threshold', description: 'Number of reports before auto-ban triggers', category: 'moderation', type: 'number' },
  { key: 'moderation.profanityFilter', value: 'true', label: 'Profanity Filter', description: 'Enable chat profanity filter', category: 'moderation', type: 'boolean' },
  { key: 'features.voiceChat', value: 'true', label: 'Voice Chat', description: 'Enable voice chat in campaigns', category: 'features', type: 'boolean' },
  { key: 'features.diceRolling', value: 'true', label: 'Dice Rolling', description: 'Enable dice rolling system', category: 'features', type: 'boolean' },
  { key: 'features.battleMap', value: 'true', label: 'Battle Map', description: 'Enable battle map feature', category: 'features', type: 'boolean' },
  { key: 'features.characterSheet', value: 'true', label: 'Character Sheet', description: 'Enable character sheet creation', category: 'features', type: 'boolean' },
  { key: 'features.drawingTools', value: 'true', label: 'Drawing Tools', description: 'Enable drawing tools on battle map', category: 'features', type: 'boolean' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [initializingDefaults, setInitializingDefaults] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.success) setSettings(json.data.grouped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSetting = async (setting: { key: string; value: string; label: string; category: string; type: string; description?: string }) => {
    setSaving(setting.key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Saved "${setting.label}"`);
        setTimeout(() => setSuccessMsg(null), 2000);
        await fetchSettings();
      }
    } finally {
      setSaving(null);
      setEditingKey(null);
    }
  };

  const initializeDefaults = async () => {
    setInitializingDefaults(true);
    for (const s of DEFAULT_SETTINGS) {
      const exists = Object.values(settings).flat().some(existing => existing.key === s.key);
      if (!exists) {
        await saveSetting(s);
      }
    }
    setInitializingDefaults(false);
    setSuccessMsg('All default settings initialized');
    setTimeout(() => setSuccessMsg(null), 3000);
    await fetchSettings();
  };

  const toggleBoolean = async (setting: SystemSetting) => {
    const newVal = setting.value === 'true' ? 'false' : 'true';
    await saveSetting({ key: setting.key, value: newVal, label: setting.label, category: setting.category, type: setting.type });
  };

  const startEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const submitEdit = async (setting: SystemSetting) => {
    await saveSetting({ key: setting.key, value: editValue, label: setting.label, category: setting.category, type: setting.type });
  };

  const allSettings = Object.values(settings).flat();
  const categories = Object.keys(settings).sort();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Configure platform-wide settings</p>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="text-xs text-success bg-success/10 px-3 py-1.5 rounded-lg animate-in fade-in">
              ✓ {successMsg}
            </span>
          )}
          <button
            onClick={initializeDefaults}
            disabled={initializingDefaults}
            className="px-4 py-2 text-xs bg-surface-3 text-text-secondary rounded-lg hover:bg-surface-4 transition-colors disabled:opacity-50"
          >
            {initializingDefaults ? 'Initializing...' : '🔧 Initialize Defaults'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-2 border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Settings</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{allSettings.length}</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Categories</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{categories.length}</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Boolean Toggles</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{allSettings.filter(s => s.type === 'boolean').length}</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Defaults Available</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{DEFAULT_SETTINGS.length}</p>
        </div>
      </div>

      {/* Settings by Category */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-2 border border-border rounded-xl p-5">
              <div className="h-4 w-32 bg-surface-3 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-surface-3 rounded-lg" />
                <div className="h-10 bg-surface-3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-surface-2 border border-border rounded-xl">
          <p className="text-3xl mb-3">⚙️</p>
          <p className="text-text-secondary text-sm mb-2">No settings configured yet</p>
          <p className="text-text-muted text-xs mb-4">Click &quot;Initialize Defaults&quot; to set up recommended settings</p>
          <button
            onClick={initializeDefaults}
            className="px-4 py-2 text-xs bg-accent text-surface-0 rounded-lg hover:bg-accent-bright transition-colors"
          >
            Initialize Defaults
          </button>
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat} className="bg-surface-2 border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <span>{CATEGORY_ICONS[cat] || '📁'}</span>
              <span className="text-sm font-semibold text-text-primary capitalize">{cat}</span>
              <span className="text-[10px] text-text-muted ml-auto">{settings[cat].length} settings</span>
            </div>
            <div className="divide-y divide-border/50">
              {settings[cat].map(setting => (
                <div key={setting.key} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-3/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-text-primary">{setting.label}</p>
                      <span className="text-[9px] text-text-muted font-mono bg-surface-4 px-1.5 py-0.5 rounded hidden sm:inline">
                        {setting.key}
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-[11px] text-text-tertiary mt-0.5">{setting.description}</p>
                    )}
                  </div>

                  {/* Value control */}
                  <div className="shrink-0 flex items-center gap-2">
                    {setting.type === 'boolean' ? (
                      <button
                        onClick={() => toggleBoolean(setting)}
                        disabled={saving === setting.key}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          setting.value === 'true' ? 'bg-accent' : 'bg-surface-4'
                        } ${saving === setting.key ? 'opacity-50' : ''}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            setting.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : editingKey === setting.key ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type={setting.type === 'number' ? 'number' : 'text'}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') submitEdit(setting);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                          className="w-28 px-2 py-1 text-xs bg-surface-1 border border-accent rounded text-text-primary focus:outline-none"
                        />
                        <button
                          onClick={() => submitEdit(setting)}
                          disabled={saving === setting.key}
                          className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-1 text-text-muted hover:bg-surface-4 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(setting)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-3 rounded-lg text-xs text-text-secondary hover:bg-surface-4 transition-colors group"
                      >
                        <span className="font-mono">{setting.value}</span>
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Custom Setting */}
      <AddSettingForm onSave={saveSetting} onDone={fetchSettings} />
    </div>
  );
}

function AddSettingForm({ onSave, onDone }: {
  onSave: (s: { key: string; value: string; label: string; category: string; type: string; description?: string }) => Promise<void>;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', label: '', category: 'general', type: 'string', description: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.key || !form.label) return;
    setSaving(true);
    await onSave(form);
    await onDone();
    setForm({ key: '', value: '', label: '', category: 'general', type: 'string', description: '' });
    setOpen(false);
    setSaving(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-text-tertiary hover:border-accent hover:text-accent transition-colors"
      >
        + Add Custom Setting
      </button>
    );
  }

  return (
    <div className="bg-surface-2 border border-accent/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">New Custom Setting</h3>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Key *</label>
          <input
            value={form.key}
            onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
            placeholder="e.g. custom.myFeature"
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Label *</label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="My Feature"
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-secondary focus:outline-none focus:border-accent"
          >
            {['general', 'gameplay', 'moderation', 'notifications', 'appearance', 'limits', 'features', 'security'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Value</label>
          <input
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="Value"
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Description</label>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
            className="w-full px-3 py-2 text-xs bg-surface-3 border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-xs text-text-secondary hover:bg-surface-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving || !form.key || !form.label}
          className="px-4 py-2 text-xs bg-accent text-surface-0 rounded-lg hover:bg-accent-bright disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Create Setting'}
        </button>
      </div>
    </div>
  );
}
