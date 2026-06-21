import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Cpu, Copy, Check } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
}

interface ProcessedModels {
  free: Model[];
  cheap: Model[];
  allFiltered: Model[];
}

// In-memory session cache for OpenRouter models
let globalCachedModels: ProcessedModels | null = null;

const keywords = ["dolphin", "hermes", "venice", "nous", "uncensored", "grok", "mixtral", "wizard"];

function processModels(rawModels: any[]): ProcessedModels {
  const filtered = rawModels.filter(m => {
    if (!m || !m.id) return false;
    
    const idLower = m.id.toLowerCase();
    
    // 1. Keyword check - id must contain at least one pattern keyword
    const matchesKeyword = keywords.some(keyword => idLower.includes(keyword));
    if (!matchesKeyword) return false;

    // 2. Price check
    let promptPrice = 0;
    if (m.pricing && m.pricing.prompt !== undefined && m.pricing.prompt !== null) {
      promptPrice = typeof m.pricing.prompt === 'string' ? parseFloat(m.pricing.prompt) : Number(m.pricing.prompt);
    }
    if (isNaN(promptPrice)) {
      promptPrice = 0;
    }

    const isFree = idLower.endsWith(':free') || m.pricing?.prompt === '0' || m.pricing?.prompt === 0 || promptPrice === 0;
    const isCheap = !isFree && promptPrice <= 0.000001;

    return isFree || isCheap;
  });

  const tempFree: Model[] = [];
  const tempCheap: Model[] = [];

  filtered.forEach(m => {
    const idLower = m.id.toLowerCase();
    
    let promptPrice = 0;
    if (m.pricing && m.pricing.prompt !== undefined && m.pricing.prompt !== null) {
      promptPrice = typeof m.pricing.prompt === 'string' ? parseFloat(m.pricing.prompt) : Number(m.pricing.prompt);
    }
    if (isNaN(promptPrice)) {
      promptPrice = 0;
    }

    const isFree = idLower.endsWith(':free') || m.pricing?.prompt === '0' || m.pricing?.prompt === 0 || promptPrice === 0;

    const modelObj: Model = {
      id: m.id,
      name: m.name || m.id,
      pricing: m.pricing
    };

    if (isFree) {
      tempFree.push(modelObj);
    } else {
      tempCheap.push(modelObj);
    }
  });

  // Alphabetical sort by name
  const sortAlpha = (a: Model, b: Model) => {
    const nameA = (a.name || a.id || '').toLowerCase();
    const nameB = (b.name || b.id || '').toLowerCase();
    return nameA.localeCompare(nameB);
  };

  // Price ascending sort (with alphabetical fallback)
  const sortPriceAsc = (a: Model, b: Model) => {
    let priceA = 0;
    if (a.pricing && a.pricing.prompt !== undefined && a.pricing.prompt !== null) {
      priceA = typeof a.pricing.prompt === 'string' ? parseFloat(a.pricing.prompt) : Number(a.pricing.prompt);
    }
    if (isNaN(priceA)) priceA = 0;

    let priceB = 0;
    if (b.pricing && b.pricing.prompt !== undefined && b.pricing.prompt !== null) {
      priceB = typeof b.pricing.prompt === 'string' ? parseFloat(b.pricing.prompt) : Number(b.pricing.prompt);
    }
    if (isNaN(priceB)) priceB = 0;

    if (priceA !== priceB) {
      return priceA - priceB;
    }
    return sortAlpha(a, b);
  };

  tempFree.sort(sortAlpha);
  // Append hardcoded free model
  tempFree.push({
    id: 'openai/gpt-oss-120b:free',
    name: 'openai/gpt-oss-120b:free',
    pricing: { prompt: '0', completion: '0' }
  });
  tempCheap.sort(sortPriceAsc);

  return {
    free: tempFree,
    cheap: tempCheap,
    allFiltered: [...tempFree, ...tempCheap]
  };
}

interface ModelSwitcherProps {
  selectedModel: string;
  onChange: (model: string) => void;
}

