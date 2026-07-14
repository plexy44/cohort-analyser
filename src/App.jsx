import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, BarChart, Bar, LineChart, Line, ComposedChart, ReferenceLine, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Upload, FileDown, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Database,
  LayoutDashboard, Layers, Zap, TrendingUp, Filter, Eye, EyeOff, BarChart2,
  Grid, Activity, Users, ShoppingCart, Percent, Map as MapIcon, ChevronRight, Menu, ArrowUpRight, ArrowDownRight, Trash2,
  Sun, Moon, Camera, Copy, Pencil, Plus, X, Trophy, Scale, Flag, Gauge, FlaskConical, ListOrdered
} from 'lucide-react';

// --- THEME SYSTEM ---
// Two series ramps: the dark iridescent set, and a deeper subdued set that
// holds contrast on the light paper background.
export const ThemeContext = createContext('dark');
const RAMP_DARK = [
  '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#7df9ff',
  '#8b5cf6', '#e879f9', '#5eead4', '#38bdf8', '#c084fc',
  '#fb7185', '#4ade80', '#67e8f9', '#818cf8', '#f0abfc',
  '#2dd4bf', '#0ea5e9', '#d8b4fe', '#fda4af', '#86efac'
];
const RAMP_LIGHT = [
  '#0891b2', '#7c3aed', '#db2777', '#059669', '#0e7490',
  '#6d28d9', '#c026d3', '#0d9488', '#0284c7', '#9333ea',
  '#e11d48', '#16a34a', '#155e75', '#4f46e5', '#a21caf',
  '#0f766e', '#0369a1', '#7e22ce', '#be123c', '#15803d'
];
const useRamp = () => (useContext(ThemeContext) === 'light' ? RAMP_LIGHT : RAMP_DARK);

// --- SHARED UI COMPONENTS ---

// Count-up for KPI numerals. Parses "18.4", "£600,610", "6.33%", "1.86M"
// into prefix / number / suffix and eases the number in on change.
// Respects prefers-reduced-motion by rendering the final value immediately.
const AnimatedValue = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef();

  useEffect(() => {
    if (value === null || value === undefined) { setDisplay(value); return; }
    const str = String(value);
    const match = str.match(/^([^0-9-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!match || reduceMotion) { setDisplay(value); return; }

    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ''));
    const decimals = (numStr.split('.')[1] || '').length;
    const hasCommas = numStr.includes(',');
    const format = (n) => {
      let s = n.toFixed(decimals);
      if (hasCommas) {
        const [int, dec] = s.split('.');
        s = parseInt(int, 10).toLocaleString() + (dec ? '.' + dec : '');
      }
      return prefix + s + suffix;
    };

    const duration = 750;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setDisplay(format(target * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{display === null ? '--' : display}</>;
};

// Hover tooltip. Rendered through a portal into <body> so it can never be
// clipped by card overflow or stacked behind sibling divs. Flips below the
// element near the top of the viewport.
const Tip = ({ tip, children, className }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const below = r.top < 130;
    setPos({
      x: Math.min(Math.max(r.left + r.width / 2, 155), window.innerWidth - 155),
      y: below ? r.bottom : r.top,
      below
    });
  };
  if (!tip) return children;
  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} onClick={() => setPos(null)} className={className || 'inline-flex'}>
      {children}
      {pos && createPortal(
        <div className={`tip-pop ${pos.below ? 'tip-below' : ''}`} style={{ left: pos.x, top: pos.y }}>{tip}</div>,
        document.body
      )}
    </span>
  );
};

