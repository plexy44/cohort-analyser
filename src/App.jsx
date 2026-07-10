import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, BarChart, Bar, LineChart, Line, ComposedChart, ReferenceLine, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Upload, FileDown, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Database,
  LayoutDashboard, Layers, Zap, TrendingUp, Filter, Eye, EyeOff, BarChart2,
  Grid, Activity, Users, ShoppingCart, Percent, Map as MapIcon, ChevronRight, Menu, ArrowUpRight, ArrowDownRight, Trash2
} from 'lucide-react';

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

const GlassCard = ({ children, className = "", title, icon: Icon, value, trend, trendValue, subtext, onClick, isActive, noPadding, quiet }) => (
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
          <div className={`flex items-start justify-between ${trend ? 'mb-2' : 'mb-4'}`}>
            <div className="flex items-start space-x-2.5 text-slate-400">
              {Icon && <Icon size={16} className={`mt-0.5 shrink-0 ${isActive ? "text-cyan-200" : "text-cyan-400"}`} />}
              <span className={`text-[10px] font-bold tracking-[0.22em] uppercase leading-[1.5] ${value !== undefined ? 'w-min whitespace-normal' : ''} ${isActive ? 'text-cyan-100' : ''}`}>
                {title}
              </span>
            </div>
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
            {payload.map((entry, index) => {
            let displayValue = entry.value;
            if (typeof displayValue === 'number') {
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

const DataIngestion = ({ onAdd, datasets, activeId, onSelect, onRemove }) => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <div className="font-bold text-white truncate">{ds.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">
                                {ds.stats.dimension} · {ds.stats.valid} rows · {ds.stats.firstDate} → {ds.stats.lastDate}
                            </div>
                        </div>
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

// Iridescent series ramp — cyans → violets → magentas → mints, tuned for
// separation on the void background. Hue-adjacent pairs never sit next to
// each other in cycle order.
const CHART_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#7df9ff',
  '#8b5cf6', '#e879f9', '#5eead4', '#38bdf8', '#c084fc',
  '#fb7185', '#4ade80', '#67e8f9', '#818cf8', '#f0abfc',
  '#2dd4bf', '#0ea5e9', '#d8b4fe', '#fda4af', '#86efac'
];
const getColor = (idx) => CHART_COLORS[idx % CHART_COLORS.length];

const CohortExplorer = ({ csvData }) => {
  const [rawData, setRawData] = useState([]);
  const [selectedPath, setSelectedPath] = useState('/');
  const [pathOptions, setPathOptions] = useState([]);
  const [chartMode, setChartMode] = useState('area'); 
  const [gridMode, setGridMode] = useState('cumulative'); 
  const [isPerUser, setIsPerUser] = useState(false);
  const [isLogScale, setIsLogScale] = useState(false);
  const [pivotData, setPivotData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [incrementalData, setIncrementalData] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  // Pivot axis: 'cohorts' = one segment, series per cohort month (original behaviour)
  //             'segments' = one cohort month, series per segment (source/path comparison)
  const [pivotAxis, setPivotAxis] = useState('cohorts');
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortOptions, setCohortOptions] = useState([]);

  const dimensionLabel = useMemo(() => readDimensionFromCleanCSV(csvData), [csvData]);

  useEffect(() => {
    if (!csvData) return;
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const cols = splitCSVLine(line);
        if (cols.length >= 6) {
            parsed.push({
                monthIndex: parseInt(cols[0]),
                cohortStart: cols[1],
                path: cols[3],
                visitors: safeInt(cols[4]),
                purchases: safeInt(cols[5]),
                percentage: cols[6] ? parseFloat(cols[6].replace('%', '')) : 0
            });
        }
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

    // Build one series per cohort month (classic view) or one series per
    // segment value for a fixed cohort month (source/path comparison view).
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

            grouped[key] = { 
                cohortStart: key, 
                formattedName: fmt,
                visitors: d.visitors,
                dataPoints: {} 
            };
        }
        grouped[key].dataPoints[d.monthIndex] = {
            cumulative: d.purchases,
            percentage: d.percentage
        };
    });

    const tableData = Object.values(grouped).sort((a, b) => 
        bySegments 
            ? b.visitors - a.visitors  // biggest segments first
            : a.cohortStart.localeCompare(b.cohortStart)
    );
    
    tableData.forEach(row => {
        const indices = Object.keys(row.dataPoints).map(Number).sort((a, b) => a - b);
        indices.forEach((idx, i) => {
            const current = row.dataPoints[idx];
            if (i > 0) {
                const prevIdx = indices[i-1];
                const prev = row.dataPoints[prevIdx];
                current.diff = current.cumulative - prev.cumulative; 
                current.growthPct = prev.cumulative > 0 ? ((current.diff / prev.cumulative) * 100).toFixed(2) : 0;
            } else {
                current.diff = 0; 
                current.growthPct = 0;
            }
        });
    });

    setPivotData(tableData);

    const maxIndex = Math.max(...filtered.map(d => d.monthIndex), 0);
    const cumulativePoints = [];
    const incrementalPoints = [];
    
    for (let i = 0; i <= maxIndex; i++) {
        const cPoint = { index: i };
        const iPoint = { index: i };
        
        tableData.forEach(cohort => {
            if (cohort.dataPoints[i]) {
                 // Cumulative data mapping
                 cPoint[cohort.formattedName] = cohort.dataPoints[i].cumulative;
                 cPoint[`${cohort.formattedName}_perUser`] = cohort.visitors > 0 ? cohort.dataPoints[i].cumulative / cohort.visitors : 0;
                 cPoint[`${cohort.formattedName}_growth`] = cohort.dataPoints[i].growthPct;
                 
                 // Incremental data mapping
                 const val = i === 0 ? cohort.dataPoints[i].cumulative : cohort.dataPoints[i].diff;
                 iPoint[cohort.formattedName] = val;
                 iPoint[`${cohort.formattedName}_logSafe`] = val > 0 ? val : undefined; // Prevent log scale crash on 0
                 iPoint[`${cohort.formattedName}_growth`] = cohort.dataPoints[i].growthPct;
            }
        });
        cumulativePoints.push(cPoint);
        incrementalPoints.push(iPoint);
    }
    setChartData(cumulativePoints);
    setIncrementalData(incrementalPoints);
  }, [rawData, selectedPath, pivotAxis, selectedCohort]);

  const toggleSeries = (name) => {
      const newHidden = new Set(hiddenSeries);
      if (newHidden.has(name)) newHidden.delete(name);
      else newHidden.add(name);
      setHiddenSeries(newHidden);
  };

  // Returns { className, style } — percentage mode uses an inline
  // cyan→violet alpha ramp (dynamic Tailwind opacity classes are never
  // generated at build time, so the old bg-indigo-500/$n approach was a no-op).
  const getCellStyle = (val, diff) => {
      if (val === undefined) return { className: 'bg-transparent', style: {} };
      if (gridMode === 'percentage') {
          const t = Math.min(val / 5, 1); // 0–5% mapped to full ramp
          return {
              className: 'text-white border border-white/10',
              style: {
                  background: `linear-gradient(135deg, rgba(34,211,238,${0.06 + t * 0.30}), rgba(139,92,246,${0.04 + t * 0.26}))`,
                  boxShadow: t > 0.65 ? '0 0 14px -4px rgba(34,211,238,0.45)' : 'none'
              }
          };
      }
      if (diff > 0) return { className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25', style: {} };
      if (diff === 0) return { className: 'bg-white/5 text-slate-400', style: {} };
      return { className: 'bg-slate-700/30 text-slate-400', style: {} };
  };

  if (!csvData) return <div className="text-center text-slate-500 py-20">Please upload data in the Ingestion tab first.</div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                    <button 
                        onClick={() => { setPivotAxis('cohorts'); setHiddenSeries(new Set()); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pivotAxis === 'cohorts' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        By Cohort
                    </button>
                    <button 
                        onClick={() => { setPivotAxis('segments'); setHiddenSeries(new Set()); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pivotAxis === 'segments' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Compare Segments
                    </button>
                </div>

                <div className="relative group w-full md:w-96">
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
             </div>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                 <button 
                    onClick={() => setChartMode('area')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartMode === 'area' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                    <TrendingUp size={16} /> Cumulative
                 </button>
                 <button 
                    onClick={() => setChartMode('line')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartMode === 'line' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                    <Activity size={16} /> Incremental
                 </button>
              </div>
        </div>

        <GlassCard className="h-[500px]" title={
            (chartMode === 'area' ? 'Cumulative LTV Curve' : 'Incremental Growth (New Purchases)') +
            (pivotAxis === 'segments' ? ` — by ${dimensionLabel} (${selectedCohort || ''})` : '')
        }>
            <div className="absolute top-5 right-5 z-20">
               {chartMode === 'area' && (
                  <div className="flex bg-[#0e0e12] p-1 rounded-lg border border-white/10 text-xs shadow-lg">
                      <button onClick={() => setIsPerUser(false)} className={`px-3 py-1.5 rounded transition-all font-semibold ${!isPerUser ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Absolute</button>
                      <button onClick={() => setIsPerUser(true)} className={`px-3 py-1.5 rounded transition-all font-semibold ${isPerUser ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Per User</button>
                  </div>
               )}
               {chartMode === 'line' && (
                  <div className="flex bg-[#0e0e12] p-1 rounded-lg border border-white/10 text-xs shadow-lg">
                      <button onClick={() => setIsLogScale(false)} className={`px-3 py-1.5 rounded transition-all font-semibold ${!isLogScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Linear</button>
                      <button onClick={() => setIsLogScale(true)} className={`px-3 py-1.5 rounded transition-all font-semibold ${isLogScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>Logarithmic</button>
                  </div>
               )}
            </div>
            
            <ResponsiveContainer width="100%" height="100%" className="glow-stroke-soft">
                {chartMode === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <defs>
                            {pivotData.map((cohort, idx) => (
                                <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={getColor(idx)} stopOpacity={0.16}/>
                                    <stop offset="95%" stopColor={getColor(idx)} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,249,255,0.06)" />
                            <XAxis 
                                dataKey="index" 
                                stroke="#64748b" 
                                tick={{ fill: '#94a3b8' }} 
                                label={{ value: 'MONTHS SINCE', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.15em' }} 
                            />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} tickFormatter={(val) => isPerUser ? val.toFixed(3) : val} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                content={(props) => (
                                    <div className="flex flex-wrap gap-2 justify-center mt-6 px-4 max-h-24 overflow-y-auto custom-scrollbar">
                                        {props.payload.map((entry, index) => {
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
                                <Area 
                                key={cohort.formattedName}
                                hide={hiddenSeries.has(cohort.formattedName)}
                                type="monotone" 
                                dataKey={isPerUser ? `${cohort.formattedName}_perUser` : cohort.formattedName} 
                                name={cohort.formattedName}
                                stroke={getColor(idx)}
                                fill={`url(#grad-${idx})`}
                                strokeWidth={2}
                                activeDot={{ r: 6 }}
                                />
                            ))}
                    </AreaChart>
                ) : (
                    <LineChart data={incrementalData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,249,255,0.06)" />
                            <XAxis 
                                dataKey="index" 
                                stroke="#64748b" 
                                tick={{ fill: '#94a3b8' }} 
                                label={{ value: 'MONTHS SINCE', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.15em' }} 
                            />
                            <YAxis 
                                stroke="#64748b" 
                                tick={{ fill: '#94a3b8' }} 
                                scale={isLogScale ? 'log' : 'auto'} 
                                domain={isLogScale ? [1, 'auto'] : [0, 'auto']} 
                                allowDataOverflow={isLogScale}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                content={(props) => (
                                    <div className="flex flex-wrap gap-2 justify-center mt-6 px-4 max-h-24 overflow-y-auto custom-scrollbar">
                                        {props.payload.map((entry, index) => {
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
        </GlassCard>

        <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-cyan-400"/> 
                    {pivotAxis === 'segments' ? `${dimensionLabel} Performance Grid` : 'Cohort Performance Grid'}
                </h3>
                <div className="flex items-center gap-3">
                    {pivotAxis === 'segments' && !isPerUser && chartMode === 'area' && (
                        <span className="text-[10px] text-amber-400/80 font-medium hidden md:block">Tip: use "Per User" above for fair segment comparison</span>
                    )}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                        <button onClick={() => setGridMode('cumulative')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'cumulative' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Volume</button>
                        <button onClick={() => setGridMode('percentage')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'percentage' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Retention %</button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-4 border-b border-white/10 sticky left-0 bg-[#05070b] z-10">{pivotAxis === 'segments' ? dimensionLabel : 'Cohort'}</th>
                            <th className="p-4 border-b border-white/10 text-right">Visitors</th>
                            {[...Array(6)].map((_, i) => <th key={i} className="p-4 border-b border-white/10 text-center">M{i}</th>)}
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
                                    const cell = dp ? getCellStyle(gridMode === 'percentage' ? parseFloat(displayVal) : dp.cumulative, dp.diff) : null;
                                    return (
                                        <td key={i} className="p-2 border-r border-white/5">
                                            {dp && <div className={`rounded-lg p-2 text-center text-xs font-bold data-num ${cell.className}`} style={cell.style}>{displayVal}</div>}
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         {/* Toggle View */}
         <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">
                {view === 'overview' ? 'Purchase Velocity' : (isPathDimension ? 'Top Performing Paths' : `Top ${dimensionLabel} Segments`)}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
                {partialMonth && (
                    <button 
                        onClick={() => setExcludePartial(!excludePartial)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${excludePartial ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
                        title={`${partialMonth} is still in progress — its purchases and conversion are incomplete`}
                    >
                        <AlertCircle size={14} />
                        {excludePartial ? `Excluding partial ${partialMonth}` : `Including partial ${partialMonth}`}
                    </button>
                )}
                <div className="flex bg-[#0e0e12] p-1 rounded-xl border border-white/10">
                    <button onClick={() => setView('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                        <Activity size={16} /> Overview
                    </button>
                    <button onClick={() => setView('paths')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'paths' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                        <MapIcon size={16} /> {isPathDimension ? 'Page Paths' : 'Segments'}
                    </button>
                </div>
            </div>
         </div>

         {view === 'overview' ? (
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard title="Latest Velocity" icon={TrendingUp} value={latest.velocity} subtext={`Purchases/Day in ${latest.month}${latest.isPartial ? ' (partial)' : ''}`} />
                    <GlassCard title="Peak Velocity" icon={Zap} value={maxVelocity.toFixed(1)} subtext={`Occurred in ${peakMonthObj.month}`} />
                    <GlassCard title="Total Visitors" icon={Users} value={(totalVisitors / 1000000).toFixed(2) + 'M'} trend={visitorTrend >= 0 ? 'up' : 'down'} trendValue={`${Math.abs(visitorTrend)}% vs Prev Month`} subtext="Cohort users (first touch)" />
                    <GlassCard title="Avg Conversion" icon={Percent} value={avgConv + '%'} subtext="Total purchases ÷ total visitors" />
                </div>

                {/* Velocity vs Traffic Chart - Moved horizontally between cards and table */}
                <GlassCard title="Purchase Velocity vs Traffic" icon={Filter} className="h-[400px]">
                    <div className="h-full w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={overallData}>
                                <defs>
                                    <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="strokeIridescent" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#22d3ee"/>
                                        <stop offset="55%" stopColor="#7df9ff"/>
                                        <stop offset="100%" stopColor="#a78bfa"/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,249,255,0.06)" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" stroke="#8b5cf6" tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000).toFixed(0)+'k'} />
                                <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                <Tooltip content={CustomTooltip} />
                                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                <Area yAxisId="left" type="monotone" dataKey="visitors" name="Traffic" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="purchases" name="Purchases" stroke="url(#strokeIridescent)" strokeWidth={3} dot={{r:0}} activeDot={{r:6, fill:"#7df9ff", strokeWidth:0}} className="glow-stroke" />
                                <ReferenceLine yAxisId="right" y={parseFloat(latest.velocity) * 30} stroke="#94a3b8" strokeDasharray="3 3" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Monthly Cohort Performance Table */}
                <GlassCard title="Monthly Cohort Performance" noPadding className="overflow-hidden">
                     <div className="p-6 pb-2">
                        <div className="grid grid-cols-5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-4">
                            <div className="col-span-1">Month</div>
                            <div className="text-right">Visitors</div>
                            <div className="text-right">Purchases</div>
                            <div className="text-right">Conv. Rate</div>
                            <div className="text-right">Velocity (P/D)</div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                {/* Sidebar List */}
                <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <Zap size={18} className="text-amber-400" /> {isPathDimension ? 'Top Entry Points' : `Top ${dimensionLabel}`}
                    </div>
                    {pathData.map(p => (
                        <GlassCard 
                            key={p.path} 
                            onClick={() => setSelectedPath(p)}
                            isActive={selectedPath?.path === p.path}
                            className="group transition-all hover:scale-[1.02] shrink-0"
                            noPadding
                            quiet
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 overflow-hidden mr-4">
                                        <div className="font-bold text-lg text-white truncate capitalize" title={p.label}>{p.label}</div>
                                        <div className="text-[10px] text-slate-500 font-mono truncate">{p.path}</div>
                                    </div>
                                    <div className={`text-lg font-bold ${parseFloat(p.conversion) > 4 ? 'text-emerald-400' : 'text-white'}`}>{p.conversion}%</div>
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
                                            Revenue Est.
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
                                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="strokePath" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#34d399"/>
                                                    <stop offset="60%" stopColor="#22d3ee"/>
                                                    <stop offset="100%" stopColor="#7df9ff"/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,249,255,0.06)" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={CustomTooltip} />
                                            <Area type="monotone" dataKey="purchases" stroke="url(#strokePath)" strokeWidth={3} fill="url(#gradPath)" activeDot={{r:6, fill:"#7df9ff", strokeWidth:0}} className="glow-stroke" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                            {/* Mini Metrics */}
                            <div className="grid grid-cols-2 gap-6">
                                <GlassCard title="VISITOR SHARE" className="h-[240px]">
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
                                                    <Cell key="share" fill="#22d3ee" style={{filter: "drop-shadow(0 0 8px rgba(34,211,238,0.5))"}} />
                                                    <Cell key="rest" fill="rgba(125,249,255,0.09)" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-2xl font-bold text-white data-num glow-num">{selectedPath.visitors.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Visitors</div>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard title="TOTAL CONVERSION" className="h-[240px] flex items-center justify-center">
                                    <div className="flex flex-col items-center justify-center h-full -mt-6" title="Cumulative purchases ÷ cohort visitors, all months since first touch">
                                        <div className="text-6xl font-bold text-emerald-300 mb-2 data-num" style={{textShadow: "0 0 28px rgba(52,211,153,0.4)"}}>{selectedPath.conversion}%</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-[0.2em]">Purchases ÷ Visitors</div>
                                        <div className="text-[9px] text-slate-600 mt-1">cumulative, all months since first touch</div>
                                    </div>
                                </GlassCard>
                            </div>
                        </>
                    )}
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

  const NavItem = ({ id, label, icon: Icon }) => (
    <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium overflow-hidden ${
            activeTab === id 
            ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/5 text-cyan-300 shadow-[0_0_24px_-8px_rgba(34,211,238,0.5)]' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        {activeTab === id && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        )}
        <Icon size={20} className={activeTab === id ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : ''} />
        <span>{label}</span>
        {id === 'etl' && csvData && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>}
    </button>
  );

  return (
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
              <NavItem id="velocity" label="Purchase Velocity" icon={Zap} />

              {datasets.length > 0 && (
                <div className="pt-6">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2">Active Dataset</div>
                    <select 
                        value={activeId || ''}
                        onChange={(e) => setActiveId(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">{d.name}</option>
                        ))}
                    </select>
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
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">U</div>
                    <div className="text-xs">
                        <div className="text-white font-bold">User Session</div>
                        <div className="text-slate-500">Local Processing</div>
                    </div>
                </div>
            </div>
          </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#05070b]/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-cyan-500/30 after:via-violet-500/15 after:to-transparent">
         <span className="font-bold shimmer-text">CohortSuite</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
             <Menu />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative z-10 h-screen overflow-y-auto custom-scrollbar pt-20 md:pt-0">
          <header className="px-8 py-8 md:py-12 max-w-7xl mx-auto">
             <div className="eyebrow mb-3">
                 {activeTab === 'etl' && 'Pipeline · Stage 01'}
                 {activeTab === 'cohort' && 'Analytics · GA4 First-Touch Cohorts'}
                 {activeTab === 'velocity' && 'Analytics · Run-Rate & Conversion'}
             </div>
             <h2 className="text-3xl md:text-4xl font-light text-white mb-2 capitalize tracking-tight">
                 {activeTab === 'etl' && <>Data <span className="font-bold">Preparation</span></>}
                 {activeTab === 'cohort' && <>Retention <span className="font-bold">&amp; LTV</span></>}
                 {activeTab === 'velocity' && <>Velocity <span className="font-bold">&amp; Paths</span></>}
             </h2>
             <p className="text-slate-400 text-sm">
                 {activeTab === 'etl' && 'Clean, standardise, and prepare your raw GA4 export.'}
                 {activeTab === 'cohort' && 'Analyse cumulative growth and retention heatmaps.'}
                 {activeTab === 'velocity' && 'Understand purchase speed and top converting pages.'}
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
                />
             )}
             {activeTab === 'cohort' && <CohortExplorer csvData={csvData} />}
             {activeTab === 'velocity' && <VelocityExplorer csvData={csvData} />}
          </div>
      </main>

    </div>
  );
};

export default App;
