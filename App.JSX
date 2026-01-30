import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, BarChart, Bar, LineChart, Line, ComposedChart, ReferenceLine, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Upload, FileDown, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Database,
  LayoutDashboard, Layers, Zap, TrendingUp, Filter, Eye, EyeOff, BarChart2,
  Grid, Activity, Users, ShoppingCart, Percent, Map as MapIcon, ChevronRight, Menu, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// --- SHARED UI COMPONENTS ---

const GlassCard = ({ children, className = "", title, icon: Icon, value, trend, trendValue, subtext, onClick, isActive, noPadding }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all flex flex-col
      ${onClick ? 'cursor-pointer' : ''}
      ${isActive 
        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
        : 'bg-[#0e0e12]/80 border-white/10 hover:bg-white/5 shadow-xl'
      }
      ${className}
    `}
  >
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
    )}
    
    <div className={`relative z-10 flex-1 flex flex-col ${noPadding ? 'p-0' : 'p-6'}`}>
      {(title || value) && (
        <div className={noPadding ? 'p-6 pb-0' : ''}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-slate-400">
              {Icon && <Icon size={18} className={isActive ? "text-cyan-300" : "text-cyan-400"} />}
              <span className={`text-xs font-bold tracking-widest uppercase ${isActive ? 'text-cyan-100' : ''}`}>{title}</span>
            </div>
            {trend && (
              <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {trendValue}
              </div>
            )}
          </div>
          
          {value !== undefined && (
            <div className="text-3xl font-bold text-white tracking-tight mb-1">
              {value === null ? '--' : value}
            </div>
          )}
          {subtext && <div className="text-xs text-slate-500 font-medium">{subtext}</div>}
        </div>
      )}
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0e0e12]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl z-50">
        <p className="text-cyan-300 font-bold mb-2 border-b border-white/10 pb-2 text-xs uppercase tracking-wider">{label}</p>
        <div className="flex flex-col gap-1">
            {payload.map((entry, index) => {
            let displayValue = entry.value;
            if (typeof displayValue === 'number') {
                displayValue = Number.isFinite(displayValue) 
                ? (displayValue % 1 !== 0 ? displayValue.toFixed(2) : displayValue.toLocaleString()) 
                : '0';
            }
            return (
                <div key={index} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-300 capitalize">{entry.name}:</span>
                    </div>
                    <span className="text-white font-mono font-semibold">{displayValue}</span>
                </div>
            );
            })}
        </div>
      </div>
    );
  }
  return null;
};

// --- MODULE 1: ETL PROCESSOR ---

const DataIngestion = ({ onDataProcessed, existingData }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processData = (text) => {
    setIsProcessing(true);
    try {
      const lines = text.split('\n');
      const processedRows = [];
      let validRowCount = 0;
      let skippedRowCount = 0;

      const header = "Monthly cohort,Cohort Start,Cohort End,Page path and screen class,Visitors,Purchases,Percentage";

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

        const cols = line.split(',');
        if (cols.length < 6) {
            skippedRowCount++;
            continue;
        }

        const rawMonthIndex = cols[0];
        const rawDateRange = cols[1];
        const rawPath = cols[2];
        const rawVisitors = cols[4];
        const rawPurchases = cols[5];
        const rawRate = cols[6];

        if (!rawDateRange.includes('-')) {
            skippedRowCount++;
            continue;
        }

        const [startRaw, endRaw] = rawDateRange.split('-');
        const startDate = formatDate(startRaw);
        const endDate = formatDate(endRaw);
        const monthIndex = parseInt(rawMonthIndex, 10);
        
        let percentage = "0%";
        if (rawRate) {
            const floatRate = parseFloat(rawRate);
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
            originalLine: `${monthIndex},${startDate},${endDate},${rawPath},${rawVisitors},${rawPurchases},${percentage}`
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
        firstDate: processedRows[0]?.startDate,
        lastDate: processedRows[processedRows.length - 1]?.startDate
      };
      
      setStats(newStats);
      setError(null);
      onDataProcessed(finalCSV, newStats);
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
    reader.onload = (event) => processData(event.target.result);
    reader.readAsText(file);
  };

  const downloadCSV = () => {
    if (!existingData) return;
    const blob = new Blob([existingData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "cohort_data_cleaned.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-light text-white">Data <span className="font-bold text-cyan-400">Ingestion</span></h2>
        <p className="text-slate-400 max-w-lg mx-auto">Upload your raw GA4 Cohort Export CSV. The system will clean, standardize, and instantly populate the dashboards.</p>
      </div>

      <GlassCard className="p-10 text-center border-dashed border-2 border-white/10 bg-white/5 hover:border-cyan-500/30 transition-colors">
         {!existingData ? (
            <label className="cursor-pointer flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.1)] mb-2 group-hover:scale-110 transition-transform">
                    {isProcessing ? <RefreshCw className="animate-spin" size={32} /> : <Upload size={32} />}
                </div>
                <div>
                    <span className="block text-xl font-bold text-white mb-1">Upload Raw CSV</span>
                    <span className="text-sm text-slate-400">Supports Raw GA4 Cohort Export</span>
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
         ) : (
            <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <CheckCircle size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Data Ready</h3>
                    <p className="text-slate-400">Your data has been processed and is ready for analysis.</p>
                </div>
                
                {stats && (
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg bg-black/30 p-6 rounded-xl text-left border border-white/5">
                        <div>
                            <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">Valid Rows</span>
                            <span className="text-white font-mono text-lg">{stats.valid}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">Skipped</span>
                            <span className="text-slate-400 font-mono text-lg">{stats.skipped}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">Range</span>
                            <span className="text-cyan-400 text-xs font-mono truncate">{stats.firstDate}<br/>{stats.lastDate}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 w-full max-w-lg">
                    <button 
                        onClick={() => onDataProcessed(null, null)}
                        className="flex-1 py-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Reset
                    </button>
                    <button 
                        onClick={downloadCSV}
                        className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <FileDown size={18} /> Download Clean CSV
                    </button>
                </div>
            </div>
         )}
      </GlassCard>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-200 text-sm">
            <AlertCircle size={18} /> {error}
        </div>
      )}
    </div>
  );
};

// --- MODULE 2: COHORT EXPLORER ---

const CohortExplorer = ({ csvData }) => {
  const [rawData, setRawData] = useState([]);
  const [selectedPath, setSelectedPath] = useState('/');
  const [pathOptions, setPathOptions] = useState([]);
  const [chartMode, setChartMode] = useState('area'); 
  const [gridMode, setGridMode] = useState('cumulative'); 
  const [pivotData, setPivotData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [incrementalData, setIncrementalData] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  useEffect(() => {
    if (!csvData) return;
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const cols = line.split(',');
        if (cols.length >= 6) {
            parsed.push({
                monthIndex: parseInt(cols[0]),
                cohortStart: cols[1],
                path: cols[3],
                visitors: parseInt(cols[4]),
                purchases: parseInt(cols[5]),
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
  }, [csvData]);

  useEffect(() => {
    if (rawData.length === 0) return;

    const filtered = rawData.filter(d => d.path === selectedPath);
    const grouped = {};
    
    filtered.forEach(d => {
        if (!grouped[d.cohortStart]) {
            const dateObj = new Date(d.cohortStart);
            const fmt = !isNaN(dateObj) 
                ? dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) 
                : d.cohortStart;

            grouped[d.cohortStart] = { 
                cohortStart: d.cohortStart, 
                formattedName: fmt,
                visitors: d.visitors,
                dataPoints: {} 
            };
        }
        grouped[d.cohortStart].dataPoints[d.monthIndex] = {
            cumulative: d.purchases,
            percentage: d.percentage
        };
    });

    const tableData = Object.values(grouped).sort((a, b) => a.cohortStart.localeCompare(b.cohortStart));
    
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
                 cPoint[cohort.formattedName] = cohort.dataPoints[i].cumulative;
                 const val = i === 0 ? cohort.dataPoints[i].cumulative : cohort.dataPoints[i].diff;
                 iPoint[cohort.formattedName] = val;
                 iPoint[`${cohort.formattedName}_growth`] = cohort.dataPoints[i].growthPct;
            }
        });
        cumulativePoints.push(cPoint);
        incrementalPoints.push(iPoint);
    }
    setChartData(cumulativePoints);
    setIncrementalData(incrementalPoints);
  }, [rawData, selectedPath]);

  const toggleSeries = (name) => {
      const newHidden = new Set(hiddenSeries);
      if (newHidden.has(name)) newHidden.delete(name);
      else newHidden.add(name);
      setHiddenSeries(newHidden);
  };

  const getCellColor = (val, diff) => {
      if (val === undefined) return 'bg-transparent';
      if (gridMode === 'percentage') {
          const intensity = Math.min(val * 20, 100); 
          return `bg-indigo-500/${Math.floor(intensity)} text-white border border-white/10`;
      }
      if (diff > 0) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      if (diff === 0) return 'bg-white/5 text-slate-400'; 
      return 'bg-slate-700/30 text-slate-400';
  };

  if (!csvData) return <div className="text-center text-slate-500 py-20">Please upload data in the Ingestion tab first.</div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="relative group w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-slate-400" />
                </div>
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
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronRight size={16} className="text-slate-400 rotate-90" />
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
                    onClick={() => setChartMode('bar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartMode === 'bar' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                 >
                    <BarChart2 size={16} /> Incremental
                 </button>
              </div>
        </div>

        <GlassCard className="h-[500px]" title={chartMode === 'area' ? 'Cumulative LTV Curve' : 'Incremental Growth (New Purchases)'}>
            <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                            {pivotData.map((cohort, idx) => (
                                <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={`hsl(${idx * 40}, 70%, 50%)`} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={`hsl(${idx * 40}, 70%, 50%)`} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="index" stroke="#64748b" tick={{ fill: '#94a3b8' }} label={{ value: 'Months Since', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                content={(props) => (
                                    <div className="flex flex-wrap gap-2 justify-center mt-4 px-4 max-h-24 overflow-y-auto custom-scrollbar">
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
                                dataKey={cohort.formattedName} 
                                stroke={`hsl(${idx * 40}, 70%, 50%)`}
                                fill={`url(#grad-${idx})`}
                                strokeWidth={2}
                                activeDot={{ r: 6 }}
                                />
                            ))}
                    </AreaChart>
                ) : (
                    <BarChart data={incrementalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="index" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                            {pivotData.map((cohort, idx) => (
                                <Bar 
                                key={cohort.formattedName}
                                hide={hiddenSeries.has(cohort.formattedName)}
                                dataKey={cohort.formattedName} 
                                fill={`hsl(${idx * 40}, 70%, 50%)`}
                                radius={[4, 4, 0, 0]}
                                fillOpacity={0.8}
                                />
                            ))}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </GlassCard>

        <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Grid size={18} className="text-cyan-400"/> Cohort Performance Grid</h3>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                    <button onClick={() => setGridMode('cumulative')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'cumulative' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Volume</button>
                    <button onClick={() => setGridMode('percentage')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${gridMode === 'percentage' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Retention %</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-4 border-b border-white/10 sticky left-0 bg-slate-950 z-10">Cohort</th>
                            <th className="p-4 border-b border-white/10 text-right">Visitors</th>
                            {[...Array(6)].map((_, i) => <th key={i} className="p-4 border-b border-white/10 text-center">M{i}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {pivotData.map((row) => (
                            <tr key={row.cohortStart} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-sm font-bold text-white sticky left-0 bg-slate-950/90 border-r border-white/10">{row.formattedName}</td>
                                <td className="p-4 text-sm text-right font-mono text-slate-300 border-r border-white/5">{row.visitors.toLocaleString()}</td>
                                {[...Array(6)].map((_, i) => {
                                    const dp = row.dataPoints[i];
                                    const displayVal = gridMode === 'percentage' ? (dp?.cumulative ? ((dp.cumulative / row.visitors) * 100).toFixed(2) + '%' : '-') : dp?.cumulative || '-';
                                    return (
                                        <td key={i} className="p-2 border-r border-white/5">
                                            {dp && <div className={`rounded-lg p-2 text-center text-xs font-bold ${getCellColor(gridMode === 'percentage' ? parseFloat(displayVal) : dp.cumulative, dp.diff)}`}>{displayVal}</div>}
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
        const cols = line.split(',');
        if (cols.length < 6) continue;
        rawObjs.push({
            monthIdx: parseInt(cols[0]),
            startDate: cols[1],
            path: cols[3],
            visitors: parseInt(cols[4]),
            purchases: parseInt(cols[5])
        });
    }

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

            // Determine Calendar Month
            const d = new Date(startDate);
            d.setMonth(d.getMonth() + row.monthIdx);
            const calMonth = d.toISOString().slice(0, 7);

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
        return {
            month: m,
            visitors: d.visitors,
            purchases: d.purchases,
            conversion: d.visitors > 0 ? (d.purchases / d.visitors * 100).toFixed(2) : "0.00",
            velocity: (d.purchases / daysInMonth).toFixed(1)
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
            if (p === '/') label = 'Home Page';
            else {
                const parts = p.split('/').filter(Boolean);
                const last = parts[parts.length - 1];
                if (last) label = last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

  const totalVisitors = overallData.reduce((a,b) => a + b.visitors, 0);
  const maxVelocity = Math.max(...overallData.map(d => parseFloat(d.velocity) || 0));
  const avgConv = (overallData.reduce((a,b) => a + parseFloat(b.conversion), 0) / (overallData.length || 1)).toFixed(2);
  const latest = overallData[overallData.length - 1] || {};
  const previous = overallData[overallData.length - 2] || {};
  const visitorTrend = previous.visitors > 0 ? ((latest.visitors - previous.visitors) / previous.visitors * 100).toFixed(1) : 0;
  
  // Find Peak Velocity Month
  const peakMonthObj = overallData.find(d => parseFloat(d.velocity) === maxVelocity) || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         {/* Toggle View */}
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
                {view === 'overview' ? 'Purchase Velocity' : 'Top Performing Paths'}
            </h2>
            <div className="flex bg-[#0e0e12] p-1 rounded-xl border border-white/10">
                <button onClick={() => setView('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                    <Activity size={16} /> Overview
                </button>
                <button onClick={() => setView('paths')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'paths' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                    <MapIcon size={16} /> Page Paths
                </button>
            </div>
         </div>

         {view === 'overview' ? (
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard title="Latest Velocity" icon={TrendingUp} value={latest.velocity} subtext={`Purchases/Day in ${latest.month}`} />
                    <GlassCard title="Peak Velocity" icon={Zap} value={maxVelocity.toFixed(1)} subtext={`Occurred in ${peakMonthObj.month}`} />
                    <GlassCard title="Total Visitors" icon={Users} value={(totalVisitors / 1000000).toFixed(2) + 'M'} trend={visitorTrend >= 0 ? 'up' : 'down'} trendValue={`${Math.abs(visitorTrend)}% vs Prev Month`} subtext="Total Unique Sessions" />
                    <GlassCard title="Avg Conversion" icon={Percent} value={avgConv + '%'} subtext="Global Average" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Monthly Cohort Performance Table */}
                    <div className="lg:col-span-2">
                        <GlassCard title="Monthly Cohort Performance" noPadding className="h-full overflow-hidden">
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
                                            <div className="w-1 h-8 rounded-full bg-slate-700"></div>
                                            {row.month}
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-sm font-bold min-w-[60px]">{row.visitors.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-bold min-w-[60px]">{row.purchases.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-sm font-bold">{row.conversion}%</span>
                                        </div>
                                        <div className="text-right text-slate-400 font-mono text-sm">{row.velocity}</div>
                                    </div>
                                ))}
                             </div>
                        </GlassCard>
                    </div>

                    {/* Velocity vs Traffic Chart */}
                    <GlassCard title="Purchase Velocity vs Traffic" icon={Filter} className="h-[500px]">
                        <div className="h-full w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={overallData}>
                                    <defs>
                                        <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="#8b5cf6" tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/1000).toFixed(0)+'k'} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                                    <Tooltip content={CustomTooltip} />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Area yAxisId="left" type="monotone" dataKey="visitors" name="Traffic" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="purchases" name="Purchases" stroke="#22d3ee" strokeWidth={3} dot={{r:0}} activeDot={{r:6}} />
                                    <ReferenceLine yAxisId="right" y={parseFloat(latest.velocity) * 30} stroke="#94a3b8" strokeDasharray="3 3" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                {/* Sidebar List */}
                <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex items-center gap-2 text-white font-bold mb-2">
                        <Zap size={18} className="text-amber-400" /> Top Entry Points
                    </div>
                    {pathData.map(p => (
                        <GlassCard 
                            key={p.path} 
                            onClick={() => setSelectedPath(p)}
                            isActive={selectedPath?.path === p.path}
                            className="group transition-all hover:scale-[1.02] shrink-0"
                            noPadding
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
                                <div className="flex gap-8 mb-8 mt-2">
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Volume</div>
                                        <div className="text-3xl font-bold text-cyan-400">{selectedPath.purchases.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Revenue Est. (£85 AOV)</div>
                                        <div className="text-3xl font-bold text-white">£{(selectedPath.purchases * 85).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={selectedPath.trend}>
                                            <defs>
                                                <linearGradient id="gradPath" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#64748b" tick={{fontSize:12}} axisLine={false} tickLine={false} />
                                            <Tooltip content={CustomTooltip} />
                                            <Area type="monotone" dataKey="purchases" stroke="#10b981" strokeWidth={3} fill="url(#gradPath)" activeDot={{r:6}} />
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
                                                    <Cell key="share" fill="#06b6d4" />
                                                    <Cell key="rest" fill="#1e293b" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-2xl font-bold text-white">{selectedPath.visitors.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Visitors</div>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard title="TOTAL CONVERSION" className="h-[240px] flex items-center justify-center">
                                    <div className="flex flex-col items-center justify-center h-full -mt-6">
                                        <div className="text-6xl font-bold text-emerald-400 mb-2">{selectedPath.conversion}%</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-[0.2em]">Efficiency</div>
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
  const [csvData, setCsvData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDataProcessed = (data, stats) => {
    setCsvData(data);
    if(data) setActiveTab('cohort'); // Auto-switch on success
  };

  const NavItem = ({ id, label, icon: Icon }) => (
    <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            activeTab === id 
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <Icon size={20} />
        <span>{label}</span>
        {id === 'etl' && csvData && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-hidden flex">
      
       {/* Ambient Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-cyan-600/5 blur-[120px]" />
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-6 border-b border-white/5">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Layers className="text-cyan-500" /> 
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Cohort<span className="font-light">Suite</span></span>
              </h1>
              <p className="text-xs text-slate-500 mt-2 font-mono">v8.0 Unified Analytics</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-4">Pipeline</div>
              <NavItem id="etl" label="Data Ingestion" icon={Database} />
              
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 mb-2 mt-6">Analytics</div>
              <NavItem id="cohort" label="Cohort Analysis" icon={LayoutDashboard} />
              <NavItem id="velocity" label="Purchase Velocity" icon={Zap} />
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
         <span className="font-bold text-white">CohortSuite</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
             <Menu />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative z-10 h-screen overflow-y-auto custom-scrollbar pt-20 md:pt-0">
          <header className="px-8 py-8 md:py-12 max-w-7xl mx-auto">
             <h2 className="text-3xl font-light text-white mb-2 capitalize">
                 {activeTab === 'etl' && 'Data Preparation'}
                 {activeTab === 'cohort' && 'Retention & LTV'}
                 {activeTab === 'velocity' && 'Velocity & Paths'}
             </h2>
             <p className="text-slate-400 text-sm">
                 {activeTab === 'etl' && 'Clean, standardize, and prepare your raw GA4 export.'}
                 {activeTab === 'cohort' && 'Analyze cumulative growth and retention heatmaps.'}
                 {activeTab === 'velocity' && 'Understand purchase speed and top converting pages.'}
             </p>
          </header>

          <div className="px-4 md:px-8 pb-20 max-w-7xl mx-auto min-h-[500px]">
             {activeTab === 'etl' && <DataIngestion onDataProcessed={handleDataProcessed} existingData={csvData} />}
             {activeTab === 'cohort' && <CohortExplorer csvData={csvData} />}
             {activeTab === 'velocity' && <VelocityExplorer csvData={csvData} />}
          </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default App;
