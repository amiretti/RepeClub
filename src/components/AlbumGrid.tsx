/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SPECIALS, TEAMS, getStickersForGroup, TOTAL_STICKER_COUNT } from '../catalog';
import { getStickerNameAndTeam, STICKER_NAMES } from '../stickerData';
import { Camera, Check, Minus, Search, Mic, Square, Package, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { FlagIcon } from './FlagIcon';
import { StickerScanner } from './StickerScanner.tsx';
import { BatchAddModal } from './BatchAddModal';
import {
  interpretVoiceTranscript,
  getSpeechRecognitionCtor,
  isVoiceSearchSupported,
  matchVoiceToStickerCode
} from '../utils/voiceSearch';

const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

const WA_FLAG_FALLBACK_BY_TEAM_CODE: Record<string, string> = {
  ENG: '🇬🇧',
  SCO: '🇬🇧'
};

const isRegionalIndicatorFlag = (emoji: string): boolean => {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0) || 0);
  return (
    codePoints.length === 2 &&
    codePoints.every((cp) => cp >= REGIONAL_INDICATOR_START && cp <= REGIONAL_INDICATOR_END)
  );
};

interface ReportGroup {
  code: string;
  flag: string;
  stickers: string[];
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.601 2.326A7.854 7.854 0 0 0 8.01 0C3.701 0 .193 3.498.193 7.8c0 1.375.359 2.717 1.04 3.904L0 16l4.41-1.229a7.83 7.83 0 0 0 3.6.868h.003c4.308 0 7.816-3.499 7.816-7.8a7.75 7.75 0 0 0-2.228-5.513zm-5.59 11.997h-.002a6.53 6.53 0 0 1-3.33-.91l-.24-.143-2.615.728.698-2.545-.156-.262a6.47 6.47 0 0 1-.995-3.44c.001-3.57 2.92-6.475 6.512-6.475 1.74.001 3.375.674 4.604 1.897a6.42 6.42 0 0 1 1.908 4.58c-.001 3.57-2.922 6.47-6.515 6.47zm3.572-4.878c-.196-.098-1.163-.573-1.343-.638-.18-.065-.311-.098-.442.098-.13.196-.507.638-.622.769-.114.13-.229.147-.425.049-.196-.098-.827-.302-1.576-.964-.583-.517-.977-1.154-1.092-1.35-.114-.196-.012-.302.086-.4.088-.088.196-.228.294-.343a1.33 1.33 0 0 0 .196-.327c.065-.13.033-.245-.016-.343-.049-.098-.442-1.06-.605-1.452-.159-.38-.32-.329-.442-.335a7.77 7.77 0 0 0-.376-.007c-.13 0-.343.049-.523.245-.18.196-.687.67-.687 1.633 0 .964.704 1.896.802 2.027.098.13 1.388 2.112 3.361 2.962.47.203.836.324 1.123.415.472.15.902.129 1.242.078.379-.057 1.163-.475 1.327-.933.163-.458.163-.85.114-.933-.049-.082-.18-.13-.376-.229z" />
    </svg>
  );
};

