'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ruler, Circle, Triangle, Square, Crosshair, X, Trash2, RotateCcw,
} from 'lucide-react';

// ============================================================
// Measurement & AoE Overlay — Distance measurement, spell area templates
// Draws on a transparent canvas over the battle map
// Grid assumed 5ft per cell, configurable cell size in pixels
// ============================================================

type AoEShape = 'circle' | 'cone' | 'cube' | 'line' | 'cylinder';

interface AoETemplate {
  id: string;
  shape: AoEShape;
  x: number;
  y: number;
  radiusFt: number;     // radius for circle/cylinder, or length for line/cone
  rotation: number;     // degrees, for cone/line direction
  color: string;
}

interface MeasurementLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const COLORS = ['#8b5cf6', '#ef4444', '#22c55e', '#eab308', '#3b82f6', '#f97316', '#ec4899'];

const AOE_PRESETS: { label: string; shape: AoEShape; radius: number }[] = [
  { label: '15ft Cone', shape: 'cone', radius: 15 },
  { label: '20ft Sphere', shape: 'circle', radius: 20 },
  { label: '30ft Cone', shape: 'cone', radius: 30 },
  { label: '10ft Cube', shape: 'cube', radius: 10 },
  { label: '20ft Line', shape: 'line', radius: 20 },
  { label: '60ft Line', shape: 'line', radius: 60 },
  { label: '40ft Sphere', shape: 'circle', radius: 40 },
  { label: '15ft Cube', shape: 'cube', radius: 15 },
  { label: '10ft Sphere', shape: 'circle', radius: 10 },
  { label: '120ft Line', shape: 'line', radius: 120 },
];

interface MeasureOverlayProps {
  cellSize: number;        // pixels per grid cell
  ftPerCell?: number;     // feet per cell (default 5)
  width: number;
  height: number;
  className?: string;
}