const GlassCard = ({ children, className = "", title, icon: Icon, value, trend, trendValue, subtext, onClick, isActive, noPadding, quiet, headerRight }) => (
  <div 
    onClick={onClick}
    className={`
      liquid-glass overflow-hidden transition-all flex flex-col
      ${quiet && !isActive ? 'liquid-glass--quiet' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${isActive ? 'liquid-glass--active' : ''}
      ${className}
    `}
  >
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/[0.04] pointer-events-none" />
    )}
    
    <div className={`relative z-10 flex-1 flex flex-col ${noPadding ? 'p-0' : 'p-5'}`}>
      {(title || value) && (
        <div className={`flex flex-col flex-1 ${noPadding ? 'p-5 pb-0' : ''}`}>
          <div className={`flex items-start justify-between gap-3 ${trend ? 'mb-2' : 'mb-4'}`}>
            <div className="flex items-start space-x-2.5 text-slate-400 min-w-0">
              {Icon && <Icon size={16} className={`mt-0.5 shrink-0 ${isActive ? "text-cyan-200" : "text-cyan-400"}`} />}
              <span className={`text-[10px] font-bold tracking-[0.22em] uppercase leading-[1.5] ${value !== undefined ? 'w-min whitespace-normal' : ''} ${isActive ? 'text-cyan-100' : ''}`}>
                {title}
              </span>
            </div>
            {headerRight && <div className="shrink-0 flex items-center gap-2 relative z-20">{headerRight}</div>}
          </div>
          
          {trend && (
            <div className={`inline-flex items-center w-max text-[10px] font-bold px-2 py-1 mb-2 rounded-md border ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
              {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {trendValue}
            </div>
          )}
          
          <div className="mt-auto pt-2">
            {value !== undefined && (
              <div className="data-num glow-num text-[32px] leading-none font-bold text-white mb-2">
                <AnimatedValue value={value} />
              </div>
            )}
            {subtext && <div className="text-[11px] text-slate-500 font-medium leading-tight">{subtext}</div>}
          </div>
        </div>
      )}
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="liquid-glass liquid-glass--quiet p-4 z-50 min-w-[180px]">
        <p className="text-cyan-300 font-bold mb-2 pb-2 text-xs uppercase tracking-[0.2em] border-b border-transparent [border-image:linear-gradient(90deg,rgba(34,211,238,.5),rgba(139,92,246,.35),transparent)_1]">{label}</p>
        <div className="flex flex-col gap-1.5">
            {payload.filter(e => e.value !== undefined && e.value !== null).map((entry, index) => {
            let displayValue = entry.value;
            if (Array.isArray(displayValue)) {
                // Benchmark / projection bands arrive as [low, high]
                const fmt = (v) => (v % 1 !== 0 ? (v < 0.1 ? v.toFixed(4) : v.toFixed(2)) : v.toLocaleString());
                displayValue = `${fmt(displayValue[0])} \u2013 ${fmt(displayValue[1])}`;
            } else if (typeof displayValue === 'number') {
                displayValue = Number.isFinite(displayValue) 
                ? (displayValue % 1 !== 0 ? (displayValue < 0.1 ? displayValue.toFixed(4) : displayValue.toFixed(2)) : displayValue.toLocaleString()) 
                : '0';
            }
            
            // Extract percentage growth if explicitly provided (used in Incremental chart)
            const growthKey = `${entry.name}_growth`;
            const growthValRaw = entry.payload && entry.payload[growthKey];
            const hasGrowth = growthValRaw !== undefined && label !== 0 && label !== '0';
            const growthNum = hasGrowth ? parseFloat(growthValRaw) : 0;

            return (
                <div key={index} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></div>
                        <span className="text-slate-300 capitalize">{entry.name}:</span>
                    </div>
                    <div className="text-right">
                        <span className="text-white data-num font-semibold">{displayValue}</span>
                        {hasGrowth && (
                            <span className={`ml-2 text-[10px] data-num font-medium ${growthNum > 0 ? 'text-emerald-300' : growthNum < 0 ? 'text-rose-300' : 'text-slate-400'}`}>
                                {growthNum > 0 ? '+' : ''}{growthValRaw}%
                            </span>
                        )}
                    </div>
                </div>
            );
            })}
        </div>
      </div>
    );
  }
  return null;
};

// --- SHARED PARSING UTILITIES ---

// Quote-aware CSV line splitter. GA4 exports wrap values containing commas
// in quotes (e.g. "1,561" visitors, or source/medium values) — a naive
// split(',') silently corrupts these rows.
const splitCSVLine = (line) => {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
};

// Escape a value for CSV output (used when rebuilding the cleaned file)
const toCSVValue = (val) => {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Parse integers that may contain thousands separators or quotes
const safeInt = (val) => {
  if (val === undefined || val === null) return 0;
  const n = parseInt(String(val).replace(/[",\s]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

// Shift a YYYY-MM-DD cohort start by N months using pure year/month
// arithmetic. Avoids Date#setMonth rollover (May 31 + 1 month → Jul 1).
const shiftCalendarMonth = (startDate, monthIdx) => {
  const [y, m] = startDate.split('-').map(Number);
  if (!y || !m) return startDate.slice(0, 7);
  const total = (m - 1) + monthIdx;
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

// Cleaned-CSV column order: 0=monthIndex, 1=start, 2=end, 3=dimension value,
// 4=visitors, 5=purchases, 6=percentage. The dimension NAME lives in the
// header row (col 3) so downstream modules adapt to path/source/campaign.
const DEFAULT_DIMENSION = 'Page path and screen class';
const readDimensionFromCleanCSV = (csv) => {
  const firstLine = (csv || '').split('\n')[0] || '';
  const cols = splitCSVLine(firstLine);
  return cols[3] || DEFAULT_DIMENSION;
};

// --- MODULE 1: ETL PROCESSOR ---

const DataIngestion = ({ onAdd, datasets, activeId, onSelect, onRemove, onRename }) => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');

  const processData = (text, fileName) => {
    setIsProcessing(true);
    try {
      const lines = text.split('\n');
      const processedRows = [];
      let validRowCount = 0;
      let skippedRowCount = 0;

      // Detect the breakdown dimension from the raw export header row so the
      // same pipeline handles Page path, First user source/medium, campaign etc.
      let dimensionName = DEFAULT_DIMENSION;
      const headerLine = lines.find(l => l.trim().startsWith('Monthly cohort'));
      if (headerLine) {
        const headerCols = splitCSVLine(headerLine.trim());
        if (headerCols[2] && headerCols[2].trim()) dimensionName = headerCols[2].trim();
      }

      const header = ['Monthly cohort', 'Cohort Start', 'Cohort End', dimensionName, 'Visitors', 'Purchases', 'Percentage']
        .map(toCSVValue).join(',');

      const formatDate = (dateStr) => {
        if (!dateStr || dateStr.length !== 8) return dateStr;
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#') || line.startsWith('Monthly cohort')) {
            skippedRowCount++;
            continue;
        }

        const cols = splitCSVLine(line);
        if (cols.length < 6) {
            skippedRowCount++;
            continue;
        }

        const rawMonthIndex = cols[0];
        const rawDateRange = cols[1];
        let rawPath = (cols[2] || '').trim();
        const rawVisitors = safeInt(cols[4]);
        const rawPurchases = safeInt(cols[5]);
        const rawRate = cols[6];

        if (!rawDateRange.includes('-')) {
            skippedRowCount++;
            continue;
        }

        // GA4 emits the cohort total as "All Users" (or a blank dimension
        // value). Normalise to RESERVED_TOTAL so downstream modules find it
        // without manual renaming.
        if (rawPath === '' || rawPath === 'All Users') rawPath = 'RESERVED_TOTAL';

        const [startRaw, endRaw] = rawDateRange.split('-');
        const startDate = formatDate(startRaw);
        const endDate = formatDate(endRaw);
        const monthIndex = parseInt(rawMonthIndex, 10);
        
        let percentage = "0%";
        if (rawRate) {
            const floatRate = parseFloat(String(rawRate).replace(/[",%]/g, ''));
            if (!isNaN(floatRate)) {
                percentage = (floatRate * 100).toFixed(2) + '%';
            }
        }

        processedRows.push({
            monthIndex,
            startDate,
            endDate,
            path: rawPath,
            visitors: rawVisitors,
            purchases: rawPurchases,
            percentage,
            originalLine: [monthIndex, startDate, endDate, rawPath, rawVisitors, rawPurchases, percentage].map(toCSVValue).join(',')
        });
        
        validRowCount++;
      }

      processedRows.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
        return a.monthIndex - b.monthIndex;
      });

      const finalCSV = [header, ...processedRows.map(row => row.originalLine)].join('\n');

      const newStats = {
        total: lines.length,
        valid: validRowCount,
        skipped: skippedRowCount,
        dimension: dimensionName,
        firstDate: processedRows[0]?.startDate,
        lastDate: processedRows[processedRows.length - 1]?.startDate
      };
      
      setError(null);
      const baseName = (fileName || 'Dataset').replace(/\.csv$/i, '');
      onAdd(finalCSV, newStats, baseName);
      setIsProcessing(false);

    } catch (err) {
      console.error(err);
      setError("Failed to parse file. Ensure it is the standard GA4 Cohort export.");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => processData(event.target.result, file.name);
    reader.readAsText(file);
    e.target.value = ''; // allow re-uploading the same file
  };

  const downloadCSV = (ds) => {
    if (!ds) return;
    const blob = new Blob([ds.csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.name.replace(/[^a-z0-9_-]+/gi, '_')}_cleaned.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-white">Data <span className="font-bold text-cyan-400">Ingestion</span></h2>
        <p className="text-slate-400 max-w-lg mx-auto">Upload one or more raw GA4 Cohort Export CSVs — e.g. one broken down by page path and one by first user source/medium. The breakdown dimension is detected automatically.</p>
      </div>

      <div className="glass-dropzone p-10 text-center group">
            <label className="cursor-pointer flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.1)] mb-2 group-hover:scale-110 transition-transform">
                    {isProcessing ? <RefreshCw className="animate-spin" size={32} /> : <Upload size={32} />}
                </div>
                <div>
                    <span className="block text-xl font-bold text-white mb-1">{datasets.length === 0 ? 'Upload Raw CSV' : 'Add Another Dataset'}</span>
                    <span className="text-sm text-slate-400">Supports any GA4 Cohort Export breakdown (path, source, medium, campaign…)</span>
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
      </div>

      {datasets.length > 0 && (
        <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Loaded Datasets</div>
            {datasets.map(ds => (
                <GlassCard key={ds.id} isActive={ds.id === activeId} onClick={() => onSelect(ds.id)} noPadding quiet>
                    <div className="p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ds.id === activeId ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            <CheckCircle size={20} />
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                            {editingId === ds.id ? (
                                <input
                                    autoFocus
                                    value={draftName}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { onRename(ds.id, draftName.trim() || ds.name); setEditingId(null); } if (e.key === 'Escape') setEditingId(null); }}
                                    onBlur={() => { onRename(ds.id, draftName.trim() || ds.name); setEditingId(null); }}
                                    className="w-full bg-white/5 border border-cyan-500/40 rounded-lg px-2 py-1 text-white font-bold text-sm focus:outline-none"
                                />
                            ) : (
                                <div className="font-bold text-white truncate">{ds.name}</div>
                            )}
                            <div className="text-[11px] text-slate-500 font-mono truncate">
                                {ds.stats.dimension} · {ds.stats.valid} rows · {ds.stats.firstDate} → {ds.stats.lastDate}
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setEditingId(ds.id); setDraftName(ds.name); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            title="Rename dataset (tag it, e.g. 'Paths — Meta only')"
                        >
                            <Pencil size={14} />
                        </button>
                        {ds.id === activeId && (
                            <span className="text-[9px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider shrink-0">Active</span>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); downloadCSV(ds); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            title="Download cleaned CSV"
                        >
                            <FileDown size={16} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(ds.id); }}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Remove dataset"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </GlassCard>
            ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-200 text-sm">
            <AlertCircle size={18} /> {error}
        </div>
      )}
    </div>
  );
};

// --- MODULE 2: COHORT EXPLORER ---

// Interpolated quantile of a numeric array
const quantile = (arr, q) => {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return 0;
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};

// Months between two YYYY-MM strings
const monthDiff = (a, b) => {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
};

// Parse a cleaned CohortSuite CSV into row objects (shared by Compare Lab)
const parseCleanCSV = (csv) => {
  if (!csv) return [];
  const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length >= 6) {
      rows.push({
        monthIndex: parseInt(cols[0]),
        cohortStart: cols[1],
        path: cols[3],
        visitors: safeInt(cols[4]),
        purchases: safeInt(cols[5])
      });
    }
  }
  return rows;
};

// Aggregate per-segment stats: weighted per-user cumulative curve, M0
// conversion, tail ratio (M3/M0), fragility (CV of M0 conv across cohorts).
const computeSegmentStats = (rows) => {
  const segs = {};
  rows.forEach(r => {
    if (!segs[r.path]) segs[r.path] = { path: r.path, cohorts: {} };
    if (!segs[r.path].cohorts[r.cohortStart]) segs[r.path].cohorts[r.cohortStart] = { visitors: r.visitors, pts: {} };
    segs[r.path].cohorts[r.cohortStart].pts[r.monthIndex] = r.purchases;
  });
  return Object.values(segs).map(s => {
    const cohorts = Object.values(s.cohorts);
    const visitors = cohorts.reduce((a, c) => a + c.visitors, 0);
    const maxAge = Math.max(...cohorts.flatMap(c => Object.keys(c.pts).map(Number)), 0);
    const pu = [];
    for (let m = 0; m <= maxAge; m++) {
      let p = 0, v = 0;
      cohorts.forEach(c => { if (m in c.pts) { p += c.pts[m]; v += c.visitors; } });
      pu[m] = v > 0 ? p / v : undefined;
    }
    let latestPU = 0;
    for (let m = maxAge; m >= 0; m--) { if (pu[m] !== undefined) { latestPU = pu[m]; break; } }
    const m0s = cohorts.filter(c => c.visitors > 0 && 0 in c.pts).map(c => (c.pts[0] / c.visitors) * 100);
    const mean = m0s.reduce((a, b) => a + b, 0) / (m0s.length || 1);
    const sd = Math.sqrt(m0s.reduce((a, b) => a + (b - mean) ** 2, 0) / (m0s.length || 1));
    return {
      path: s.path,
      label: s.path === 'RESERVED_TOTAL' ? 'All Traffic' : s.path,
      visitors, maxAge, pu, latestPU,
      m0Conv: (pu[0] || 0) * 100,
      tail: (pu[3] !== undefined && pu[0] > 0) ? pu[3] / pu[0] : null,
      fragility: mean > 0 ? (sd / mean) * 100 : 0,
      cohortCount: cohorts.length
    };
  });
};

// Export the first SVG inside a container as a 2x PNG. CSS variables are
// resolved to concrete colors before rasterising (an isolated SVG image has
// no access to the document's custom properties).
const exportChartPNG = (el, filename) => {
  try {
    const svg = el?.querySelector('svg');
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true);
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    const rootStyle = getComputedStyle(document.documentElement);
    let data = new XMLSerializer().serializeToString(clone);
    data = data.replace(/var\((--[\w-]+)\)/g, (_, v) => rootStyle.getPropertyValue(v).trim() || '#888');
    const bg = getComputedStyle(document.body).backgroundColor || '#030407';
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = width * 2; c.height = height * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => {
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u; a.download = `${filename}.png`; a.click();
        URL.revokeObjectURL(u);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  } catch (e) { console.error('PNG export failed', e); }
};

// Small persisted-config hook (AOV, CAC, annotations share this pattern)
const useStoredConfig = (key, fallback) => {
  const [cfg, setCfg] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  const save = (next) => {
    setCfg(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [cfg, save];
};

const CohortExplorer = ({ csvData }) => {
  const ramp = useRamp();
  const getColor = (idx) => ramp[idx % ramp.length];
  const chartWrapRef = useRef(null);

  const [rawData, setRawData] = useState([]);
  const [selectedPath, setSelectedPath] = useState('/');
  const [pathOptions, setPathOptions] = useState([]);
  const [chartMode, setChartMode] = useState('area');
  const [gridMode, setGridMode] = useState('cumulative');
  // 'absolute' | 'perUser' | 'indexed' (indexed = maturation, M0 = 100)
  const [valueMode, setValueMode] = useState('absolute');
  const [isLogScale, setIsLogScale] = useState(false);
  const [pivotData, setPivotData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [incrementalData, setIncrementalData] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [pivotAxis, setPivotAxis] = useState('cohorts');
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortOptions, setCohortOptions] = useState([]);
  // New view controls
  const [xMode, setXMode] = useState('maturity');       // 'maturity' | 'calendar'
  const [layout, setLayout] = useState('overlay');      // 'overlay' | 'multiples'
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showProjection, setShowProjection] = useState(false);
  const [gridShade, setGridShade] = useState('performance'); // 'performance' | 'calendar'
  const [projectedNames, setProjectedNames] = useState([]);
  const [copied, setCopied] = useState(false);

  const dimensionLabel = useMemo(() => readDimensionFromCleanCSV(csvData), [csvData]);
  const [annotations] = useStoredConfig('cohortsuite_annotations_v1', []);

  useEffect(() => {
    if (!csvData) return;
    const parsed = parseCleanCSV(csvData).map(r => ({
      ...r,
      percentage: 0
    }));
    // re-read percentages (parseCleanCSV drops them; keep original behaviour)
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      if (cols.length >= 7 && parsed[i - 1]) parsed[i - 1].percentage = cols[6] ? parseFloat(cols[6].replace('%', '')) : 0;
    }
    setRawData(parsed);

    const paths = Array.from(new Set(parsed.map(d => d.path))).sort();
    setPathOptions(paths);
    if (!paths.includes(selectedPath)) {
      const hasReserved = paths.includes('RESERVED_TOTAL');
      setSelectedPath(hasReserved ? 'RESERVED_TOTAL' : (paths[0] || '/'));
    }
    const cohorts = Array.from(new Set(parsed.map(d => d.cohortStart))).sort();
    setCohortOptions(cohorts);
    if (!cohorts.includes(selectedCohort)) setSelectedCohort(cohorts[0] || null);
  }, [csvData]);

  useEffect(() => {
    if (rawData.length === 0) return;

    const bySegments = pivotAxis === 'segments';
    const filtered = bySegments
      ? rawData.filter(d => d.cohortStart === selectedCohort)
      : rawData.filter(d => d.path === selectedPath);
    const grouped = {};

    filtered.forEach(d => {
      const key = bySegments ? d.path : d.cohortStart;
      if (!grouped[key]) {
        let fmt;
        if (bySegments) {
          fmt = key === 'RESERVED_TOTAL' ? 'All Traffic' : key;
        } else {
          const dateObj = new Date(d.cohortStart);
          fmt = !isNaN(dateObj)
            ? dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            : d.cohortStart;
        }
        grouped[key] = { cohortStart: key, formattedName: fmt, visitors: d.visitors, dataPoints: {} };
      }
      grouped[key].dataPoints[d.monthIndex] = { cumulative: d.purchases, percentage: d.percentage };
    });

    const tableData = Object.values(grouped).sort((a, b) =>
      bySegments ? b.visitors - a.visitors : a.cohortStart.localeCompare(b.cohortStart)
    );

    tableData.forEach(row => {
      const indices = Object.keys(row.dataPoints).map(Number).sort((a, b) => a - b);
      indices.forEach((idx, i) => {
        const current = row.dataPoints[idx];
        if (i > 0) {
          const prev = row.dataPoints[indices[i - 1]];
          current.diff = current.cumulative - prev.cumulative;
          current.growthPct = prev.cumulative > 0 ? ((current.diff / prev.cumulative) * 100).toFixed(2) : 0;
        } else { current.diff = 0; current.growthPct = 0; }
      });
    });
    setPivotData(tableData);

    // Per-series base structures (per-user space powers indexed + projections)
    const series = tableData.map(row => {
      const cum = {}, pu = {};
      Object.keys(row.dataPoints).forEach(k => {
        const i = +k;
        cum[i] = row.dataPoints[i].cumulative;
        pu[i] = row.visitors > 0 ? cum[i] / row.visitors : 0;
      });
      const maxIdx = Math.max(...Object.keys(cum).map(Number), 0);
      return { ...row, cum, pu, maxIdx };
    });
    const toMode = (s, i) => {
      if (!(i in s.cum)) return undefined;
      if (valueMode === 'perUser') return s.pu[i];
      if (valueMode === 'indexed') return s.pu[0] > 0 ? (s.pu[i] / s.pu[0]) * 100 : undefined;
      return s.cum[i];
    };

    const maxIndex = Math.max(...filtered.map(d => d.monthIndex), 0);
    const cumulativePoints = [];
    const incrementalPoints = [];
    for (let i = 0; i <= maxIndex; i++) {
      const cPoint = { index: i };
      const iPoint = { index: i };
      series.forEach(s => {
        const v = toMode(s, i);
        if (v !== undefined) {
          cPoint[s.formattedName] = v;
          cPoint[`${s.formattedName}_growth`] = s.dataPoints[i]?.growthPct;
        }
        if (s.dataPoints[i]) {
          const val = i === 0 ? s.dataPoints[i].cumulative : s.dataPoints[i].diff;
          iPoint[s.formattedName] = val;
          iPoint[`${s.formattedName}_logSafe`] = val > 0 ? val : undefined;
          iPoint[`${s.formattedName}_growth`] = s.dataPoints[i].growthPct;
        }
      });
      cumulativePoints.push(cPoint);
      incrementalPoints.push(iPoint);
    }

    // Benchmark corridor: p25–p75 + median across mature cohorts
    if (showBenchmark && !bySegments) {
      const matureAge = Math.min(6, maxIndex);
      const mature = series.filter(s => s.maxIdx >= matureAge && s.pu[0] > 0);
      if (mature.length >= 3) {
        cumulativePoints.forEach((pt, i) => {
          const vals = mature.map(s => toMode(s, i)).filter(v => v !== undefined);
          if (vals.length >= 3) {
            pt['Benchmark band'] = [quantile(vals, 0.25), quantile(vals, 0.75)];
            pt['Benchmark median'] = quantile(vals, 0.5);
          }
        });
      }
    }

    // Projections: continue young cohorts using median multipliers from
    // mature cohorts, with a p25–p75 confidence band.
    const projNames = [];
    if (showProjection && !bySegments) {
      const matureAge = Math.min(6, maxIndex);
      const mature = series.filter(s => s.maxIdx >= matureAge && s.pu[0] > 0);
      if (mature.length >= 2) {
        series.filter(s => s.maxIdx < maxIndex && s.maxIdx >= 1 && s.pu[s.maxIdx] > 0).forEach(s => {
          const from = s.maxIdx;
          const conv = (v) => valueMode === 'perUser' ? v
            : valueMode === 'indexed' ? (s.pu[0] > 0 ? (v / s.pu[0]) * 100 : 0)
            : v * s.visitors;
          let emitted = false;
          for (let t = from; t <= maxIndex; t++) {
            const ratios = mature.filter(m => m.pu[from] > 0 && (t in m.pu)).map(m => m.pu[t] / m.pu[from]);
            if (ratios.length < 2) continue;
            cumulativePoints[t][`${s.formattedName} \u203aproj`] = conv(s.pu[from] * quantile(ratios, 0.5));
            cumulativePoints[t][`${s.formattedName} \u203aband`] = [conv(s.pu[from] * quantile(ratios, 0.25)), conv(s.pu[from] * quantile(ratios, 0.75))];
            emitted = true;
          }
          if (emitted) projNames.push(s.formattedName);
        });
      }
    }
    setProjectedNames(projNames);
    setChartData(cumulativePoints);
    setIncrementalData(incrementalPoints);

    // Calendar-axis data: same series re-keyed to real months
    if (!bySegments) {
      const map = {};
      series.forEach(s => {
        Object.keys(s.cum).forEach(k => {
          const i = +k;
          const m = shiftCalendarMonth(s.cohortStart, i);
          if (!map[m]) map[m] = { month: m };
          const v = toMode(s, i);
          if (v !== undefined) map[m][s.formattedName] = v;
        });
      });
      setCalendarData(Object.values(map).sort((a, b) => a.month.localeCompare(b.month)));
    } else {
      setCalendarData([]);
    }
  }, [rawData, selectedPath, pivotAxis, selectedCohort, valueMode, showBenchmark, showProjection]);

  const toggleSeries = (name) => {
    const newHidden = new Set(hiddenSeries);
    if (newHidden.has(name)) newHidden.delete(name);
    else newHidden.add(name);
    setHiddenSeries(newHidden);
  };

  const getCellStyle = (val, diff, row, colIdx) => {
    if (val === undefined) return { className: 'bg-transparent', style: {}, title: undefined };
    // Calendar shading: cells sharing a real month share a hue, so period
    // effects light up as diagonals instead of hiding inside rows.
    if (gridShade === 'calendar' && pivotAxis === 'cohorts' && row) {
      // Cells sharing a real month share a colour; the palette is an ORDERED
      // gradient (oldest month = violet, newest = cyan) so diagonals pop and
      // the eye can read time at a glance.
      const cal = shiftCalendarMonth(row.cohortStart, colIdx);
      const base = pivotData[0] ? pivotData[0].cohortStart.slice(0, 7) : cal;
      const last = pivotData.length ? shiftCalendarMonth(pivotData[pivotData.length - 1].cohortStart, 5) : cal;
      const span = Math.max(monthDiff(base, last), 1);
      const pct = Math.round(Math.min(Math.max(monthDiff(base, cal) / span, 0), 1) * 100);
      return {
        className: 'text-white border border-white/10',
        style: { background: `color-mix(in oklab, rgba(var(--cal-b), var(--cal-alpha)) ${pct}%, rgba(var(--cal-a), var(--cal-alpha)))` },
        title: cal
      };
    }
    // Movement colouring: green = grew vs previous month, light red = fell,
    // neutral = no change. Applies to both Volume and Retention % modes.
    if (diff > 0) return { className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25', style: {}, title: 'Grew vs previous month' };
    if (diff < 0) return { className: 'bg-rose-500/15 text-rose-300 border border-rose-500/30', style: {}, title: 'Fell vs previous month' };
    return { className: 'bg-white/5 text-slate-400 border border-white/10', style: {}, title: 'No change vs previous month' };
  };

  const copyGridCSV = () => {
    const cols = [...Array(6)].map((_, i) => `M${i}`);
    const head = [pivotAxis === 'segments' ? dimensionLabel : 'Cohort', 'Visitors', ...cols].map(toCSVValue).join(',');
    const body = pivotData.map(row => {
      const cells = [...Array(6)].map((_, i) => {
        const dp = row.dataPoints[i];
        if (!dp) return '';
        return gridMode === 'percentage'
          ? (row.visitors > 0 ? ((dp.cumulative / row.visitors) * 100).toFixed(2) + '%' : '')
          : dp.cumulative;
      });
      return [row.formattedName, row.visitors, ...cells].map(toCSVValue).join(',');
    });
    const csv = [head, ...body].join('\n');
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(csv).then(done).catch(done);
    else done();
  };

  if (!csvData) return <div className="text-center text-slate-500 py-20">Please upload data in the Ingestion tab first.</div>;

  const isCalendar = xMode === 'calendar' && pivotAxis === 'cohorts' && chartMode === 'area';
  const activeChartData = isCalendar ? calendarData : chartData;
  const yTickFmt = (val) => valueMode === 'perUser' ? val.toFixed(3) : valueMode === 'indexed' ? Math.round(val) : val;
  const visibleSeries = pivotData.filter(r => !hiddenSeries.has(r.formattedName));
  const multiplesMax = Math.max(
    ...activeChartData.flatMap(pt => visibleSeries.map(s => (typeof pt[s.formattedName] === 'number' ? pt[s.formattedName] : 0))),
    0
  );

  const legendFilter = (entries) => entries.filter(e => !String(e.value).includes('\u203a') && !String(e.value).startsWith('Benchmark'));

  const seriesChart = (
    <ComposedChart data={activeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
      <defs>
        {pivotData.map((cohort, idx) => (
          <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={getColor(idx)} stopOpacity={0.16} />
            <stop offset="95%" stopColor={getColor(idx)} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
      <XAxis
        dataKey={isCalendar ? 'month' : 'index'}
        stroke="var(--chart-axis)"
        tick={{ fill: 'var(--chart-tick)', fontSize: isCalendar ? 10 : 12 }}
        label={isCalendar ? undefined : { value: 'MONTHS SINCE', position: 'insideBottom', offset: -15, fill: 'var(--chart-axis)', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.15em' }}
      />
      <YAxis stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-tick)' }} tickFormatter={yTickFmt} />
      <Tooltip content={<CustomTooltip />} />
      <Legend
        content={(props) => (
          <div className="flex flex-wrap gap-2 justify-center mt-6 px-4 max-h-24 overflow-y-auto custom-scrollbar">
            {legendFilter(props.payload).map((entry, index) => {
              const isHidden = hiddenSeries.has(entry.value);
              return (
                <button key={index} onClick={() => toggleSeries(entry.value)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all border ${isHidden ? 'bg-transparent text-slate-600 border-slate-700' : 'bg-white/5 text-slate-200 border-white/10'}`}>
                  <span className={`w-2 h-2 rounded-full ${isHidden ? 'bg-slate-600' : ''}`} style={{ backgroundColor: isHidden ? undefined : entry.color }} />
                  {entry.value}
                </button>
              );
            })}
          </div>
        )}
      />
      {showBenchmark && !isCalendar && pivotAxis === 'cohorts' && (
        <>
          <Area dataKey="Benchmark band" name="Benchmark band" stroke="none" fill="var(--band-fill)" activeDot={false} isAnimationActive={false} />
          <Line dataKey="Benchmark median" name="Benchmark median" stroke="var(--chart-tick)" strokeDasharray="2 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </>
      )}
      {pivotData.map((cohort, idx) => (
        <Area
          key={cohort.formattedName}
          hide={hiddenSeries.has(cohort.formattedName)}
          type="monotone"
          dataKey={cohort.formattedName}
          name={cohort.formattedName}
          stroke={getColor(idx)}
          fill={`url(#grad-${idx})`}
          strokeWidth={2}
          activeDot={{ r: 6 }}
        />
      ))}
      {showProjection && !isCalendar && pivotAxis === 'cohorts' && projectedNames.map((name) => {
        const idx = pivotData.findIndex(p => p.formattedName === name);
        return (
          <React.Fragment key={`proj-${name}`}>
            <Area dataKey={`${name} \u203aband`} name={`${name} \u203aband`} hide={hiddenSeries.has(name)} stroke="none" fill={getColor(idx)} fillOpacity={0.09} activeDot={false} isAnimationActive={false} />
            <Line dataKey={`${name} \u203aproj`} name={`${name} \u203aproj`} hide={hiddenSeries.has(name)} stroke={getColor(idx)} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </React.Fragment>
        );
      })}
      {isCalendar && annotations.map((a, ai) => (
        activeChartData.some(pt => pt.month === a.month) &&
        <ReferenceLine key={a.id} x={a.month} stroke="var(--warn-c)" strokeDasharray="4 4" label={{ value: a.label, fill: 'var(--warn-c)', fontSize: 10, position: 'insideTop', dy: 6 + (ai % 3) * 14 }} />
      ))}
    </ComposedChart>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                    <Tip tip="Pick ONE segment and draw one line per monthly cohort. Answers: are the users we acquire each month getting better or worse?">
                    <button 
                        onClick={() => { setPivotAxis('cohorts'); setHiddenSeries(new Set()); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pivotAxis === 'cohorts' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        By Cohort
                    </button>
                    </Tip>
                    <Tip tip="Pick ONE cohort month and draw one line per segment. Answers: which page / source / campaign produced the best users that month?">
                    <button 
                        onClick={() => { setPivotAxis('segments'); setHiddenSeries(new Set()); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pivotAxis === 'segments' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Compare Segments
                    </button>
                    </Tip>
                </div>

                <Tip className="block w-full md:w-96" tip={pivotAxis === 'cohorts' ? 'Choose which segment to analyse. "All Traffic" = the whole site. Every line on the chart is then one monthly cohort of this segment.' : 'Choose which cohort month to break down. Every line on the chart is then one segment of users acquired in this month.'}>
                <div className="relative group w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter size={16} className="text-slate-400" />
                    </div>
                    {pivotAxis === 'cohorts' ? (
                        <select 
                          value={selectedPath}
                          onChange={(e) => setSelectedPath(e.target.value)}
                          className="appearance-none bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-cyan-500/50 w-full text-sm font-medium cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          {pathOptions.map(p => (
                            <option key={p} value={p} className="bg-slate-900 text-slate-200">
                              {p === 'RESERVED_TOTAL' ? 'All Traffic (Total)' : p}
                            </option>
                          ))}
                        </select>
                    ) : (
                        <select 
                          value={selectedCohort || ''}
                          onChange={(e) => setSelectedCohort(e.target.value)}
                          className="appearance-none bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-cyan-500/50 w-full text-sm font-medium cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          {cohortOptions.map(c => (
                            <option key={c} value={c} className="bg-slate-900 text-slate-200">
                              Cohort: {c}
                            </option>
                          ))}
                        </select>
                    )}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronRight size={16} className="text-slate-400 rotate-90" />
                    </div>
                </div>
                </Tip>
             </div>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                 <Tip tip="Running total of purchases since each cohort's first visit. Rising = value still accruing; flat = the cohort has gone quiet.">
                 <button 
                    onClick={() => setChartMode('area')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartMode === 'area' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                    <TrendingUp size={16} /> Cumulative
                 </button>
                 </Tip>
                 <Tip tip="NEW purchases added in each month, not the running total. Shows exactly when buying happens — most segments spike at M0-M1 then trail.">
                 <button 
                    onClick={() => setChartMode('line')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartMode === 'line' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                    <Activity size={16} /> Incremental
                 </button>
                 </Tip>
              </div>
        </div>

        {/* Analysis lenses — only shown where they apply */}
        {chartMode === 'area' && (
          <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <Tip tip="Raw purchase counts. Good for sizing volume; unfair for comparing cohorts or segments of different sizes.">
                  <button onClick={() => setValueMode('absolute')} className={`px-3 py-1.5 rounded font-semibold transition-all ${valueMode === 'absolute' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Absolute</button>
                  </Tip>
                  <Tip tip="Purchases ÷ cohort visitors. THE fair comparison — a small high-quality segment beats a big mediocre one here.">
                  <button onClick={() => setValueMode('perUser')} className={`px-3 py-1.5 rounded font-semibold transition-all ${valueMode === 'perUser' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Per User</button>
                  </Tip>
                  <Tip tip="Maturation view: every line starts at 100 (its own Month 0). Size disappears — only SHAPE remains. Steeper = users keep buying after acquisition; flat = one-and-done.">
                  <button onClick={() => setValueMode('indexed')} className={`px-3 py-1.5 rounded font-semibold transition-all ${valueMode === 'indexed' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Indexed</button>
                  </Tip>
              </div>
              {pivotAxis === 'cohorts' && (
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                    <Tip tip="X-axis = months since first visit. Compares cohorts at the SAME AGE — the right lens for 'do our users age well?'">
                    <button onClick={() => setXMode('maturity')} className={`px-3 py-1.5 rounded font-semibold transition-all ${xMode === 'maturity' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Maturity axis</button>
                    </Tip>
                    <Tip tip="X-axis = real calendar months. All cohorts aligned in time — seasonality, promos and site changes appear as bumps every line shares. Annotation flags from Purchase Velocity show here.">
                    <button onClick={() => setXMode('calendar')} className={`px-3 py-1.5 rounded font-semibold transition-all ${xMode === 'calendar' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Calendar axis</button>
                    </Tip>
                </div>
              )}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <Tip tip="All series on one chart. Best under ~8 lines.">
                  <button onClick={() => setLayout('overlay')} className={`px-3 py-1.5 rounded font-semibold transition-all ${layout === 'overlay' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Overlay</button>
                  </Tip>
                  <Tip tip="One mini-chart per series on a SHARED scale. With many series this beats spaghetti — your eye compares shapes instantly.">
                  <button onClick={() => setLayout('multiples')} className={`px-3 py-1.5 rounded font-semibold transition-all ${layout === 'multiples' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Multiples</button>
                  </Tip>
              </div>
              {pivotAxis === 'cohorts' && xMode === 'maturity' && layout === 'overlay' && (
                <>
                  <Tip tip="Shaded corridor = the middle 50% (p25-p75) of your MATURE cohorts; dotted line = their median. Any cohort inside the band is normal. Above = genuinely better acquisition, below = investigate.">
                  <button onClick={() => setShowBenchmark(!showBenchmark)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${showBenchmark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                    Benchmark band
                  </button>
                  </Tip>
                  <Tip tip="Dashed continuation of young cohorts, using how your mature cohorts multiplied from the same age. Shaded = p25-p75 range. Kills the false 'cliff' at the right edge — recent cohorts aren't failing, they're just young.">
                  <button onClick={() => setShowProjection(!showProjection)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${showProjection ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                    Projections
                  </button>
                  </Tip>
                </>
              )}
          </div>
        )}

        <GlassCard className={layout === 'multiples' && chartMode === 'area' ? 'min-h-[300px]' : 'h-[500px]'} title={
            (chartMode === 'area' ? 'Cumulative LTV Curve' : 'Incremental Growth (New Purchases)') +
            (pivotAxis === 'segments' ? ` — by ${dimensionLabel} (${selectedCohort || ''})` : '') +
            (valueMode === 'indexed' && chartMode === 'area' ? ' — Indexed (M0 = 100)' : '')
        } headerRight={
            <>
               {chartMode === 'line' && (
                  <div className="flex bg-[#0e0e12] p-1 rounded-lg border border-white/10 text-xs shadow-lg">
                      <Tip tip="Normal scale — compares sizes.">
                      <button onClick={() => setIsLogScale(false)} className={`px-3 py-1.5 rounded transition-all font-semibold ${!isLogScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Linear</button>
                      </Tip>
                      <Tip tip="Log scale — compares GROWTH RATES. A straight line means constant % change; big and small series become comparable.">
                      <button onClick={() => setIsLogScale(true)} className={`px-3 py-1.5 rounded transition-all font-semibold ${isLogScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Logarithmic</button>
                      </Tip>
                  </div>
               )}
               <Tip tip="Download this chart as a PNG — drop it straight into a report or deck.">
               <button onClick={() => exportChartPNG(chartWrapRef.current, 'cohortsuite_chart')} aria-label="Export chart as PNG" className="p-2 rounded-lg bg-[#0e0e12] border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors">
                  <Camera size={14} />
               </button>
               </Tip>
            </>
        }>
            
            <div ref={chartWrapRef} className="h-full w-full">
            {layout === 'multiples' && chartMode === 'area' ? (
                <div className="pt-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleSeries.map((s) => {
                            const idx = pivotData.findIndex(p => p.formattedName === s.formattedName);
                            return (
                                <div key={s.formattedName} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs font-bold text-slate-200 truncate mr-2" title={s.formattedName}>{s.formattedName}</span>
                                        <span className="text-[10px] text-slate-500 data-num shrink-0">{s.visitors.toLocaleString()}</span>
                                    </div>
                                    <div className="h-[110px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={activeChartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                                                <YAxis hide domain={[0, multiplesMax || 'auto']} />
                                                <XAxis hide dataKey={isCalendar ? 'month' : 'index'} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey={s.formattedName} name={s.formattedName} stroke={getColor(idx)} fill={getColor(idx)} fillOpacity={0.12} strokeWidth={2} dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%" className="glow-stroke-soft">
                    {chartMode === 'area' ? seriesChart : (
                        <LineChart data={incrementalData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis 
                                    dataKey="index" 
                                    stroke="var(--chart-axis)" 
                                    tick={{ fill: 'var(--chart-tick)' }} 
                                    label={{ value: 'MONTHS SINCE', position: 'insideBottom', offset: -15, fill: 'var(--chart-axis)', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.15em' }} 
                                />
                                <YAxis 
                                    stroke="var(--chart-axis)" 
                                    tick={{ fill: 'var(--chart-tick)' }} 
                                    scale={isLogScale ? 'log' : 'auto'} 
                                    domain={isLogScale ? [1, 'auto'] : [0, 'auto']} 
                                    allowDataOverflow={isLogScale}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    content={(props) => (
                                        <div className="flex flex-wrap gap-2 justify-center mt-6 px-4 max-h-24 overflow-y-auto custom-scrollbar">
                                            {legendFilter(props.payload).map((entry, index) => {
                                                const isHidden = hiddenSeries.has(entry.value);
                                                return (
                                                    <button key={index} onClick={() => toggleSeries(entry.value)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all border ${isHidden ? 'bg-transparent text-slate-600 border-slate-700' : 'bg-white/5 text-slate-200 border-white/10'}`}>
                                                        <span className={`w-2 h-2 rounded-full ${isHidden ? 'bg-slate-600' : ''}`} style={{ backgroundColor: isHidden ? undefined : entry.color }} />
                                                        {entry.value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                />
                                {pivotData.map((cohort, idx) => (
                                    <Line 
                                        key={cohort.formattedName}
                                        hide={hiddenSeries.has(cohort.formattedName)}
                                        type="monotone"
                                        dataKey={isLogScale ? `${cohort.formattedName}_logSafe` : cohort.formattedName} 
                                        name={cohort.formattedName}
                                        stroke={getColor(idx)}
                                        strokeWidth={2}
                                        dot={{ r: 3, strokeWidth: 0, fill: getColor(idx) }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            )}
            </div>
        </GlassCard>

        <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center flex-wrap gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-cyan-400"/> 
                    {pivotAxis === 'segments' ? `${dimensionLabel} Performance Grid` : 'Cohort Performance Grid'}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                    {pivotAxis === 'segments' && valueMode === 'absolute' && chartMode === 'area' && (
                        <span className="text-[10px] text-amber-400/80 font-medium hidden md:block">Tip: use "Per User" above for fair segment comparison</span>
                    )}
                    {pivotAxis === 'cohorts' && (
                        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                            <Tip tip="Cells coloured by movement: green = grew vs previous month, red = fell, grey = flat.">
                            <button onClick={() => setGridShade('performance')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridShade === 'performance' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Performance</button>
                            </Tip>
                            <Tip tip="Cells in the same REAL month share a colour, shading violet (oldest) to cyan (newest) — hover a cell to see which month. A diagonal stripe = something hit everyone that month (promo, site change, season). A standout row = that cohort's users were simply better.">
                            <button onClick={() => setGridShade('calendar')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridShade === 'calendar' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Calendar</button>
                            </Tip>
                        </div>
                    )}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                        <Tip tip="Cumulative purchase counts per month since acquisition.">
                        <button onClick={() => setGridMode('cumulative')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'cumulative' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Volume</button>
                        </Tip>
                        <Tip tip="Cumulative purchases ÷ cohort visitors — the % of each cohort that has converted by month N. Green = still climbing, grey = gone quiet.">
                        <button onClick={() => setGridMode('percentage')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'percentage' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Retention %</button>
                        </Tip>
                    </div>
                    <Tip tip="Copy this grid as CSV — paste straight into Sheets or Excel.">
                    <button onClick={copyGridCSV} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${copied ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                        <Copy size={12} /> {copied ? 'Copied' : 'Copy CSV'}
                    </button>
                    </Tip>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-4 border-b border-white/10 sticky left-0 bg-[#05070b] z-10"><Tip tip={pivotAxis === 'segments' ? 'One row per segment of the selected cohort month, biggest first.' : 'One row per monthly cohort: everyone whose FIRST visit fell in that month.'}><span className="cursor-help">{pivotAxis === 'segments' ? dimensionLabel : 'Cohort'}</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="First-touch visitors in the cohort — the denominator for every Retention % cell in the row."><span className="cursor-help">Visitors</span></Tip></th>
                            {[...Array(6)].map((_, i) => <th key={i} className="p-4 border-b border-white/10 text-center"><Tip tip={i === 0 ? 'Month 0 = the month users first arrived.' : `${i} month${i > 1 ? 's' : ''} after first visit.`}><span className="cursor-help">M{i}</span></Tip></th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {pivotData.map((row) => (
                            <tr key={row.cohortStart} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-sm font-bold text-white sticky left-0 bg-[#05070b]/90 border-r border-white/10">{row.formattedName}</td>
                                <td className="p-4 text-sm text-right font-mono text-slate-300 border-r border-white/5">{row.visitors.toLocaleString()}</td>
                                {[...Array(6)].map((_, i) => {
                                    const dp = row.dataPoints[i];
                                    const displayVal = gridMode === 'percentage' ? (dp?.cumulative ? ((dp.cumulative / row.visitors) * 100).toFixed(2) + '%' : '-') : dp?.cumulative || '-';
                                    const cell = dp ? getCellStyle(gridMode === 'percentage' ? parseFloat(displayVal) : dp.cumulative, dp.diff, row, i) : null;
                                    return (
                                        <td key={i} className="p-2 border-r border-white/5">
                                            {dp && <div className={`rounded-lg p-2 text-center text-xs font-bold data-num ${cell.className}`} style={cell.style} title={cell.title}>{displayVal}</div>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    </div>
  );
};

// --- MODULE 2B: COMPARE LAB ---

const CompareLab = ({ datasets, activeId, onSelectDataset }) => {
  const ramp = useRamp();
  const active = datasets.find(d => d.id === activeId) || null;
  const stats = useMemo(() => active ? computeSegmentStats(parseCleanCSV(active.csv)).sort((a, b) => b.visitors - a.visitors) : [], [active]);
  const dimensionLabel = useMemo(() => active ? readDimensionFromCleanCSV(active.csv) : '', [active]);

  const realSegs = stats.filter(s => s.path !== 'RESERVED_TOTAL');
  const [segA, setSegA] = useState(null);
  const [segB, setSegB] = useState(null);
  useEffect(() => {
    if (!realSegs.length) return;
    if (!realSegs.some(s => s.path === segA)) setSegA(realSegs[0]?.path || null);
    if (!realSegs.some(s => s.path === segB)) setSegB(realSegs[1]?.path || realSegs[0]?.path || null);
  }, [active, stats.length]);

  const [aovConfig, saveAov] = useStoredConfig('cohortsuite_aov_v1', { default: 85, overrides: {} });
  const [cacConfig, saveCac] = useStoredConfig('cohortsuite_cac_v1', { default: 25, overrides: {} });
  const getCfg = (cfg, path) => {
    const o = cfg.overrides[path];
    return (o !== undefined && o !== '' && !isNaN(parseFloat(o))) ? parseFloat(o) : cfg.default;
  };
  const payback = (stat, aov, cac) => {
    if (!stat || !(cac > 0)) return null;
    for (let m = 0; m <= stat.maxAge; m++) {
      if (stat.pu[m] !== undefined && stat.pu[m] * aov >= cac) return m;
    }
    return null;
  };

  const A = stats.find(s => s.path === segA);
  const B = stats.find(s => s.path === segB);
  // Matched maturity: only compare at ages both segments have actually reached
  const matchedAge = A && B ? Math.min(A.maxAge, B.maxAge) : 0;
  const duelData = useMemo(() => {
    if (!A || !B) return [];
    const pts = [];
    for (let m = 0; m <= matchedAge; m++) {
      pts.push({ index: m, [A.label]: A.pu[m], [B.label]: B.pu[m] });
    }
    return pts;
  }, [A, B, matchedAge]);

  const DeltaChip = ({ label, a, b, fmt, higherIsBetter = true, tip }) => {
    if (a === null || b === null || a === undefined || b === undefined) return (
      <Tip tip={tip} className="block">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 cursor-help">
        <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1">{label}</div>
        <div className="text-xs text-slate-500">insufficient data</div>
      </div>
      </Tip>
    );
    const winner = a === b ? null : (a > b) === higherIsBetter ? 'A' : 'B';
    return (
      <Tip tip={tip} className="block">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 cursor-help">
        <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1">{label}</div>
        <div className="flex items-baseline gap-2 text-sm data-num">
          <span className={winner === 'A' ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{fmt(a)}</span>
          <span className="text-slate-600 text-xs">vs</span>
          <span className={winner === 'B' ? 'text-emerald-300 font-bold' : 'text-slate-300'}>{fmt(b)}</span>
        </div>
      </div>
      </Tip>
    );
  };

  // Dimension leaderboard: separation score per dataset — how strongly the
  // dimension's segments diverge in per-user value, visitor-weighted.
  const leaderboard = useMemo(() => {
    return datasets.map(ds => {
      const segs = computeSegmentStats(parseCleanCSV(ds.csv))
        .filter(s => s.path !== 'RESERVED_TOTAL' && s.visitors >= 50 && (s.pu[0] || 0) > 0);
      if (segs.length < 2) return { id: ds.id, name: ds.name, dimension: ds.stats?.dimension, segCount: segs.length, score: null };
      const basisAge = Math.min(3, ...segs.map(s => s.maxAge));
      const val = (s) => s.pu[basisAge] !== undefined ? s.pu[basisAge] : s.pu[0];
      const sorted = [...segs].sort((a, b) => val(b) - val(a));
      const totalVis = sorted.reduce((a, s) => a + s.visitors, 0);
      let acc = 0; const top = [], bottom = [];
      sorted.forEach(s => { (acc < totalVis / 2 ? top : bottom).push(s); acc += s.visitors; });
      const wavg = (arr) => {
        const v = arr.reduce((a, s) => a + s.visitors, 0);
        return v > 0 ? arr.reduce((a, s) => a + val(s) * s.visitors, 0) / v : 0;
      };
      const bot = wavg(bottom);
      return {
        id: ds.id, name: ds.name, dimension: ds.stats?.dimension,
        segCount: segs.length, basisAge,
        score: bot > 0 ? wavg(top) / bot : null,
        best: sorted[0], worst: sorted[sorted.length - 1], valOf: val
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [datasets]);

  if (!active) return <div className="text-center text-slate-500 py-20">Please upload data in the Ingestion tab first.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* SEGMENT DUEL */}
        <GlassCard title={`Segment Duel — matched maturity (M0–M${matchedAge})`} icon={Scale} className="min-h-[420px]">
            <div className="flex flex-col lg:flex-row gap-6 mt-2 h-full">
                <div className="lg:w-[340px] shrink-0 space-y-3">
                    {[{ v: segA, set: setSegA, tag: 'A', color: ramp[0] }, { v: segB, set: setSegB, tag: 'B', color: ramp[1] }].map(({ v, set, tag, color }) => (
                        <Tip key={tag} className="flex items-center gap-2" tip={`Contender ${tag}. All metrics below compare A and B only at ages BOTH have reached — never a 14-month-old segment against a 3-month-old one.`}>
                        <div className="flex items-center gap-2 w-full">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${color}22`, color }}>{tag}</span>
                            <select value={v || ''} onChange={(e) => set(e.target.value)} className="appearance-none flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-colors">
                                {realSegs.map(s => <option key={s.path} value={s.path} className="bg-slate-900 text-slate-200">{s.label}</option>)}
                            </select>
                        </div>
                        </Tip>
                    ))}
                    {A && B && (
                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <DeltaChip label="M0 conversion" a={A.m0Conv} b={B.m0Conv} fmt={(v) => v.toFixed(2) + '%'} tip="% of each segment's visitors who purchase in their FIRST month. Green = winner. The instant-quality signal." />
                            <DeltaChip label={`Value / user @ M${matchedAge}`} a={A.pu[matchedAge]} b={B.pu[matchedAge]} fmt={(v) => v?.toFixed(4)} tip={`Cumulative purchases per visitor after ${matchedAge} months — the fairest single number for 'which segment produces more valuable users'.`} />
                            <DeltaChip label="Tail ratio (M3 ÷ M0)" a={A.tail} b={B.tail} fmt={(v) => v.toFixed(2) + '×'} tip="Value at Month 3 ÷ value at Month 0. 1.0× = one-and-done buyers; 1.3×+ = the segment keeps compounding after acquisition. High tail justifies higher CAC." />
                            <DeltaChip label="Fragility (CV of M0 conv)" a={A.fragility} b={B.fragility} fmt={(v) => v.toFixed(0) + '%'} higherIsBetter={false} tip="How much M0 conversion swings between cohorts (coefficient of variation). LOWER is better — high fragility means don't scale this segment on the back of one good month." />
                            <DeltaChip label="Payback month (AOV/CAC below)" a={payback(A, getCfg(aovConfig, A.path), getCfg(cacConfig, A.path))} b={payback(B, getCfg(aovConfig, B.path), getCfg(cacConfig, B.path))} fmt={(v) => 'M' + v} higherIsBetter={false} tip="First month where value/user × AOV covers CAC (edit both in the Economics table below). LOWER is better. 'Insufficient data' = CAC not recovered within the observed window at current settings." />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    {/* Fixed height: ResponsiveContainer at 100% of an auto-height
                        parent re-measures itself and grows forever. */}
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%" className="glow-stroke-soft">
                            <ComposedChart data={duelData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis dataKey="index" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-tick)' }} label={{ value: 'MONTHS SINCE FIRST VISIT', position: 'insideBottom', offset: -5, fill: 'var(--chart-axis)', fontSize: 9, fontWeight: 'bold', letterSpacing: '0.15em' }} />
                                <YAxis stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-tick)' }} tickFormatter={(v) => v.toFixed(3)} domain={[0, 'auto']} />
                                <Tooltip content={<CustomTooltip />} />
                                {A && <Line type="monotone" dataKey={A.label} stroke={ramp[0]} strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />}
                                {B && <Line type="monotone" dataKey={B.label} stroke={ramp[1]} strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-[11px]">
                        {A && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ramp[0] }} /><span className="text-slate-300 font-medium">{A.label}</span></span>}
                        {B && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ramp[1] }} /><span className="text-slate-300 font-medium">{B.label}</span></span>}
                    </div>
                    <div className="text-[10px] text-slate-500 text-center mt-1">Per-user cumulative value · both segments clipped to the age both have reached</div>
                </div>
            </div>
        </GlassCard>

        {/* SEGMENT ECONOMICS */}
        <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart size={18} className="text-cyan-400" /> Segment Economics — {dimensionLabel}</h3>
                <p className="text-xs text-slate-500 mt-1">AOV and CAC are editable and stored locally. Payback = first month where value/user × AOV covers CAC.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-4 border-b border-white/10">{dimensionLabel}</th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="Total first-touch visitors across all cohorts of this segment."><span className="cursor-help">Visitors</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="% of visitors purchasing in their first month (visitor-weighted across cohorts)."><span className="cursor-help">M0 Conv</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="Cumulative purchases per visitor at this segment's oldest observed age. Multiply by AOV for £ value per visitor."><span className="cursor-help">Value/User</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="Average order value for this segment. Editable — stored in this browser only."><span className="cursor-help">AOV £</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-right"><Tip tip="Customer acquisition cost — what you pay to land one visitor/booking from this segment. Editable — use your real blended or per-campaign CPA."><span className="cursor-help">CAC £</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-center"><Tip tip="First month where value/user × AOV ≥ CAC. M0-M1 = self-funding growth; '—' = never recovers within the observed window at these settings."><span className="cursor-help">Payback</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-center"><Tip tip="Month-3 value ÷ Month-0 value. 1.0× = one-and-done; higher = the segment keeps buying after acquisition."><span className="cursor-help">Tail M3/M0</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-center"><Tip tip="How much M0 conversion swings cohort-to-cohort. Green <15% = stable, amber = watch, red >35% = too volatile to scale on one good month."><span className="cursor-help">Fragility</span></Tip></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {realSegs.map((s) => {
                            const aov = getCfg(aovConfig, s.path);
                            const cac = getCfg(cacConfig, s.path);
                            const pb = payback(s, aov, cac);
                            const fragTone = s.fragility < 15 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : s.fragility < 35 ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : 'bg-rose-500/10 text-rose-300 border-rose-500/25';
                            return (
                                <tr key={s.path} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-white max-w-[260px] truncate" title={s.label}>{s.label}</td>
                                    <td className="p-4 text-right data-num text-slate-300">{s.visitors.toLocaleString()}</td>
                                    <td className="p-4 text-right data-num text-cyan-300">{s.m0Conv.toFixed(2)}%</td>
                                    <td className="p-4 text-right data-num text-slate-200">{s.latestPU.toFixed(4)}</td>
                                    <td className="p-3 text-right">
                                        <input type="number" value={aovConfig.overrides[s.path] ?? aovConfig.default}
                                            onChange={(e) => saveAov({ ...aovConfig, overrides: { ...aovConfig.overrides, [s.path]: e.target.value } })}
                                            className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-cyan-300 text-xs font-mono text-right focus:outline-none focus:border-cyan-500/50" />
                                    </td>
                                    <td className="p-3 text-right">
                                        <input type="number" value={cacConfig.overrides[s.path] ?? cacConfig.default}
                                            onChange={(e) => saveCac({ ...cacConfig, overrides: { ...cacConfig.overrides, [s.path]: e.target.value } })}
                                            className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-violet-300 text-xs font-mono text-right focus:outline-none focus:border-cyan-500/50" />
                                    </td>
                                    <td className="p-4 text-center">
                                        {pb !== null
                                          ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs font-bold data-num">M{pb}</span>
                                          : <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 text-xs font-bold" title="Never recovers CAC within observed window">—</span>}
                                    </td>
                                    <td className="p-4 text-center data-num text-slate-300">{s.tail !== null ? s.tail.toFixed(2) + '×' : '—'}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded border text-xs font-bold data-num ${fragTone}`}>{s.fragility.toFixed(0)}%</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </GlassCard>

        {/* DIMENSION LEADERBOARD */}
        <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><ListOrdered size={18} className="text-cyan-400" /> Dimension Leaderboard</h3>
                <p className="text-xs text-slate-500 mt-1">Which GA4 breakdown actually separates outcomes? Score = visitor-weighted value of the top half of segments ÷ bottom half. Upload more exports (source, campaign, device, city…) to rank them.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-4 border-b border-white/10">Dataset</th>
                            <th className="p-4 border-b border-white/10">Dimension</th>
                            <th className="p-4 border-b border-white/10 text-center"><Tip tip="Segments with 50+ visitors and at least one purchase — smaller ones are excluded as noise."><span className="cursor-help">Segments</span></Tip></th>
                            <th className="p-4 border-b border-white/10 text-center"><Tip tip="Visitor-weighted value of the TOP half of segments ÷ the BOTTOM half. 1.0× = this dimension doesn't matter; 3×+ = optimising by this dimension moves real money. Rank your exports here to decide what to segment by."><span className="cursor-help">Separation</span></Tip></th>
                            <th className="p-4 border-b border-white/10"><Tip tip="Highest per-user value segment at the comparison age — your scaling candidate for this dimension."><span className="cursor-help">Strongest Segment</span></Tip></th>
                            <th className="p-4 border-b border-white/10"><Tip tip="Lowest per-user value segment — where budget or page effort is leaking."><span className="cursor-help">Weakest Segment</span></Tip></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {leaderboard.map((row, i) => (
                            <tr key={row.id} onClick={() => onSelectDataset(row.id)} className={`cursor-pointer transition-colors hover:bg-white/5 ${row.id === activeId ? 'bg-cyan-500/5' : ''}`} title="Click to make this the active dataset">
                                <td className="p-4 font-bold text-white">
                                    <span className="text-slate-500 data-num mr-2">#{i + 1}</span>{row.name}
                                    {row.id === activeId && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">Active</span>}
                                </td>
                                <td className="p-4 text-slate-400 text-xs">{row.dimension}</td>
                                <td className="p-4 text-center data-num text-slate-300">{row.segCount}</td>
                                <td className="p-4 text-center">
                                    {row.score !== null
                                      ? <span className="text-lg font-bold data-num glow-num text-cyan-300">{row.score.toFixed(2)}×</span>
                                      : <span className="text-xs text-slate-500">needs 2+ segments</span>}
                                </td>
                                <td className="p-4 text-xs">
                                    {row.best ? <><span className="text-emerald-300 font-bold">{row.best.label}</span> <span className="text-slate-500 data-num">({row.valOf(row.best).toFixed(4)}/user @M{row.basisAge})</span></> : '—'}
                                </td>
                                <td className="p-4 text-xs">
                                    {row.worst ? <><span className="text-rose-300 font-bold">{row.worst.label}</span> <span className="text-slate-500 data-num">({row.valOf(row.worst).toFixed(4)}/user)</span></> : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    </div>
  );
};

// --- MODULE 3: VELOCITY EXPLORER ---

const VelocityExplorer = ({ csvData }) => {
  const [pathData, setPathData] = useState([]);
  const [overallData, setOverallData] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [view, setView] = useState('overview');
  const [maxPathVisits, setMaxPathVisits] = useState(0);
  const [partialMonth, setPartialMonth] = useState(null);
  const [excludePartial, setExcludePartial] = useState(true);

  // Configurable AOV: a default plus per-segment overrides, persisted locally.
  const [aovConfig, setAovConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('cohortsuite_aov_v1');
      return saved ? JSON.parse(saved) : { default: 85, overrides: {} };
    } catch { return { default: 85, overrides: {} }; }
  });
  const saveAov = (next) => {
    setAovConfig(next);
    try { localStorage.setItem('cohortsuite_aov_v1', JSON.stringify(next)); } catch {}
  };
  const getAov = (path) => {
    const o = aovConfig.overrides[path];
    return (o !== undefined && o !== '' && !isNaN(parseFloat(o))) ? parseFloat(o) : aovConfig.default;
  };

  const dimensionLabel = useMemo(() => readDimensionFromCleanCSV(csvData), [csvData]);
  const isPathDimension = /path|page/i.test(dimensionLabel);
  const velocityChartRef = useRef(null);

  // Timeline annotations: local notes pinned to calendar months, rendered as
  // markers here and on the cohort calendar-axis chart.
  const [annotations, saveAnnotations] = useStoredConfig('cohortsuite_annotations_v1', []);
  const [annMonth, setAnnMonth] = useState('');
  const [annLabel, setAnnLabel] = useState('');
  const addAnnotation = () => {
    if (!annMonth || !annLabel.trim()) return;
    // Read the freshest stored list before appending (multiple mounted
    // instances share the key) and keep the month selected afterwards —
    // Chrome's controlled month input keeps DISPLAYING a cleared value, so
    // re-picking it fires no change event and the next Add silently no-ops.
    let current = annotations;
    try {
      const s = localStorage.getItem('cohortsuite_annotations_v1');
      if (s) current = JSON.parse(s);
    } catch {}
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    saveAnnotations([...current, { id, month: annMonth, label: annLabel.trim() }]);
    setAnnLabel('');
  };

  useEffect(() => {
    if (!csvData) return;
    
    // 1. Parsing and Initial Clean Up
    const lines = csvData.split('\n');
    if (lines.length < 2) return;

    // Map rows to objects
    const rawObjs = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if(!line) continue;
        const cols = splitCSVLine(line);
        if (cols.length < 6) continue;
        rawObjs.push({
            monthIdx: parseInt(cols[0]),
            startDate: cols[1],
            endDate: cols[2],
            path: cols[3],
            visitors: safeInt(cols[4]),
            purchases: safeInt(cols[5])
        });
    }

    // Detect a partial (in-progress) final month: if the latest cohort end
    // date isn't the last day of its month, that calendar month is incomplete
    // and both velocity and recent-cohort purchases will be understated.
    const maxEnd = rawObjs.reduce((m, r) => (r.endDate > m ? r.endDate : m), '');
    let detectedPartial = null;
    if (maxEnd && maxEnd.length === 10) {
        const [ey, em, ed] = maxEnd.split('-').map(Number);
        const daysInEndMonth = new Date(ey, em, 0).getDate();
        if (ed < daysInEndMonth) detectedPartial = `${ey}-${String(em).padStart(2, '0')}`;
    }
    setPartialMonth(detectedPartial);

    // 2. Build Cohort Incremental Logic
    // We must process cohort by cohort to find incremental growth per calendar month
    const cohortMap = {}; // Key: Path|StartDate -> Array of rows
    rawObjs.forEach(r => {
        const key = `${r.path}|${r.startDate}`;
        if (!cohortMap[key]) cohortMap[key] = [];
        cohortMap[key].push(r);
    });

    const monthlyStatsGlobal = {}; // Key: YYYY-MM -> { visitors, purchases }
    const pathTrendStats = {};     // Key: Path -> { YYYY-MM: purchases }
    const pathTotals = {};         // Key: Path -> { visitors, purchases }

    Object.keys(cohortMap).forEach(key => {
        const [path, startDate] = key.split('|');
        const rows = cohortMap[key].sort((a,b) => a.monthIdx - b.monthIdx);
        
        let prevCumulative = 0;
        
        // Tracking visitors only once per cohort (at month 0)
        const cohortVisitors = rows.find(r => r.monthIdx === 0)?.visitors || rows[0].visitors;
        
        // Add to Path Totals
        if (!pathTotals[path]) pathTotals[path] = { visitors: 0, purchases: 0 };
        pathTotals[path].visitors += cohortVisitors;

        // Add to Global Month Stats (Visitors assigned to cohort start month)
        const startMonthKey = startDate.slice(0, 7);
        if (!monthlyStatsGlobal[startMonthKey]) monthlyStatsGlobal[startMonthKey] = { visitors: 0, purchases: 0 };
        // We only add visitors if the path is RESERVED_TOTAL or we are aggregating manually?
        // If we use RESERVED_TOTAL rows for global stats, we shouldn't sum up paths.
        // Assuming CSV contains RESERVED_TOTAL for global.
        
        if (path === 'RESERVED_TOTAL') {
             monthlyStatsGlobal[startMonthKey].visitors += cohortVisitors;
        }

        // Process Purchases (Incremental)
        rows.forEach(row => {
            let incremental = row.purchases - prevCumulative;
            if (incremental < 0) incremental = 0; // Sanity check
            prevCumulative = row.purchases;

            // Determine Calendar Month (pure year/month arithmetic — Date#setMonth
            // rolls May 31 + 1 month over to July 1 and misassigns the purchase)
            const calMonth = shiftCalendarMonth(startDate, row.monthIdx);

            // Add to Global Stats (if RESERVED_TOTAL)
            if (path === 'RESERVED_TOTAL') {
                if (!monthlyStatsGlobal[calMonth]) monthlyStatsGlobal[calMonth] = { visitors: 0, purchases: 0 };
                monthlyStatsGlobal[calMonth].purchases += incremental;
            }

            // Add to Path Trend Stats
            if (!pathTrendStats[path]) pathTrendStats[path] = {};
            if (!pathTrendStats[path][calMonth]) pathTrendStats[path][calMonth] = 0;
            pathTrendStats[path][calMonth] += incremental;

            // Add to Path Totals (Purchases are summed increments)
            pathTotals[path].purchases += incremental;
        });
    });

    // 3. Format Global Overview Data
    const globalData = Object.keys(monthlyStatsGlobal).sort().map(m => {
        const d = monthlyStatsGlobal[m];
        const daysInMonth = new Date(parseInt(m.slice(0,4)), parseInt(m.slice(5,7)), 0).getDate();
        const isPartial = m === detectedPartial;
        // For an in-progress month, velocity should divide by elapsed days,
        // not the full month, otherwise the run-rate is artificially deflated.
        const elapsedDays = isPartial ? parseInt(maxEnd.slice(8, 10), 10) : daysInMonth;
        return {
            month: m,
            isPartial,
            visitors: d.visitors,
            purchases: d.purchases,
            conversion: d.visitors > 0 ? (d.purchases / d.visitors * 100).toFixed(2) : "0.00",
            velocity: (d.purchases / Math.max(elapsedDays, 1)).toFixed(1)
        };
    });
    setOverallData(globalData);

    // 4. Format Path Data
    const pathList = Object.keys(pathTotals)
        .filter(p => p !== 'RESERVED_TOTAL')
        .map(p => {
            const totals = pathTotals[p];
            const trendObj = pathTrendStats[p] || {};
            const trend = Object.keys(trendObj).sort().map(m => ({
                month: m,
                purchases: trendObj[m]
            }));

            let label = p;
            if (isPathDimension) {
                if (p === '/') label = 'Home Page';
                else {
                    const parts = p.split('/').filter(Boolean);
                    const last = parts[parts.length - 1];
                    if (last) label = last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                }
            }

            return {
                path: p,
                label,
                visitors: totals.visitors,
                purchases: totals.purchases,
                conversion: totals.visitors > 0 ? (totals.purchases / totals.visitors * 100).toFixed(2) : "0.00",
                trend
            };
        })
        .sort((a,b) => b.visitors - a.visitors);

    setPathData(pathList);
    if(pathList.length > 0) setSelectedPath(pathList[0]);
    setMaxPathVisits(Math.max(...pathList.map(p => p.visitors)));

  }, [csvData]);

  if (!csvData) return <div className="text-center text-slate-500 py-20">Please upload data in the Ingestion tab first.</div>;

  // KPI base: optionally exclude the in-progress month so run-rate metrics
  // aren't dragged down by incomplete data.
  const kpiData = excludePartial ? overallData.filter(d => !d.isPartial) : overallData;
  const totalVisitors = kpiData.reduce((a,b) => a + b.visitors, 0);
  const totalPurchases = kpiData.reduce((a,b) => a + b.purchases, 0);
  const maxVelocity = Math.max(...kpiData.map(d => parseFloat(d.velocity) || 0), 0);
  // Weighted global conversion (total purchases / total visitors) — a plain
  // average of monthly rates lets small months distort the figure.
  const avgConv = totalVisitors > 0 ? (totalPurchases / totalVisitors * 100).toFixed(2) : "0.00";
  const latest = kpiData[kpiData.length - 1] || {};
  const previous = kpiData[kpiData.length - 2] || {};
  const visitorTrend = previous.visitors > 0 ? ((latest.visitors - previous.visitors) / previous.visitors * 100).toFixed(1) : 0;
  
  // Find Peak Velocity Month
  const peakMonthObj = kpiData.find(d => parseFloat(d.velocity) === maxVelocity) || {};

  // Portfolio value across every segment we received data for: each segment's
  // purchases × its effective AOV (override if set, else the editable default).
  // Recalculates live as AOVs change.
  const totalPathPurchases = pathData.reduce((a, p) => a + p.purchases, 0);
  const totalEstValue = pathData.reduce((a, p) => a + p.purchases * getAov(p.path), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         {/* Toggle View */}
         <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white">
                    {view === 'overview' ? 'Purchase Velocity' : (isPathDimension ? 'Top Performing Paths' : `Top ${dimensionLabel} Segments`)}
                </h2>
                {view === 'paths' && (
                    <Tip tip="Estimated value generated across ALL segments in this dataset: each segment's purchases × its AOV (per-segment override if set, otherwise the editable default below). Updates live as you edit AOVs.">
                        <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-sm font-bold data-num cursor-help">
                            £{Math.round(totalEstValue).toLocaleString()} est. value
                        </span>
                    </Tip>
                )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                {partialMonth && (
                    <Tip tip={`${partialMonth} isn't finished yet, so its purchases and conversion are incomplete. Excluded from KPI cards by default so run-rates aren't understated. Click to include it anyway.`}>
                    <button 
                        onClick={() => setExcludePartial(!excludePartial)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${excludePartial ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
                    >
                        <AlertCircle size={14} />
                        {excludePartial ? `Excluding partial ${partialMonth}` : `Including partial ${partialMonth}`}
                    </button>
                    </Tip>
                )}
                <div className="flex bg-[#0e0e12] p-1 rounded-xl border border-white/10">
                    <Tip tip="Whole-account run-rate: purchases per day, monthly conversion, and traffic vs purchases over time.">
                    <button onClick={() => setView('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                        <Activity size={16} /> Overview
                    </button>
                    </Tip>
                    <Tip tip="League table of every segment: total volume, conversion, monthly trend, and revenue estimate with editable AOV.">
                    <button onClick={() => setView('paths')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'paths' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                        <MapIcon size={16} /> {isPathDimension ? 'Page Paths' : 'Segments'}
                    </button>
                    </Tip>
                </div>
            </div>
         </div>

         {view === 'overview' ? (
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Tip className="block" tip="Purchases per day in the most recent counted month — the cleanest 'how fast are we selling right now' number. Partial months divide by elapsed days, not the full month.">
                        <GlassCard title="Latest Velocity" icon={TrendingUp} value={latest.velocity} subtext={`Purchases/Day in ${latest.month}${latest.isPartial ? ' (partial)' : ''}`} className="h-full cursor-help" />
                    </Tip>
                    <Tip className="block" tip="Best purchases-per-day month on record. The gap between latest and peak is your recoverable headroom — worth asking what was different that month.">
                        <GlassCard title="Peak Velocity" icon={Zap} value={maxVelocity.toFixed(1)} subtext={`Occurred in ${peakMonthObj.month}`} className="h-full cursor-help" />
                    </Tip>
                    <Tip className="block" tip="All first-touch cohort visitors in range. The trend chip compares the two most recent counted months — traffic rising with flat purchases means conversion is slipping.">
                        <GlassCard title="Total Visitors" icon={Users} value={(totalVisitors / 1000000).toFixed(2) + 'M'} trend={visitorTrend >= 0 ? 'up' : 'down'} trendValue={`${Math.abs(visitorTrend)}% vs Prev Month`} subtext="Cohort users (first touch)" className="h-full cursor-help" />
                    </Tip>
                    <Tip className="block" tip="Total purchases ÷ total visitors, visitor-weighted — one small freak month can't distort it the way an average-of-averages would.">
                        <GlassCard title="Avg Conversion" icon={Percent} value={avgConv + '%'} subtext="Total purchases ÷ total visitors" className="h-full cursor-help" />
                    </Tip>
                </div>

                {/* Velocity vs Traffic Chart - Moved horizontally between cards and table */}
                <GlassCard title="Purchase Velocity vs Traffic" icon={Filter} className="h-[400px]" headerRight={
                    <Tip tip="Download this chart as a PNG for reports.">
                    <button onClick={() => exportChartPNG(velocityChartRef.current, 'cohortsuite_velocity')} aria-label="Export chart as PNG" className="p-2 rounded-lg bg-[#0e0e12] border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors">
                        <Camera size={14} />
                    </button>
                    </Tip>
                }>
                    <div className="h-full w-full pt-4" ref={velocityChartRef}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={overallData}>
                                <defs>
                                    <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="strokeIridescent" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="var(--accent)"/>
                                        <stop offset="55%" stopColor="var(--electric-c)"/>
                                        <stop offset="100%" stopColor="var(--partner-c)"/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--chart-axis)" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" stroke="var(--partner-c)" tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000).toFixed(0)+'k'} />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--accent)" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                <Tooltip content={CustomTooltip} />
                                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                <Area yAxisId="left" type="monotone" dataKey="visitors" name="Traffic" stroke="var(--partner-c)" fill="var(--partner-c)" fillOpacity={0.1} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="purchases" name="Purchases" stroke="url(#strokeIridescent)" strokeWidth={3} dot={{r:0}} activeDot={{r:6, fill:"var(--electric-c)", strokeWidth:0}} className="glow-stroke" />
                                <ReferenceLine yAxisId="right" y={parseFloat(latest.velocity) * 30} stroke="var(--chart-axis)" strokeDasharray="3 3" />
                                {annotations.map((a, ai) => overallData.some(d => d.month === a.month) && (
                                    <ReferenceLine key={a.id} yAxisId="left" x={a.month} stroke="var(--warn-c)" strokeDasharray="4 4" label={{ value: a.label, fill: 'var(--warn-c)', fontSize: 10, position: 'insideTop', dy: 6 + (ai % 3) * 14 }} />
                                ))}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Timeline annotations */}
                <GlassCard title="Timeline Annotations" icon={Flag}>
                    <p className="text-xs text-slate-500 -mt-2 mb-4">Pin real-world events (campaign rebuilds, promos, site changes) to months. Markers render here and on the Calendar-axis cohort chart. Stored locally in this browser.</p>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="relative">
                            <input type="month" value={annMonth} onChange={(e) => setAnnMonth(e.target.value)}
                                className={`month-input bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 min-w-[170px] ${!annMonth ? 'month-empty' : ''}`} />
                            {!annMonth && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">Month &amp; Year</span>
                            )}
                        </div>
                        <input type="text" value={annLabel} onChange={(e) => setAnnLabel(e.target.value)} placeholder="e.g. LHR campaign rebuild"
                            onKeyDown={(e) => { if (e.key === 'Enter') addAnnotation(); }}
                            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50" />
                        <button onClick={addAnnotation} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-sm font-semibold hover:bg-cyan-500/25 transition-colors">
                            <Plus size={14} /> Add
                        </button>
                    </div>
                    {annotations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {annotations.map(a => (
                                <span key={a.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-medium">
                                    <Flag size={11} /> <span className="data-num">{a.month}</span> {a.label}
                                    <button onClick={() => saveAnnotations(annotations.filter(x => x.id !== a.id))} className="text-amber-400/60 hover:text-amber-200 transition-colors"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Monthly Cohort Performance Table */}
                <GlassCard title="Monthly Cohort Performance" noPadding className="overflow-hidden">
                     <div className="p-6 pb-2">
                        <div className="grid grid-cols-5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-4">
                            <div className="col-span-1"><Tip tip="Calendar month. Amber bar + PARTIAL tag = the month isn't finished yet."><span className="cursor-help">Month</span></Tip></div>
                            <div className="text-right"><Tip tip="New first-touch visitors whose cohort STARTED this month."><span className="cursor-help">Visitors</span></Tip></div>
                            <div className="text-right"><Tip tip="ALL purchases landing in this calendar month — from this month's new visitors AND older cohorts still converting. That's why it can exceed what the new cohort alone produced."><span className="cursor-help">Purchases</span></Tip></div>
                            <div className="text-right"><Tip tip="This month's purchases ÷ this month's new visitors. A blended in-month rate, not a cohort rate."><span className="cursor-help">Conv. Rate</span></Tip></div>
                            <div className="text-right"><Tip tip="Purchases per day — monthly total ÷ days (elapsed days for a partial month). Comparable across long and short months."><span className="cursor-help">Velocity (P/D)</span></Tip></div>
                        </div>
                     </div>
                     <div className="overflow-y-auto max-h-[400px] custom-scrollbar px-6 pb-6">
                        {overallData.slice().reverse().map((row, i) => (
                            <div key={row.month} className="grid grid-cols-5 py-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors -mx-2 px-2 rounded-lg">
                                <div className="font-mono text-slate-300 text-sm flex items-center gap-2">
                                    <div className={`w-1 h-8 rounded-full ${row.isPartial ? 'bg-amber-500/60' : 'bg-slate-700'}`}></div>
                                    {row.month}
                                    {row.isPartial && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">Partial</span>}
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2 py-1 bg-violet-500/15 text-violet-300 rounded text-sm font-bold data-num min-w-[60px]">{row.visitors.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2 py-1 bg-cyan-500/15 text-cyan-300 rounded text-sm font-bold data-num min-w-[60px]">{row.purchases.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded text-sm font-bold data-num">{row.conversion}%</span>
                                </div>
                                <div className="text-right text-slate-400 font-mono text-sm">{row.velocity}</div>
                            </div>
                        ))}
                     </div>
                </GlassCard>
            </div>
         ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <GlassCard noPadding>
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                    <Tip className="block" tip={`Number of ${isPathDimension ? 'pages' : 'segments'} in this dataset with cohort data (All Traffic total excluded).`}>
                        <div className="cursor-help">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-1.5">{isPathDimension ? 'Pages' : 'Segments'}</div>
                            <div className="text-2xl font-bold text-white data-num">{pathData.length}</div>
                        </div>
                    </Tip>
                    <Tip className="block" tip="Every purchase attributed to these segments across all cohorts and months.">
                        <div className="cursor-help">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-1.5">Total Purchases</div>
                            <div className="text-2xl font-bold text-cyan-300 data-num">{totalPathPurchases.toLocaleString()}</div>
                        </div>
                    </Tip>
                    <Tip className="block" tip="Fallback average order value applied to every segment WITHOUT its own override. Edit it and every estimate on this page recalculates instantly. Stored in this browser.">
                        <div>
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-1.5">Default AOV</div>
                            <div className="flex items-center gap-1 text-2xl font-bold text-white data-num">
                                £<input type="number" value={aovConfig.default}
                                    onChange={(e) => saveAov({ ...aovConfig, default: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-cyan-300 text-xl font-mono focus:outline-none focus:border-cyan-500/50" />
                            </div>
                        </div>
                    </Tip>
                    <Tip className="block" tip="Σ over every segment of (purchases × that segment's AOV). Segments with an override use it; the rest use the default. This is the value your whole tracked portfolio has generated, at your pricing assumptions.">
                        <div className="cursor-help">
                            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-1.5">Estimated Total Value</div>
                            <div className="text-2xl font-bold text-white data-num glow-num">£{Math.round(totalEstValue).toLocaleString()}</div>
                        </div>
                    </Tip>
                </div>
            </GlassCard>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar List */}
                <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <ListOrdered size={16} className="text-cyan-400" strokeWidth={2.25} /> {isPathDimension ? 'Top Entry Points' : `Top ${dimensionLabel}`}
                    </div>
                    {pathData.map(p => (
                        <GlassCard 
                            key={p.path} 
                            onClick={() => setSelectedPath(p)}
                            isActive={selectedPath?.path === p.path}
                            className="group relative transition-all hover:scale-[1.008] hover:z-10 shrink-0"
                            noPadding
                            quiet
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 overflow-hidden mr-4">
                                        <div className="font-bold text-lg text-white truncate capitalize" title={p.label}>{p.label}</div>
                                        <div className="text-[10px] text-slate-500 font-mono truncate">{p.path}</div>
                                    </div>
                                    <Tip tip="Lifetime conversion: cumulative purchases ÷ first-touch visitors, across every month since acquisition. Green above 4%.">
                                    <div className={`text-lg font-bold cursor-help ${parseFloat(p.conversion) > 4 ? 'text-emerald-400' : 'text-white'}`}>{p.conversion}%</div>
                                    </Tip>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Visitors</div>
                                        <div className="text-sm font-bold text-white mb-2">{p.visitors.toLocaleString()}</div>
                                        {/* Blue Visitor Bar */}
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(p.visitors / maxPathVisits) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Purchases</div>
                                        <div className="text-sm font-bold text-white">{p.purchases.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedPath && (
                        <>
                            {/* Main Chart */}
                            <GlassCard title={`${selectedPath.label.toUpperCase()} — MONTHLY PURCHASE VOLUME`} icon={Activity} className="min-h-[400px]">
                                <div className="flex gap-8 mb-8 mt-2 flex-wrap">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Volume</div>
                                        <div className="text-3xl font-bold text-cyan-300 data-num glow-num">{selectedPath.purchases.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Tip tip="This segment's purchases × its AOV. Edit the AOV to price this segment correctly — an override here beats the page-level default."><span className="cursor-help">Revenue Est.</span></Tip>
                                            <span className="flex items-center gap-1 normal-case tracking-normal">
                                                (£
                                                <input 
                                                    type="number"
                                                    value={aovConfig.overrides[selectedPath.path] ?? aovConfig.default}
                                                    onChange={(e) => saveAov({ ...aovConfig, overrides: { ...aovConfig.overrides, [selectedPath.path]: e.target.value } })}
                                                    className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                                                    title={`Average order value for this ${isPathDimension ? 'page' : 'segment'}. Overrides the £${aovConfig.default} default; stored locally.`}
                                                />
                                                AOV)
                                            </span>
                                            {aovConfig.overrides[selectedPath.path] !== undefined && (
                                                <button 
                                                    onClick={() => {
                                                        const next = { ...aovConfig.overrides };
                                                        delete next[selectedPath.path];
                                                        saveAov({ ...aovConfig, overrides: next });
                                                    }}
                                                    className="text-[9px] text-slate-500 hover:text-slate-300 underline normal-case"
                                                >reset</button>
                                            )}
                                        </div>
                                        <div className="text-3xl font-bold text-white data-num glow-num">£{Math.round(selectedPath.purchases * getAov(selectedPath.path)).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={selectedPath.trend}>
                                            <defs>
                                                <linearGradient id="gradPath" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.28}/>
                                                    <stop offset="95%" stopColor="var(--partner-c)" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="strokePath" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="var(--mint-c)"/>
                                                    <stop offset="60%" stopColor="var(--accent)"/>
                                                    <stop offset="100%" stopColor="var(--electric-c)"/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                                            <XAxis dataKey="month" stroke="var(--chart-axis)" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <YAxis stroke="var(--chart-axis)" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={CustomTooltip} />
                                            <Area type="monotone" dataKey="purchases" stroke="url(#strokePath)" strokeWidth={3} fill="url(#gradPath)" activeDot={{r:6, fill:"var(--electric-c)", strokeWidth:0}} className="glow-stroke" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                            {/* Mini Metrics */}
                            <div className="grid grid-cols-2 gap-6">
                                <Tip className="block" tip="This segment's share of ALL first-touch visitors in the dataset. Big ring + low conversion = high-traffic page underdelivering; small ring + high conversion = a scaling candidate.">
                                <GlassCard title="VISITOR SHARE" className="h-[240px] cursor-help">
                                    <div className="h-full flex items-center justify-center relative -mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[{ value: selectedPath.visitors }, { value: totalVisitors - selectedPath.visitors }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell key="share" fill="var(--accent)" style={{filter: "drop-shadow(0 0 8px rgba(34,211,238,0.35))"}} />
                                                    <Cell key="rest" fill="var(--band-fill)" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-2xl font-bold text-white data-num glow-num">{selectedPath.visitors.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Visitors</div>
                                        </div>
                                    </div>
                                </GlassCard>
                                </Tip>

                                <Tip className="block" tip="Cumulative purchases ÷ cohort visitors, ALL months since first touch — lifetime conversion, so it will read higher than any single-month rate.">
                                <GlassCard title="TOTAL CONVERSION" className="h-[240px] flex items-center justify-center cursor-help">
                                    <div className="flex flex-col items-center justify-center h-full -mt-6" title="Cumulative purchases ÷ cohort visitors, all months since first touch">
                                        <div className="text-6xl font-bold text-emerald-300 mb-2 data-num" style={{textShadow: "0 0 28px rgba(52,211,153,0.4)"}}>{selectedPath.conversion}%</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-[0.2em]">Purchases ÷ Visitors</div>
                                        <div className="text-[9px] text-slate-600 mt-1">cumulative, all months since first touch</div>
                                    </div>
                                </GlassCard>
                                </Tip>
                            </div>
                        </>
                    )}
                </div>
            </div>
            </div>
         )}
    </div>
  );
};


// --- MAIN APP SHELL ---

const App = () => {
  const [activeTab, setActiveTab] = useState('etl');
  const [datasets, setDatasets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('cohortsuite_theme') || 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('cohortsuite_theme', theme); } catch {}
  }, [theme]);

  const handleRenameDataset = (id, name) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, name } : d));
  };

  const activeDataset = datasets.find(d => d.id === activeId) || null;
  const csvData = activeDataset?.csv || null;

  const handleAddDataset = (csv, stats, name) => {
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    // Disambiguate duplicate names
    const existingNames = new Set(datasets.map(d => d.name));
    let finalName = name;
    let n = 2;
    while (existingNames.has(finalName)) finalName = `${name} (${n++})`;
    setDatasets(prev => [...prev, { id, name: finalName, csv, stats }]);
    setActiveId(id);
    setActiveTab('cohort'); // Auto-switch on success
  };

  const handleRemoveDataset = (id) => {
    setDatasets(prev => {
      const next = prev.filter(d => d.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  };

  const NavItem = ({ id, label, icon: Icon }) => {
    const active = activeTab === id;
    return (
    <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all font-medium ${
            active 
            ? 'border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-200' 
            : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
            active
            ? 'bg-gradient-to-br from-cyan-400 to-violet-500 border-transparent text-white shadow-[0_4px_18px_-6px_rgba(34,211,238,0.7)]'
            : 'bg-white/5 border-white/10 text-slate-400'
        }`}>
            <Icon size={17} strokeWidth={2.25} />
        </span>
        <span className={`text-sm ${active ? 'font-semibold' : ''}`}>{label}</span>
        {id === 'etl' && csvData && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>}
    </button>
    );
  };

  return (
    <ThemeContext.Provider value={theme}>
    <div className="min-h-screen bg-void text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-hidden flex">
      
       {/* Ambient Layer: drifting aurora, masked cyber grid, film grain */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="cyber-grid" />
        <div className="aurora-blob aurora-a" />
        <div className="aurora-blob aurora-b" />
        <div className="aurora-blob aurora-c" />
        <div className="film-grain" />
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#05070b]/85 backdrop-blur-2xl flex flex-col transition-transform duration-300
        after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-cyan-500/25 after:via-violet-500/15 after:to-transparent
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-6 relative">
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-cyan-500/30 via-fuchsia-500/15 to-transparent" />
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="relative flex items-center justify-center">
                    <Layers className="text-cyan-400 relative z-10" />
                    <span className="absolute inset-0 blur-md bg-cyan-500/40 rounded-full" />
                  </span>
                  <span className="shimmer-text">Cohort<span className="font-light">Suite</span></span>
              </h1>
              <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-[0.18em] uppercase">v9.0 · Liquid Analytics</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-4">Pipeline</div>
              <NavItem id="etl" label="Data Ingestion" icon={Database} />
              
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Analytics</div>
              <NavItem id="cohort" label="Cohort Analysis" icon={LayoutDashboard} />
              <NavItem id="velocity" label="Purchase Velocity" icon={Gauge} />
              <NavItem id="compare" label="Compare Lab" icon={FlaskConical} />

              {datasets.length > 0 && (
                <div className="pt-6">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2">Active Dataset</div>
                    <Tip className="block" tip="Every analytics tab reads from this dataset. Switch here to analyse a different GA4 export; the Dimension Leaderboard in Compare Lab reads all of them at once.">
                    <select 
                        value={activeId || ''}
                        onChange={(e) => setActiveId(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">{d.name}</option>
                        ))}
                    </select>
                    </Tip>
                    {activeDataset && (
                        <div className="text-[10px] text-slate-600 font-mono px-4 mt-2 truncate" title={activeDataset.stats.dimension}>
                            {activeDataset.stats.dimension}
                        </div>
                    )}
                </div>
              )}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">U</div>
                    <div className="text-xs flex-1">
                        <div className="text-white font-bold">User Session</div>
                        <div className="text-slate-500">Local Processing</div>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>
          </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#05070b]/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-cyan-500/30 after:via-violet-500/15 after:to-transparent">
         <span className="font-bold shimmer-text">CohortSuite</span>
         <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-slate-300 p-2" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
                <Menu />
            </button>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative z-10 h-screen overflow-y-auto custom-scrollbar pt-20 md:pt-0">
          <header className="px-8 py-8 md:py-12 max-w-7xl mx-auto">
             <div className="eyebrow mb-3">
                 {activeTab === 'etl' && 'Pipeline · Stage 01'}
                 {activeTab === 'cohort' && 'Analytics · GA4 First-Touch Cohorts'}
                 {activeTab === 'velocity' && 'Analytics · Run-Rate & Conversion'}
                 {activeTab === 'compare' && 'Analytics · Cross-Segment Intelligence'}
             </div>
             <h2 className="text-3xl md:text-4xl font-light text-white mb-2 capitalize tracking-tight">
                 {activeTab === 'etl' && <>Data <span className="font-bold">Preparation</span></>}
                 {activeTab === 'cohort' && <>Retention <span className="font-bold">&amp; LTV</span></>}
                 {activeTab === 'velocity' && <>Velocity <span className="font-bold">&amp; Paths</span></>}
                 {activeTab === 'compare' && <>Compare <span className="font-bold">Lab</span></>}
             </h2>
             <p className="text-slate-400 text-sm">
                 {activeTab === 'etl' && 'Clean, standardise, and prepare your raw GA4 export.'}
                 {activeTab === 'cohort' && 'Analyse cumulative growth and retention heatmaps.'}
                 {activeTab === 'velocity' && 'Understand purchase speed and top converting pages.'}
                 {activeTab === 'compare' && 'Duel segments at matched maturity, price paybacks, and rank which GA4 dimension actually separates outcomes.'}
             </p>
          </header>

          <div className="px-4 md:px-8 pb-20 max-w-7xl mx-auto min-h-[500px]">
             {activeTab === 'etl' && (
                <DataIngestion 
                    onAdd={handleAddDataset} 
                    datasets={datasets} 
                    activeId={activeId} 
                    onSelect={setActiveId} 
                    onRemove={handleRemoveDataset} 
                    onRename={handleRenameDataset}
                />
             )}
             {activeTab === 'cohort' && <CohortExplorer csvData={csvData} />}
             {activeTab === 'velocity' && <VelocityExplorer csvData={csvData} />}
             {activeTab === 'compare' && <CompareLab datasets={datasets} activeId={activeId} onSelectDataset={setActiveId} />}
          </div>
      </main>

    </div>
    </ThemeContext.Provider>
  );
};

export default App;
