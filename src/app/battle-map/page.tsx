'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Grid3x3, Move, Square, Circle, ZoomIn, ZoomOut,
  Eye, EyeOff, MousePointer, Pencil, Eraser, Layers, Users, Heart, Shield, X
} from 'lucide-react';
import { Button, Card, Badge, Input, Modal, EmptyState } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { MapScene, Campaign, ALL_CONDITIONS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

type Tool = 'select' | 'move' | 'draw-rect' | 'draw-circle' | 'draw-line' | 'erase' | 'fog';

const TOKEN_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
const DRAW_COLORS = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];

export default function BattleMapPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [scenes, setScenes] = useState<MapScene[]>([]);
  const [activeScene, setActiveScene] = useState<MapScene | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [tool, setTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(true);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Drawing state
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  // Token edit panel
  const [editingHp, setEditingHp] = useState('');
  const [editingHpMax, setEditingHpMax] = useState('');
  const [showTokenEdit, setShowTokenEdit] = useState(false);

  const [showCreateScene, setShowCreateScene] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneCampaign, setNewSceneCampaign] = useState('');
  const [newSceneWidth, setNewSceneWidth] = useState(30);
  const [newSceneHeight, setNewSceneHeight] = useState(20);
  const [newSceneBg, setNewSceneBg] = useState('');

  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState(1);
  const [tokenColor, setTokenColor] = useState('#ef4444');
  const [tokenIsPC, setTokenIsPC] = useState(true);

  // Ref to track dragged token id for mouseUp persistence
  const draggedTokenRef = useRef<string | null>(null);

  // Load background image when scene changes
  useEffect(() => {
    if (activeScene?.backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgImageRef.current = img; };
      img.onerror = () => { bgImageRef.current = null; };
      img.src = activeScene.backgroundImage;
    } else {
      bgImageRef.current = null;
    }
  }, [activeScene?.backgroundImage]);

  // Load campaigns and scenes from API
  useEffect(() => {
    const load = async () => {
      try {
        const camps = await api.getCampaigns();
        setCampaigns(camps);
        if (camps.length > 0 && !newSceneCampaign) setNewSceneCampaign(camps[0].id);
        const allScenes: any[] = [];
        for (const c of camps) {
          const s = await api.getScenes(c.id);
          allScenes.push(...s);
        }
        setScenes(allScenes);
      } catch (err) {
        console.error('Failed to load campaigns/scenes:', err);
      }
    };
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Select a scene from the sidebar — load full data with tokens/drawings
  const selectScene = async (sceneId: string) => {
    try {
      const full = await api.getScene(sceneId);
      setActiveScene(full);
      setSelectedTokenId(null);
      setShowTokenEdit(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load scene');
    }
  };

  // Helper to refresh the active scene from the API
  const refreshScene = async (sceneId: string) => {
    try {
      const updated = await api.getScene(sceneId);
      setActiveScene(updated);
    } catch (err) {
      console.error('Failed to refresh scene:', err);
    }
  };

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const gs = (activeScene.gridSize || 40) * zoom;
    const ox = panOffset.x;
    const oy = panOffset.y;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = activeScene.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Background image
    if (bgImageRef.current) {
      const img = bgImageRef.current;
      const mapW = activeScene.width * gs;
      const mapH = activeScene.height * gs;
      ctx.drawImage(img, ox, oy, mapW, mapH);
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= activeScene.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gs + ox, oy);
        ctx.lineTo(x * gs + ox, activeScene.height * gs + oy);
        ctx.stroke();
      }
      for (let y = 0; y <= activeScene.height; y++) {
        ctx.beginPath();
        ctx.moveTo(ox, y * gs + oy);
        ctx.lineTo(activeScene.width * gs + ox, y * gs + oy);
        ctx.stroke();
      }
    }

    // Drawings
    (activeScene.drawings || []).forEach(drawing => {
      ctx.strokeStyle = drawing.color || '#ffffff';
      ctx.lineWidth = (drawing.lineWidth || 2) * zoom;
      if (drawing.type === 'freehand' && drawing.points.length > 0) {
        ctx.beginPath();
        drawing.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x * gs + ox, p.y * gs + oy);
          else ctx.lineTo(p.x * gs + ox, p.y * gs + oy);
        });
        ctx.stroke();
      } else if (drawing.type === 'rectangle' && drawing.points.length >= 2) {
        const p0 = drawing.points[0];
        const p1 = drawing.points[1];
        ctx.strokeRect(p0.x * gs + ox, p0.y * gs + oy, (p1.x - p0.x) * gs, (p1.y - p0.y) * gs);
      } else if (drawing.type === 'circle' && drawing.points.length >= 2) {
        const center = drawing.points[0];
        const edge = drawing.points[1];
        const radius = Math.sqrt(Math.pow((edge.x - center.x) * gs, 2) + Math.pow((edge.y - center.y) * gs, 2));
        ctx.beginPath();
        ctx.arc(center.x * gs + ox, center.y * gs + oy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Live drawing preview
    if (isDrawing && drawStart && drawCurrent) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([6, 4]);
      if (tool === 'draw-rect') {
        ctx.strokeRect(drawStart.x * gs + ox, drawStart.y * gs + oy, (drawCurrent.x - drawStart.x) * gs, (drawCurrent.y - drawStart.y) * gs);
      } else if (tool === 'draw-circle') {
        const radius = Math.sqrt(Math.pow((drawCurrent.x - drawStart.x) * gs, 2) + Math.pow((drawCurrent.y - drawStart.y) * gs, 2));
        ctx.beginPath();
        ctx.arc(drawStart.x * gs + ox, drawStart.y * gs + oy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    // Freehand preview
    if (isDrawing && tool === 'draw-line' && freehandPoints.length > 0) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 2 * zoom;
      ctx.beginPath();
      freehandPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * gs + ox, p.y * gs + oy);
        else ctx.lineTo(p.x * gs + ox, p.y * gs + oy);
      });
      ctx.stroke();
    }

    // Tokens
    (activeScene.tokens || []).forEach(token => {
      if (token.hidden) return;
      const tx = token.x * gs + ox;
      const ty = token.y * gs + oy;
      const ts = token.size * gs;

      ctx.beginPath();
      ctx.arc(tx + ts / 2, ty + ts / 2, ts / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = token.color || '#3b82f6';
      ctx.fill();

      ctx.strokeStyle = selectedTokenId === token.id ? '#fbbf24' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = selectedTokenId === token.id ? 3 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.label || token.name.slice(0, 2).toUpperCase(), tx + ts / 2, ty + ts / 2);

      // HP bar
      if (token.hp) {
        const barW = ts - 4;
        const barH = 4;
        const barX = tx + 2;
        const barY = ty + ts - 6;
        const hpPct = Math.max(0, Math.min(1, token.hp.current / token.hp.max));
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(barX, barY, barW * hpPct, barH);
      }

      // Conditions indicator
      if (token.conditions && token.conditions.length > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = `${Math.max(8, 10 * zoom)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(`⚡${token.conditions.length}`, tx + ts - 8, ty + 2);
      }
    });

    // Fog of war
    if (showFog && activeScene.fogRevealed) {
      for (let gx = 0; gx < activeScene.width; gx++) {
        for (let gy = 0; gy < activeScene.height; gy++) {
          const revealed = activeScene.fogRevealed[gy]?.[gx] ?? false;
          if (!revealed) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(gx * gs + ox, gy * gs + oy, gs, gs);
          }
        }
      }
    }
  }, [activeScene, zoom, panOffset, showGrid, showFog, selectedTokenId, isDrawing, drawStart, drawCurrent, drawColor, tool, freehandPoints]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        render();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [render, activeScene]);

  const getGridPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const gs = (activeScene?.gridSize || 40) * zoom;
    return {
      x: Math.floor((e.clientX - rect.left - panOffset.x) / gs),
      y: Math.floor((e.clientY - rect.top - panOffset.y) / gs),
    };
  };

  // Precise (sub-grid) position for smooth freehand drawing
  const getPrecisePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const gs = (activeScene?.gridSize || 40) * zoom;
    return {
      x: (e.clientX - rect.left - panOffset.x) / gs,
      y: (e.clientY - rect.top - panOffset.y) / gs,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && tool === 'move')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
    const pos = getGridPos(e);
    const precisePos = getPrecisePos(e);

    if (tool === 'select' && activeScene) {
      const clicked = (activeScene.tokens || []).find(t =>
        pos.x >= t.x && pos.x < t.x + t.size && pos.y >= t.y && pos.y < t.y + t.size
      );
      if (clicked) {
        setSelectedTokenId(clicked.id);
        setIsDragging(true);
        draggedTokenRef.current = clicked.id;
        // Populate edit fields
        setEditingHp(String(clicked.hp?.current ?? ''));
        setEditingHpMax(String(clicked.hp?.max ?? ''));
        setShowTokenEdit(true);
      } else {
        setSelectedTokenId(null);
        setShowTokenEdit(false);
      }
    }

    if (tool === 'fog' && activeScene) {
      (async () => {
        try {
          await api.revealFog(activeScene.id, [{ row: pos.y, col: pos.x }]);
          await refreshScene(activeScene.id);
        } catch (err) {
          console.error('Failed to reveal fog:', err);
        }
      })();
    }

    // Drawing tools
    if ((tool === 'draw-rect' || tool === 'draw-circle') && activeScene) {
      setIsDrawing(true);
      setDrawStart(precisePos);
      setDrawCurrent(precisePos);
    }

    if (tool === 'draw-line' && activeScene) {
      setIsDrawing(true);
      setFreehandPoints([precisePos]);
    }

    // Erase tool — remove nearest drawing
    if (tool === 'erase' && activeScene) {
      const drawings = activeScene.drawings || [];
      let closestId: string | null = null;
      let closestDist = Infinity;
      drawings.forEach(d => {
        d.points.forEach(p => {
          const dist = Math.sqrt(Math.pow(p.x - precisePos.x, 2) + Math.pow(p.y - precisePos.y, 2));
          if (dist < closestDist) { closestDist = dist; closestId = d.id; }
        });
      });
      if (closestId && closestDist < 3) {
        const updatedDrawings = drawings.filter(d => d.id !== closestId);
        (async () => {
          try {
            await api.updateScene(activeScene.id, { drawings: updatedDrawings });
            await refreshScene(activeScene.id);
            toast.info(t.common.success);
          } catch (err) {
            console.error('Failed to erase drawing:', err);
          }
        })();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (isDragging && selectedTokenId && activeScene) {
      const pos = getGridPos(e);
      // Update local state only for smooth dragging — persist on mouseUp
      setActiveScene(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tokens: prev.tokens.map(tk =>
            tk.id === selectedTokenId ? { ...tk, x: pos.x, y: pos.y } : tk
          ),
        };
      });
    }
    // Drawing preview
    if (isDrawing && (tool === 'draw-rect' || tool === 'draw-circle')) {
      setDrawCurrent(getPrecisePos(e));
    }
    if (isDrawing && tool === 'draw-line') {
      setFreehandPoints(prev => [...prev, getPrecisePos(e)]);
    }
  };

  const handleMouseUp = () => {
    // Persist token position on mouseUp
    if (isDragging && draggedTokenRef.current && activeScene) {
      const draggedId = draggedTokenRef.current;
      const token = activeScene.tokens?.find(tk => tk.id === draggedId);
      if (token) {
        (async () => {
          try {
            await api.updateToken(draggedId, { x: token.x, y: token.y });
            await refreshScene(activeScene.id);
          } catch (err) {
            console.error('Failed to persist token position:', err);
          }
        })();
      }
      draggedTokenRef.current = null;
    }

    setIsDragging(false);
    setIsPanning(false);

    // Finalize drawing — persist via updateScene
    if (isDrawing && activeScene) {
      let newDrawing: any = null;
      if (tool === 'draw-rect' && drawStart && drawCurrent) {
        newDrawing = {
          id: crypto.randomUUID(),
          type: 'rectangle',
          points: [drawStart, drawCurrent],
          color: drawColor,
          lineWidth: 2,
          visible: true,
        };
      } else if (tool === 'draw-circle' && drawStart && drawCurrent) {
        const radius = Math.sqrt(Math.pow(drawCurrent.x - drawStart.x, 2) + Math.pow(drawCurrent.y - drawStart.y, 2));
        newDrawing = {
          id: crypto.randomUUID(),
          type: 'circle',
          points: [drawStart, drawCurrent],
          color: drawColor,
          lineWidth: 2,
          radius,
          visible: true,
        };
      } else if (tool === 'draw-line' && freehandPoints.length > 1) {
        newDrawing = {
          id: crypto.randomUUID(),
          type: 'freehand',
          points: freehandPoints,
          color: drawColor,
          lineWidth: 2,
          visible: true,
        };
      }

      if (newDrawing) {
        const existingDrawings = activeScene.drawings || [];
        const updatedDrawings = [...existingDrawings, newDrawing];
        // Optimistically update local state
        setActiveScene(prev => prev ? { ...prev, drawings: updatedDrawings } : prev);
        // Persist to API
        (async () => {
          try {
            await api.updateScene(activeScene.id, { drawings: updatedDrawings });
            await refreshScene(activeScene.id);
          } catch (err) {
            console.error('Failed to save drawing:', err);
          }
        })();
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setFreehandPoints([]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(3, z - e.deltaY * 0.001)));
  };

  const createScene = async () => {
    if (!newSceneName.trim()) return;
    try {
      const scene = await api.createScene(newSceneCampaign, {
        name: newSceneName.trim(),
        width: newSceneWidth,
        height: newSceneHeight,
        backgroundImage: newSceneBg || undefined,
        gridSize: 40,
        gridType: 'square',
        backgroundColor: '#1a1a2e',
      });
      setScenes(prev => [scene, ...prev]);
      // Load full scene data with tokens/drawings/fog
      const full = await api.getScene(scene.id);
      setActiveScene(full);
      setShowCreateScene(false);
      setNewSceneName('');
      toast.success(t.common.success);
    } catch (err) {
      console.error('Failed to create scene:', err);
      toast.error(String(err));
    }
  };

  const addToken = async () => {
    if (!activeScene || !tokenName.trim()) return;
    try {
      await api.addToken(activeScene.id, {
        name: tokenName.trim(),
        x: Math.floor(activeScene.width / 2),
        y: Math.floor(activeScene.height / 2),
        size: tokenSize,
        color: tokenColor,
        label: tokenName.trim().slice(0, 2).toUpperCase(),
        isPC: tokenIsPC,
        conditions: [],
        vision: 12,
        darkvision: 0,
        lightRadius: 0,
        dimLightRadius: 0,
        hidden: false,
      });
      await refreshScene(activeScene.id);
      setShowAddToken(false);
      setTokenName('');
      toast.success(t.common.success);
    } catch (err) {
      console.error('Failed to add token:', err);
      toast.error(String(err));
    }
  };

  const deleteToken = async () => {
    if (!activeScene || !selectedTokenId) return;
    try {
      await api.removeToken(selectedTokenId);
      await refreshScene(activeScene.id);
      setSelectedTokenId(null);
      setShowTokenEdit(false);
    } catch (err) {
      console.error('Failed to delete token:', err);
      toast.error(String(err));
    }
  };

  const selectedToken = activeScene?.tokens?.find(t => t.id === selectedTokenId);

  const updateTokenHP = async () => {
    if (!activeScene || !selectedTokenId) return;
    const current = parseInt(editingHp) || 0;
    const max = parseInt(editingHpMax) || current;
    try {
      await api.updateToken(selectedTokenId, { hp: { current, max } });
      await refreshScene(activeScene.id);
      toast.success(t.common.success);
    } catch (err) {
      console.error('Failed to update HP:', err);
      toast.error(String(err));
    }
  };

  const toggleCondition = async (condition: string) => {
    if (!activeScene || !selectedTokenId || !selectedToken) return;
    const current = selectedToken.conditions || [];
    const next = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    try {
      await api.updateToken(selectedTokenId, { conditions: next });
      await refreshScene(activeScene.id);
    } catch (err) {
      console.error('Failed to toggle condition:', err);
      toast.error(String(err));
    }
  };

  const tools: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Select' },
    { key: 'move', icon: <Move className="w-4 h-4" />, label: 'Pan' },
    { key: 'draw-rect', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
    { key: 'draw-circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
    { key: 'draw-line', icon: <Pencil className="w-4 h-4" />, label: 'Draw' },
    { key: 'fog', icon: <Eye className="w-4 h-4" />, label: 'Reveal Fog' },
    { key: 'erase', icon: <Eraser className="w-4 h-4" />, label: 'Erase' },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-display font-bold">{t.nav.battleMap}</h1>
          {activeScene && <p className="text-xs text-text-tertiary">{activeScene.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          {activeScene && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setShowAddToken(true)}>
                <Users className="w-3.5 h-3.5" /> {t.session.addToken}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowGrid(!showGrid)}>
                <Grid3x3 className="w-3.5 h-3.5" /> {showGrid ? t.session.hide : t.session.view} {t.session.grid}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFog(!showFog)}>
                {showFog ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {t.session.fog}
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setShowCreateScene(true)}>
            <Plus className="w-3.5 h-3.5" /> {t.session.scenes}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {activeScene && (
          <div className="flex flex-col gap-1 bg-surface-1 border border-border rounded-lg p-1.5 shrink-0">
            {tools.map(tl => (
              <button
                key={tl.key}
                onClick={() => setTool(tl.key)}
                title={tl.label}
                className={`p-2 rounded-md transition-colors cursor-pointer ${
                  tool === tl.key ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                }`}
              >
                {tl.icon}
              </button>
            ))}
            <div className="border-t border-border my-1" />
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 text-text-tertiary hover:text-text-secondary cursor-pointer" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 text-text-tertiary hover:text-text-secondary cursor-pointer" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-text-tertiary text-center">{Math.round(zoom * 100)}%</span>
          </div>
        )}

        <div className="flex-1 bg-surface-0 border border-border rounded-lg overflow-hidden relative">
          {activeScene ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ cursor: tool === 'move' || isPanning ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={<Grid3x3 className="w-12 h-12" />}
                title={t.session.noSceneLoaded}
                description={t.session.noSceneDesc}
                action={<Button size="sm" onClick={() => setShowCreateScene(true)}><Plus className="w-3.5 h-3.5" /> {t.session.scenes}</Button>}
              />
            </div>
          )}
          {activeScene && (
            <div className="absolute bottom-2 left-2 bg-surface-1/80 backdrop-blur-sm text-[10px] text-text-tertiary px-2 py-1 rounded">
              Zoom: {Math.round(zoom * 100)}% | Grid: {activeScene.width}x{activeScene.height}
            </div>
          )}
        </div>

        <div className="w-56 shrink-0 space-y-3 overflow-y-auto">
          {/* Drawing color picker */}
          {(tool === 'draw-rect' || tool === 'draw-circle' || tool === 'draw-line') && (
            <Card className="!p-3">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2">Draw Color</h4>
              <div className="flex gap-1.5 flex-wrap">
                {DRAW_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${drawColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Card>
          )}

          {selectedToken && showTokenEdit && (
            <Card className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase">Token</h4>
                <button onClick={() => setShowTokenEdit(false)} className="text-text-tertiary hover:text-text-secondary cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-medium text-sm mb-2">{selectedToken.name}</p>
              <div className="text-xs text-text-tertiary space-y-1 mb-3">
                <p>Position: ({selectedToken.x}, {selectedToken.y})</p>
                <p>Size: {selectedToken.size}</p>
              </div>

              {/* Editable HP */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-text-tertiary uppercase block mb-1">Hit Points</label>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-danger shrink-0" />
                    <input
                      type="number"
                      value={editingHp}
                      onChange={e => setEditingHp(e.target.value)}
                      placeholder="HP"
                      className="w-12 bg-surface-2 border border-border rounded px-1 py-0.5 text-xs text-center"
                    />
                  </div>
                  <span className="text-text-tertiary">/</span>
                  <input
                    type="number"
                    value={editingHpMax}
                    onChange={e => setEditingHpMax(e.target.value)}
                    placeholder="Max"
                    className="w-12 bg-surface-2 border border-border rounded px-1 py-0.5 text-xs text-center"
                  />
                  <Button size="sm" variant="secondary" onClick={updateTokenHP} className="!px-2 !py-0.5 !text-[10px]">
                    Set
                  </Button>
                </div>
              </div>

              {/* Conditions */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-text-tertiary uppercase block mb-1">Conditions</label>
                {selectedToken.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {selectedToken.conditions.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/15 text-warning cursor-pointer hover:bg-warning/25 transition-colors"
                      >
                        {c} ×
                      </button>
                    ))}
                  </div>
                )}
                <div className="max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {ALL_CONDITIONS.filter(c => !selectedToken.conditions.includes(c)).map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary hover:text-accent hover:bg-surface-3 transition-colors cursor-pointer"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button size="sm" variant="danger" onClick={deleteToken} className="w-full">
                <Trash2 className="w-3 h-3" /> {t.common.remove}
              </Button>
            </Card>
          )}

          <Card className="!p-3">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> {t.session.scenes}
            </h4>
            {scenes.length === 0 ? (
              <p className="text-xs text-text-tertiary">{t.common.noResults}</p>
            ) : (
              <div className="space-y-1">
                {scenes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectScene(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      activeScene?.id === s.id ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    {s.name}
                    <span className="text-text-tertiary ml-1">({s.width}x{s.height})</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {activeScene && activeScene.tokens.length > 0 && (
            <Card className="!p-3">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Tokens ({activeScene.tokens.length})
              </h4>
              <div className="space-y-1">
                {activeScene.tokens.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTokenId(t.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                      selectedTokenId === t.id ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showCreateScene} onClose={() => setShowCreateScene(false)} title={t.session.scenes}>
        <div className="space-y-4">
          <Input label="Name" value={newSceneName} onChange={e => setNewSceneName(e.target.value)} placeholder="Goblin Lair" />
          <select value={newSceneCampaign} onChange={e => setNewSceneCampaign(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Width (cells)" type="number" min={5} max={100} value={newSceneWidth} onChange={e => setNewSceneWidth(parseInt(e.target.value) || 30)} />
            <Input label="Height (cells)" type="number" min={5} max={100} value={newSceneHeight} onChange={e => setNewSceneHeight(parseInt(e.target.value) || 20)} />
          </div>
          <Input label="Background Image URL (optional)" value={newSceneBg} onChange={e => setNewSceneBg(e.target.value)} placeholder="https://..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateScene(false)}>{t.common.cancel}</Button>
            <Button size="sm" onClick={createScene} disabled={!newSceneName.trim()}>{t.common.create}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddToken} onClose={() => setShowAddToken(false)} title={t.session.addToken}>
        <div className="space-y-4">
          <Input label="Name" value={tokenName} onChange={e => setTokenName(e.target.value)} placeholder="Goblin" />
          <Input label="Size (cells)" type="number" min={1} max={4} value={tokenSize} onChange={e => setTokenSize(parseInt(e.target.value) || 1)} />
          <div>
            <label className="text-xs font-medium text-text-secondary tracking-wide uppercase block mb-1.5">Color</label>
            <div className="flex gap-2">
              {TOKEN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setTokenColor(c)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${tokenColor === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-1' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={tokenIsPC} onChange={e => setTokenIsPC(e.target.checked)} className="accent-accent" />
            Player Character
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddToken(false)}>{t.common.cancel}</Button>
            <Button size="sm" onClick={addToken} disabled={!tokenName.trim()}>{t.session.addToken}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