export default function MeasureOverlay({ cellSize, ftPerCell = 5, width, height, className = '' }: MeasureOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'none' | 'measure' | 'aoe'>('none');
  const [templates, setTemplates] = useState<AoETemplate[]>([]);
  const [measurement, setMeasurement] = useState<MeasurementLine | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [aoeShape, setAoeShape] = useState<AoEShape>('circle');
  const [aoeRadius, setAoeRadius] = useState(20);
  const [aoeColor, setAoeColor] = useState(COLORS[0]);
  const [showPanel, setShowPanel] = useState(false);
  const [draggingTemplate, setDraggingTemplate] = useState<string | null>(null);

  const pxPerFt = cellSize / ftPerCell;

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw templates
    templates.forEach(tmpl => {
      const radiusPx = tmpl.radiusFt * pxPerFt;
      ctx.save();
      ctx.globalAlpha = 0.25;

      if (tmpl.shape === 'circle' || tmpl.shape === 'cylinder') {
        ctx.beginPath();
        ctx.arc(tmpl.x, tmpl.y, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = tmpl.color;
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = tmpl.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (tmpl.shape === 'cube') {
        ctx.translate(tmpl.x, tmpl.y);
        ctx.rotate((tmpl.rotation * Math.PI) / 180);
        ctx.fillStyle = tmpl.color;
        ctx.fillRect(-radiusPx / 2, -radiusPx / 2, radiusPx, radiusPx);
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = tmpl.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-radiusPx / 2, -radiusPx / 2, radiusPx, radiusPx);
      } else if (tmpl.shape === 'cone') {
        const angle = 53 * (Math.PI / 180); // 53° cone
        ctx.translate(tmpl.x, tmpl.y);
        ctx.rotate(((tmpl.rotation - 90) * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radiusPx, -angle / 2, angle / 2);
        ctx.closePath();
        ctx.fillStyle = tmpl.color;
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = tmpl.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (tmpl.shape === 'line') {
        const lineWidth = 5 * pxPerFt; // 5ft wide
        ctx.translate(tmpl.x, tmpl.y);
        ctx.rotate(((tmpl.rotation - 90) * Math.PI) / 180);
        ctx.fillStyle = tmpl.color;
        ctx.fillRect(-lineWidth / 2, 0, lineWidth, radiusPx);
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = tmpl.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-lineWidth / 2, 0, lineWidth, radiusPx);
      }

      ctx.restore();

      // Label
      ctx.fillStyle = tmpl.color;
      ctx.globalAlpha = 0.9;
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${tmpl.radiusFt}ft ${tmpl.shape}`, tmpl.x, tmpl.y - (tmpl.shape === 'circle' ? tmpl.radiusFt * pxPerFt + 8 : 12));
      ctx.globalAlpha = 1;
    });

    // Draw measurement line
    if (measurement) {
      ctx.beginPath();
      ctx.moveTo(measurement.x1, measurement.y1);
      ctx.lineTo(measurement.x2, measurement.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance
      const dx = measurement.x2 - measurement.x1;
      const dy = measurement.y2 - measurement.y1;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distFt = Math.round((distPx / pxPerFt) / 5) * 5; // snap to 5ft
      const midX = (measurement.x1 + measurement.x2) / 2;
      const midY = (measurement.y1 + measurement.y2) / 2;

      ctx.fillStyle = '#1a1a1a';
      ctx.globalAlpha = 0.85;
      const text = `${distFt} ft`;
      const tm = ctx.measureText(text);
      ctx.fillRect(midX - tm.width / 2 - 4, midY - 14, tm.width + 8, 18);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY - 5);

      // Endpoints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(measurement.x1, measurement.y1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(measurement.x2, measurement.y2, 4, 0, Math.PI * 2); ctx.fill();
    }
  }, [templates, measurement, width, height, pxPerFt]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'measure') {
      setMeasurement({ x1: x, y1: y, x2: x, y2: y });
      setMeasuring(true);
    } else if (tool === 'aoe') {
      const newTemplate: AoETemplate = {
        id: Date.now().toString(),
        shape: aoeShape,
        x, y,
        radiusFt: aoeRadius,
        rotation: 0,
        color: aoeColor,
      };
      setTemplates(prev => [...prev, newTemplate]);
    } else {
      // Check if clicking on a template for dragging
      const tmpl = templates.find(t => {
        const dx = t.x - x;
        const dy = t.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      if (tmpl) {
        setDraggingTemplate(tmpl.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (measuring && measurement) {
      setMeasurement({ ...measurement, x2: x, y2: y });
    }
    if (draggingTemplate) {
      setTemplates(prev => prev.map(t =>
        t.id === draggingTemplate ? { ...t, x, y } : t
      ));
    }
  };

  const handleMouseUp = () => {
    setMeasuring(false);
    setDraggingTemplate(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Rotate templates on scroll
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tmpl = templates.find(t => {
      const dx = t.x - x;
      const dy = t.y - y;
      return Math.sqrt(dx * dx + dy * dy) < t.radiusFt * pxPerFt + 20;
    });
    if (tmpl) {
      e.preventDefault();
      setTemplates(prev => prev.map(t =>
        t.id === tmpl.id ? { ...t, rotation: t.rotation + (e.deltaY > 0 ? 15 : -15) } : t
      ));
    }
  };

  const clearAll = () => {
    setTemplates([]);
    setMeasurement(null);
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const shapeIcons: Record<AoEShape, React.ReactNode> = {
    circle: <Circle className="w-3 h-3" />,
    cone: <Triangle className="w-3 h-3" />,
    cube: <Square className="w-3 h-3" />,
    line: <Ruler className="w-3 h-3" />,
    cylinder: <Circle className="w-3 h-3" />,
  };

  return (
    <>
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`absolute top-0 left-0 pointer-events-none ${tool !== 'none' ? 'pointer-events-auto cursor-crosshair' : ''} ${className}`}
        style={{ zIndex: 20 }}
      />

      {/* Floating toolbar */}
      <div className="absolute top-2 right-2 z-30 flex flex-col gap-1">
        {/* Toggle panel */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`p-2 rounded-lg shadow-lg border transition-colors cursor-pointer ${
            showPanel ? 'bg-accent text-surface-0 border-accent' : 'bg-surface-1 text-text-secondary border-border hover:bg-surface-2'
          }`}
          title="Measurement & AoE Tools"
        >
          <Ruler className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="bg-surface-1 border border-border rounded-lg shadow-xl p-2 w-48 space-y-2"
            >
              {/* Tool selector */}
              <div className="flex gap-1">
                <button
                  onClick={() => setTool(tool === 'measure' ? 'none' : 'measure')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                    tool === 'measure' ? 'bg-accent text-surface-0' : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Ruler className="w-3 h-3" /> Measure
                </button>
                <button
                  onClick={() => setTool(tool === 'aoe' ? 'none' : 'aoe')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                    tool === 'aoe' ? 'bg-accent text-surface-0' : 'bg-surface-2 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Crosshair className="w-3 h-3" /> AoE
                </button>
              </div>

              {/* AoE options */}
              {tool === 'aoe' && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-4 gap-0.5">
                    {(['circle', 'cone', 'cube', 'line'] as AoEShape[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setAoeShape(s)}
                        className={`p-1.5 rounded text-[9px] flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                          aoeShape === s ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                        }`}
                      >
                        {shapeIcons[s]}
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Radius */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-text-tertiary w-10 shrink-0">Size:</span>
                    <input
                      type="range"
                      min={5} max={120} step={5}
                      value={aoeRadius}
                      onChange={e => setAoeRadius(parseInt(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="text-[10px] text-text-primary font-mono w-10 text-right">{aoeRadius}ft</span>
                  </div>

                  {/* Color picker */}
                  <div className="flex gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setAoeColor(c)}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${aoeColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[9px] text-text-tertiary block mb-1">Quick Presets</span>
                    <div className="grid grid-cols-2 gap-0.5">
                      {AOE_PRESETS.slice(0, 6).map(p => (
                        <button
                          key={p.label}
                          onClick={() => { setAoeShape(p.shape); setAoeRadius(p.radius); }}
                          className="text-[9px] px-1.5 py-1 bg-surface-2 text-text-tertiary rounded hover:text-accent cursor-pointer transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active templates */}
              {templates.length > 0 && (
                <div>
                  <span className="text-[9px] text-text-tertiary block mb-1">Active ({templates.length})</span>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-surface-2 rounded px-2 py-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="text-[9px] text-text-secondary">{t.radiusFt}ft {t.shape}</span>
                        </div>
                        <button
                          onClick={() => removeTemplate(t.id)}
                          className="text-text-tertiary hover:text-danger cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear all */}
              <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-text-tertiary hover:text-danger bg-surface-2 rounded cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>

              {/* Help text */}
              <div className="text-[9px] text-text-tertiary/60 leading-tight">
                {tool === 'measure' && 'Click & drag to measure distance'}
                {tool === 'aoe' && 'Click to place template. Scroll over template to rotate.'}
                {tool === 'none' && 'Drag templates to reposition'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