export const AlbumGrid: React.FC = () => {
  const { inventory, updateStickerCount } = useApp();
  
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('00');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'duplicates'>('all');
  const [waStatus, setWaStatus] = useState<'idle' | 'opened' | 'blocked'>('idle');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTimeoutRef = useRef<number | null>(null);
  const voiceSupported = useMemo(() => isVoiceSearchSupported(), []);
  const validCodeSet = useMemo(() => new Set(Object.keys(STICKER_NAMES)), []);

  // Compute album statistics
  const stats = useMemo(() => {
    let uniqueOwned = 0;
    let totalDuplicates = 0;
    
    // Count owned & duplicated based on current inventory
    Object.keys(inventory).forEach(code => {
      const count = inventory[code] || 0;
      if (count > 0) {
        uniqueOwned += 1;
        if (count > 1) {
          totalDuplicates += (count - 1);
        }
      }
    });

    const completionPercent = Math.round((uniqueOwned / TOTAL_STICKER_COUNT) * 100);
    const missingCount = TOTAL_STICKER_COUNT - uniqueOwned;

    return {
      uniqueOwned,
      totalDuplicates,
      completionPercent,
      missingCount
    };
  }, [inventory]);

  // Merge specials and teams lists for easy routing
  const allGroups = useMemo(() => {
    return [...SPECIALS, ...TEAMS];
  }, []);

  const activeGroup = useMemo(() => {
    return allGroups.find(g => g.code === selectedGroupCode) || SPECIALS[0];
  }, [allGroups, selectedGroupCode]);

  const reportGroups = useMemo(() => {
    const fwcGroupA = SPECIALS.find((group) => group.code === 'FWC-A');
    const fwcGroupB = SPECIALS.find((group) => group.code === 'FWC-B');
    const ccGroup = SPECIALS.find((group) => group.code === 'CC');

    const fwcStickers = [
      ...(fwcGroupA ? getStickersForGroup(fwcGroupA) : []),
      ...(fwcGroupB ? getStickersForGroup(fwcGroupB) : [])
    ];

    const specialGroups: ReportGroup[] = [];

    if (fwcStickers.length > 0) {
      specialGroups.push({ code: 'FWC', flag: '⚽', stickers: fwcStickers });
    }

    if (ccGroup) {
      specialGroups.push({ code: ccGroup.code, flag: ccGroup.flag, stickers: getStickersForGroup(ccGroup) });
    }

    const teamReportGroups = TEAMS
      .filter((group) => !group.code.includes('-'))
      .map((group) => ({
        code: group.code,
        flag: group.flag,
        stickers: getStickersForGroup(group)
      }));

    return [...specialGroups, ...teamReportGroups];
  }, []);

  const duplicateReportLines = useMemo(() => {
    const lines: string[] = [];

    for (const group of reportGroups) {
      const matchedCodes = group.stickers.filter((code) => {
        const count = inventory[code] || 0;
        return count > 1;
      });

      if (matchedCodes.length === 0) {
        continue;
      }

      const waFlag = isRegionalIndicatorFlag(group.flag)
        ? group.flag
        : WA_FLAG_FALLBACK_BY_TEAM_CODE[group.code] || group.flag || '';

      const countryLabel = waFlag || group.code;

      lines.push(`- ${countryLabel}: ${matchedCodes.join(', ')}`);
    }

    return lines;
  }, [inventory, reportGroups]);

  const missingReportLines = useMemo(() => {
    const lines: string[] = [];

    for (const group of reportGroups) {
      const matchedCodes = group.stickers.filter((code) => {
        const count = inventory[code] || 0;
        return count === 0;
      });

      if (matchedCodes.length === 0) {
        continue;
      }

      const waFlag = isRegionalIndicatorFlag(group.flag)
        ? group.flag
        : WA_FLAG_FALLBACK_BY_TEAM_CODE[group.code] || group.flag || '';

      const countryLabel = waFlag || group.code;

      lines.push(`- ${countryLabel}: ${matchedCodes.join(', ')}`);
    }

    return lines;
  }, [inventory, reportGroups]);

  // Compute list of stickers to display
  const stickersToDisplay = useMemo(() => {
    // If search is active, ignore group selection and find stickers matching search criteria
    if (searchQuery.trim() !== '') {
      const queryLower = searchQuery.toLowerCase().trim();
      const matchStickers: string[] = [];
      
      allGroups.forEach(group => {
        const groupStickers = getStickersForGroup(group);
        groupStickers.forEach(sticker => {
          const isCodeMatch = sticker.toLowerCase().includes(queryLower);
          const isGroupNameMatch = group.name.toLowerCase().includes(queryLower);
          
          const stickerDetails = getStickerNameAndTeam(sticker);
          const isNameMatch = stickerDetails.name.toLowerCase().includes(queryLower);
          const isTeamMatch = stickerDetails.team.toLowerCase().includes(queryLower);
          
          if (isCodeMatch || isGroupNameMatch || isNameMatch || isTeamMatch) {
            matchStickers.push(sticker);
          }
        });
      });

      return matchStickers;
    }

    // Default to active group
    return getStickersForGroup(activeGroup);
  }, [activeGroup, allGroups, searchQuery]);

  // Apply filters: Missing / Duplicates
  const filteredStickers = useMemo(() => {
    return stickersToDisplay.filter(code => {
      const count = inventory[code] || 0;
      if (filterMode === 'missing') {
        return count === 0;
      }
      if (filterMode === 'duplicates') {
        return count > 1;
      }
      return true;
    });
  }, [stickersToDisplay, inventory, filterMode]);

  // Flat sticker index used by the autocomplete dropdown.
  const stickerIndex = useMemo(() => {
    const items: { code: string; name: string; team: string; flag: string }[] = [];
    allGroups.forEach((group) => {
      getStickersForGroup(group).forEach((code) => {
        const details = getStickerNameAndTeam(code);
        items.push({ code, name: details.name, team: details.team, flag: group.flag });
      });
    });
    return items;
  }, [allGroups]);

  // Top suggestions for the autocomplete dropdown.
  const autocompleteSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) return [];
    const scored = stickerIndex
      .map((item) => {
        const code = item.code.toLowerCase();
        const name = item.name.toLowerCase();
        const team = item.team.toLowerCase();
        let score = 0;
        if (code === q) score = 100;
        else if (code.startsWith(q)) score = 80;
        else if (code.includes(q)) score = 60;
        else if (name.startsWith(q)) score = 50;
        else if (name.includes(q)) score = 30;
        else if (team.includes(q)) score = 10;
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.item);
    return scored;
  }, [searchQuery, stickerIndex]);

  const handleCardClick = (code: string) => {
    const currentCount = inventory[code] || 0;
    updateStickerCount(code, currentCount + 1);
  };

  const handleMinusClick = (e: React.MouseEvent, code: string) => {
    e.stopPropagation(); // prevent adding count
    const currentCount = inventory[code] || 0;
    if (currentCount > 0) {
      updateStickerCount(code, currentCount - 1);
    }
  };

  const handleOpenWhatsApp = (type: 'duplicates' | 'missing') => {
    setWaStatus('idle');
    const inviteLine = '¿Todavía no usás RepeClub? Sumate gratis y completá el álbum más fácil 😎⚽ https://repeclub.digital/app';

    const reportText = type === 'duplicates'
      ? (duplicateReportLines.length === 0
        ? `No tenes figus repetidas para reportar por pais.\n\n${inviteLine}`
        : `Hola! estas son mis figus repetidas, te falta alguna de estas?\n\n${duplicateReportLines.join('\n')}\n\n${inviteLine}`)
      : (missingReportLines.length === 0
        ? `No hay figus faltantes para reportar por pais. Album completo!\n\n${inviteLine}`
        : `Hola! Estas son las figus que me faltan, tenes alguna repe?\n\n${missingReportLines.join('\n')}\n\n${inviteLine}`);

    const baseUrl = 'https://api.whatsapp.com/send?text=';
    const whatsappUrl = `${baseUrl}${encodeURIComponent(reportText)}`;

    window.location.assign(whatsappUrl);
  };

  const handleConfirmScannedCode = async (code: string) => {
    const currentCount = inventory[code] || 0;
    await updateStickerCount(code, currentCount + 1);
    setSearchQuery(code);
    setScanFeedback(`✅ Sumada ${code}`);
    window.setTimeout(() => setScanFeedback(null), 2200);
  };

  const handleBatchConfirm = useCallback(async (codes: string[]) => {
    // Sumamos secuencialmente, contando duplicados dentro del mismo paquete.
    const additions: Record<string, number> = {};
    codes.forEach((c) => {
      additions[c] = (additions[c] || 0) + 1;
    });
    const entries = Object.entries(additions);
    for (const [code, delta] of entries) {
      const current = inventory[code] || 0;
      await updateStickerCount(code, current + delta);
    }
    setScanFeedback(`✅ Sumaste ${codes.length} ${codes.length === 1 ? 'figu' : 'figus'} del paquete`);
    window.setTimeout(() => setScanFeedback(null), 2800);
  }, [inventory, updateStickerCount]);

  const handleQuickAdd = useCallback(async (code: string) => {
    const current = inventory[code] || 0;
    await updateStickerCount(code, current + 1);
    setScanFeedback(`✅ Sumada ${code}`);
    window.setTimeout(() => setScanFeedback(null), 2000);
  }, [inventory, updateStickerCount]);

  const handlePickSuggestion = useCallback((code: string) => {
    setSearchQuery(code);
    setAutocompleteOpen(false);
    setAutocompleteIndex(-1);
  }, []);

  const handleStartVoice = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceError('Tu navegador no soporta reconocimiento de voz.');
      window.setTimeout(() => setVoiceError(null), 3000);
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    if (voiceTimeoutRef.current !== null) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    const recognition = new Ctor();
    recognition.lang = 'es-AR';
    // Modo continuo + interim: evita que Chrome cierre el mic con "no-speech"
    // ante prefijos cortos o consonantes débiles (ej. HAI, AYE).
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    let processed = false;
    const finishWithMatch = (alternatives: string[]) => {
      if (processed) return;
      processed = true;
      if (voiceTimeoutRef.current !== null) {
        window.clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      const match = matchVoiceToStickerCode(alternatives, validCodeSet);
      if (match.code) {
        setSearchQuery(match.code);
      } else {
        const fallback = match.query || interpretVoiceTranscript(alternatives[0]);
        setSearchQuery(fallback);
      }
      setAutocompleteOpen(true);
      try { recognition.stop(); } catch { /* noop */ }
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const t = result[j]?.transcript;
          if (typeof t === 'string' && t.trim().length > 0) {
            alternatives.push(t.trim());
          }
        }
        if (alternatives.length === 0) continue;
        // Atajo para resultados interim: si ya matchean un código válido,
        // cortamos el mic al instante para no dejarlo abierto al ruido.
        if (!result.isFinal) {
          const earlyMatch = matchVoiceToStickerCode(alternatives, validCodeSet);
          if (earlyMatch.code && earlyMatch.confidence === 'exact') {
            finishWithMatch(alternatives);
            return;
          }
          continue;
        }
        finishWithMatch(alternatives);
        return;
      }
    };
    recognition.onerror = (event: any) => {
      if (voiceTimeoutRef.current !== null) {
        window.clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      if (event?.error === 'not-allowed') {
        setVoiceError('No diste permiso para usar el micrófono.');
      } else if (event?.error === 'no-speech') {
        setVoiceError('No te escuché. Probá de nuevo.');
      } else {
        setVoiceError('No pude entenderte. Probá de nuevo.');
      }
      window.setTimeout(() => setVoiceError(null), 2500);
    };
    recognition.onend = () => {
      if (voiceTimeoutRef.current !== null) {
        window.clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      setVoiceListening(false);
      recognitionRef.current = null;
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setVoiceListening(true);
      // Cortamos a los 5 segundos pase lo que pase para evitar que entre ruido
      // o palabras posteriores al código.
      voiceTimeoutRef.current = window.setTimeout(() => {
        if (!processed) {
          try { recognition.stop(); } catch { /* noop */ }
        }
      }, 5000);
    } catch {
      setVoiceListening(false);
    }
  }, [validCodeSet]);

  const handleStopVoice = useCallback(() => {
    if (voiceTimeoutRef.current !== null) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    setVoiceListening(false);
  }, []);

  // Limpieza del reconocimiento al desmontar.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <section aria-labelledby="album-grid-title" className="space-y-4 w-full px-4 lg:px-6 pb-8">
      <h2 id="album-grid-title" className="sr-only">Colección de figuritas</h2>
      
      {/* 1. Progress dashboard card (Bento Grid design) */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-5 opacity-10 font-bold text-7xl select-none rotate-12">
          🏆
        </div>

        <div>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full text-blue-200 uppercase font-black tracking-widest">
            Mi Álbum
          </span>
          <p className="text-5xl font-black tracking-tight mt-2 text-white">
            {stats.completionPercent}%
          </p>
        </div>

        {/* Progress bar and numeric specs */}
        <div className="mt-4">
          <div className="w-full bg-blue-950/50 h-3 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-sky-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-blue-200 font-bold">
            <span>{stats.uniqueOwned} / {TOTAL_STICKER_COUNT} figuritas</span>
            <span>Pegadas {stats.uniqueOwned}</span>
          </div>
        </div>

        {/* Integrated nested cards dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5 flex flex-col">
            <span className="text-[9px] text-blue-200 font-bold uppercase tracking-widest block">Faltantes</span>
            <div className="mt-1.5 flex items-end justify-between gap-2">
              <span className="text-xl font-extrabold text-white block">{stats.missingCount}</span>
              <button
                onClick={() => handleOpenWhatsApp('missing')}
                className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                aria-label="Compartir faltantes por WhatsApp"
                title="Compartir faltantes"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-sky-500 rounded-2xl p-3 shadow-md flex flex-col">
            <span className="text-[9px] text-sky-100 font-bold uppercase tracking-widest block">Repetidas</span>
            <div className="mt-1.5 flex items-end justify-between gap-2">
              <span className="text-xl font-extrabold text-white block">✨ {stats.totalDuplicates}</span>
              <button
                onClick={() => handleOpenWhatsApp('duplicates')}
                className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                aria-label="Compartir repetidas por WhatsApp"
                title="Compartir repetidas"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 min-h-4">
          {waStatus === 'opened' && <span className="text-[10px] text-emerald-200 font-bold">WhatsApp abierto con el reporte.</span>}
          {waStatus === 'blocked' && <span className="text-[10px] text-amber-200 font-bold">El navegador bloqueó la apertura. Probá de nuevo.</span>}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <label htmlFor="searchInput" className="sr-only">Buscar figuritas por código, nombre o selección</label>
          <input
            id="searchInput"
            type="text"
            placeholder="Buscá por código, jugador o selección..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setAutocompleteOpen(true);
              setAutocompleteIndex(-1);
            }}
            onFocus={() => setAutocompleteOpen(true)}
            onBlur={() => window.setTimeout(() => setAutocompleteOpen(false), 150)}
            onKeyDown={(e) => {
              if (!autocompleteOpen || autocompleteSuggestions.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setAutocompleteIndex((i) => Math.min(i + 1, autocompleteSuggestions.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setAutocompleteIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && autocompleteIndex >= 0) {
                e.preventDefault();
                handlePickSuggestion(autocompleteSuggestions[autocompleteIndex].code);
              } else if (e.key === 'Escape') {
                setAutocompleteOpen(false);
              }
            }}
            role="combobox"
            aria-expanded={autocompleteOpen && autocompleteSuggestions.length > 0}
            aria-controls="searchAutocompleteList"
            aria-autocomplete="list"
            aria-activedescendant={autocompleteIndex >= 0 ? `suggestion-${autocompleteIndex}` : undefined}
            className="w-full text-xs focus:text-base font-semibold pl-9 pr-20 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs placeholder:text-slate-450"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAutocompleteOpen(false);
                  setAutocompleteIndex(-1);
                }}
                aria-label="Borrar búsqueda"
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center"
              >
                <span className="text-sm leading-none font-black">×</span>
              </button>
            )}
            {voiceSupported && (
              <button
                type="button"
                onClick={voiceListening ? handleStopVoice : handleStartVoice}
                aria-label={voiceListening ? 'Detener grabación de voz' : 'Buscar por voz'}
                aria-pressed={voiceListening}
                title={voiceListening ? 'Detener' : 'Buscar por voz'}
                className={`relative inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors shadow-xs ${
                  voiceListening
                    ? 'bg-rose-600 text-white'
                    : 'bg-sky-600 text-white hover:bg-sky-500'
                }`}
              >
                {voiceListening ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-white animate-pulse"
                    />
                    <Square className="w-3 h-3 fill-current" />
                  </>
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {/* Botón de cámara temporalmente oculto — funcionalidad de OCR pausada.
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label="Escanear figurita con cámara"
              title="Escanear figurita"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-xs"
            >
              <Camera className="w-4 h-4" />
            </button>
            */}
          </div>

          {autocompleteOpen && autocompleteSuggestions.length > 0 && (
            <div
              id="searchAutocompleteList"
              role="listbox"
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
            >
              {autocompleteSuggestions.map((s, i) => {
                const count = inventory[s.code] || 0;
                const isActive = i === autocompleteIndex;
                return (
                  <div
                    key={s.code}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(e) => {
                      // Evitar perder el foco antes de procesar el click.
                      e.preventDefault();
                    }}
                    onClick={() => handlePickSuggestion(s.code)}
                    onMouseEnter={() => setAutocompleteIndex(i)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs ${
                      isActive ? 'bg-sky-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <FlagIcon emoji={s.flag} label={s.team} />
                    <span className="font-mono font-bold text-slate-900 w-14 flex-shrink-0">{s.code}</span>
                    <span className="text-slate-700 truncate flex-1">{s.name}</span>
                    {count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        count > 1 ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {count > 1 ? `×${count}` : '✓'}
                      </span>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleQuickAdd(s.code);
                      }}
                      aria-label={`Sumar ${s.code}`}
                      title="Sumar al álbum"
                      className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {voiceListening && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 self-start space-y-1"
            role="status"
            aria-live="polite"
          >
            <div className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Escuchando… decí el código (ej. PAN 16) o el nombre.
            </div>
            <div className="text-[10px] font-normal text-rose-600/90">
              Si no te entiende, deletreá: “hache a i ocho”.
            </div>
          </div>
        )}

        {voiceError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800" role="alert">
            {voiceError}
          </div>
        )}

        {/* filter triggers + batch add */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setBatchOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition-colors"
            title="Agregar varias figus a la vez"
          >
            <Package className="w-3.5 h-3.5" />
            Sumar paquete
          </button>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setFilterMode('all')}
            aria-pressed={filterMode === 'all'}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'all' ? 'bg-white shadow-xs text-slate-900 border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterMode('missing')}
            aria-pressed={filterMode === 'missing'}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'missing' ? 'bg-sky-600 shadow-xs text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Faltan
          </button>
          <button
            onClick={() => setFilterMode('duplicates')}
            aria-pressed={filterMode === 'duplicates'}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'duplicates' ? 'bg-amber-500 shadow-xs text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Repes
          </button>
        </div>
        </div>
      </div>

      {/* 3. Group / Team horizontal scroll */}
      {searchQuery === '' && (
        <div className="overflow-x-auto scrollbar-none flex gap-1.5 pb-2 -mx-4 px-4 mask-right">
          {allGroups.map((group) => {
            const isSelected = selectedGroupCode === group.code;
            return (
              <button
                key={group.code}
                onClick={() => setSelectedGroupCode(group.code)}
                aria-pressed={isSelected}
                aria-label={`Filtrar por ${group.name}`}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100'
                    : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FlagIcon emoji={group.flag} label={group.name} />
                <span>{group.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Stickers List Content */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
            {searchQuery ? (
              'Resultados de búsqueda'
            ) : (
              <>
                <FlagIcon emoji={activeGroup.flag} label={activeGroup.name} />
                <span>{activeGroup.name}</span>
              </>
            )}
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-400">
            {filteredStickers.length === 0
              ? 'ninguna figu'
              : filteredStickers.length === 1
                ? '1 figu'
                : `${filteredStickers.length} figus`}
          </span>
        </div>

        {scanFeedback && (
          <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            {scanFeedback}
          </div>
        )}

        {filteredStickers.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">
            🔍 No hay figus acá con ese filtro. Probá otro y sale.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {filteredStickers.map((code) => {
              const count = inventory[code] || 0;
              const hasIt = count >= 1;
              const hasRepeats = count >= 2;
              const stickerDetails = getStickerNameAndTeam(code);

              return (
                <motion.div
                  key={code}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(code)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Figurita ${code}, ${stickerDetails.name}. Cantidad ${count}. Pulsa para sumar`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(code);
                    }
                  }}
                  className={`relative p-2.5 rounded-2xl flex flex-col items-center justify-between min-h-[110px] cursor-pointer border select-none transition-all ${
                    hasRepeats
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50/70 border-amber-300 text-amber-900 ring-2 ring-amber-200/50 shadow-xs'
                      : hasIt
                      ? 'bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200 text-sky-950 shadow-xs'
                      : 'bg-white border-slate-205 text-slate-400 hover:bg-slate-50 border-dashed hover:border-slate-350 shadow-xs'
                  }`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 z-10">
                    {hasRepeats && (
                      <span className="bg-amber-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                        +{count - 1}
                      </span>
                    )}
                    {hasIt && !hasRepeats && (
                      <span className="bg-sky-600 text-white p-0.5 rounded-full shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                      </span>
                    )}
                  </div>

                  {/* Minus decrement action */}
                  {hasIt && (
                    <button
                      onClick={(e) => handleMinusClick(e, code)}
                      aria-label={`Quitar una unidad de ${code}`}
                      className="absolute bottom-1 left-1 p-1 bg-white hover:bg-slate-100 text-slate-600 rounded-lg shadow-xs border border-slate-100 transition-colors z-10"
                      title="Quitar"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  )}

                  {/* Code Label */}
                  <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 self-center">
                    {code}
                  </div>

                  {/* Player Name Label */}
                  <div className={`text-[10px] text-center font-bold px-0.5 line-clamp-2 leading-tight py-1 self-center ${hasIt ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stickerDetails.name}
                  </div>

                  {/* Placeholder design element */}
                  <div className="text-[9px] opacity-40 select-none">
                    {hasIt ? '⚽' : '▫️'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Brief user instructions */}
      <div className="bg-sky-50/50 border border-sky-100/30 rounded-2xl p-3.5 mt-4 text-center">
        <p className="text-[10px] leading-relaxed text-sky-900">
          💡 <strong>¡Tocá la figu para agregarla a tu colección!</strong> Tocala una vez más para sumar una repe y usá el botón <span className="inline-flex p-0.5 bg-white border border-slate-200 rounded text-xs leading-none"><Minus className="w-2 h-2 inline text-sky-600" /></span> para quitarla (por si te equivocaste o la cambiaste).
        </p>
      </div>

      <StickerScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirmCode={handleConfirmScannedCode}
      />

      <BatchAddModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onConfirm={handleBatchConfirm}
        inventory={inventory}
      />

    </section>
  );
};