export function ModelSwitcher({ selectedModel, onChange }: ModelSwitcherProps) {
  const [models, setModels] = useState<ProcessedModels>(() => {
    if (globalCachedModels) return globalCachedModels;
    return { free: [], cheap: [], allFiltered: [] };
  });

  const [copied, setCopied] = useState(false);
  const lastKeyRef = useRef<string>('');

  const fetchModels = async () => {
    const apiKey = localStorage.getItem('sonya_openrouter_key') || '';
    lastKeyRef.current = apiKey;

    if (!apiKey) {
      setModels({ free: [], cheap: [], allFiltered: [] });
      globalCachedModels = null;
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      headers['Authorization'] = `Bearer ${apiKey}`;

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OpenRouter models');
      }

      const json = await response.json();
      if (json && Array.isArray(json.data)) {
        const processed = processModels(json.data);
        
        setModels(processed);
        globalCachedModels = processed;

        // Auto-select selection logic
        const savedModel = localStorage.getItem('sonya_model');
        const isSavedInFiltered = savedModel ? processed.allFiltered.some(m => m.id === savedModel) : false;

        if (!isSavedInFiltered) {
          let fallbackId = '';
          if (processed.free.length > 0) {
            fallbackId = processed.free[0].id;
          } else if (processed.cheap.length > 0) {
            fallbackId = processed.cheap[0].id;
          }
          if (fallbackId) {
            onChange(fallbackId);
          }
        }
      } else {
        setModels({ free: [], cheap: [], allFiltered: [] });
        globalCachedModels = null;
      }
    } catch (error) {
      console.error('Quietly handling OpenRouter models load failure:', error);
      // Fallback silently without breaking the application, retaining current memory cache if it exists, otherwise clear
      if (!globalCachedModels) {
        setModels({ free: [], cheap: [], allFiltered: [] });
      }
    }
  };

  useEffect(() => {
    fetchModels();

    // Poll for key changes in localStorage (e.g. after saving from settings)
    const interval = setInterval(() => {
      const currentKey = localStorage.getItem('sonya_openrouter_key') || '';
      if (currentKey !== lastKeyRef.current) {
        fetchModels();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleFocus = () => {
    fetchModels();
  };

  const handleCopy = async () => {
    if (!hasModels) return;
    try {
      // Format all models: free section first, then cheap section
      const lines: string[] = [];
      if (models.free.length > 0) {
        lines.push('=== Free Models ===');
        models.free.forEach(m => lines.push(m.id));
      }
      if (models.cheap.length > 0) {
        if (lines.length > 0) lines.push('');
        lines.push('=== Cheap Models (< $1 / 1M tokens) ===');
        models.cheap.forEach(m => lines.push(m.id));
      }
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy model IDs:', err);
    }
  };

  const hasFree = models.free.length > 0;
  const hasCheap = models.cheap.length > 0;
  const hasModels = models.allFiltered.length > 0;

  return (
    <div className="relative inline-flex items-center gap-2 select-container" id="model-switcher">
      <div className="hidden sm:flex items-center gap-1.5 p-1 px-2 border border-violet-500/10 rounded-md bg-[#0a0810]/50">
        <Cpu size={12} className="text-violet-400" />
        <span className="text-[10px] font-mono uppercase text-[#888] tracking-wider">Engine:</span>
      </div>
      
      <div className="relative">
        <select
          value={hasModels ? selectedModel : ''}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          onFocus={handleFocus}
          className="appearance-none bg-[#0a0814]/80 border border-[#8b5cf6]/20 text-violet-300 pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/30 hover:bg-[#8b5cf6]/5 transition-all cursor-pointer shadow-md inline-flex items-center max-w-[240px] truncate"
          id="model-dropdown-select"
        >
          {!hasModels ? (
            <option value="" disabled className="bg-[#0f0c1a] text-[#888] text-xs py-2">
              No compatible models found — check your API key
            </option>
          ) : (
            <>
              {/* If selected model is not in filtered list, create placeholder option */}
              {selectedModel && !models.allFiltered.some(m => m.id === selectedModel) && (
                <option value={selectedModel} className="bg-[#0f0c1a] text-zinc-400 text-xs py-2">
                  {selectedModel.split('/').pop() || selectedModel}
                </option>
              )}

              {hasFree && (
                <optgroup label="Free" className="bg-[#0a0814] text-emerald-400 text-[10px] font-bold tracking-wider uppercase py-1">
                  {models.free.map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#0f0c1a] text-[#e2d9ff] text-xs font-medium py-1.5 normal-case">
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {hasCheap && (
                <optgroup label="Cheap (< $1 / 1M tokens)" className="bg-[#0a0814] text-sky-400 text-[10px] font-bold tracking-wider uppercase py-1">
                  {models.cheap.map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#0f0c1a] text-[#e2d9ff] text-xs font-medium py-1.5 normal-case">
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </>
          )}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>

      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={!hasModels}
        className="p-1.5 px-2.5 bg-[#0a0814]/80 border border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/10 text-violet-300 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed min-h-[28px] select-none shadow-sm"
        title="Copy all model IDs to clipboard"
        id="btn-model-copy"
      >
        {copied ? (
          <>
            <Check size={12} className="text-emerald-400" />
            <span className="text-emerald-400 font-medium text-[10px]">Copied</span>
          </>
        ) : (
          <>
            <Copy size={12} />
          </>
        )}
      </button>
    </div>
  );
}

export default ModelSwitcher;
