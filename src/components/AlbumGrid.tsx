/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPECIALS, TEAMS, getStickersForGroup, TOTAL_STICKER_COUNT } from '../catalog';
import { getStickerNameAndTeam } from '../stickerData';
import { Check, Plus, Minus, Search, Sparkles, Filter, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

export const AlbumGrid: React.FC = () => {
  const { inventory, updateStickerCount } = useApp();
  
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('00');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'duplicates'>('all');

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

    return {
      uniqueOwned,
      totalDuplicates,
      completionPercent
    };
  }, [inventory]);

  // Merge specials and teams lists for easy routing
  const allGroups = useMemo(() => {
    return [...SPECIALS, ...TEAMS];
  }, []);

  const activeGroup = useMemo(() => {
    return allGroups.find(g => g.code === selectedGroupCode) || SPECIALS[0];
  }, [allGroups, selectedGroupCode]);

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

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 pb-20">
      
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
            <span>{TOTAL_STICKER_COUNT - stats.uniqueOwned} faltan</span>
          </div>
        </div>

        {/* Integrated nested cards dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5 flex flex-col justify-between">
            <span className="text-[9px] text-blue-200 font-bold uppercase tracking-widest block">Diferentes</span>
            <span className="text-xl font-extrabold text-white block mt-1">{stats.uniqueOwned}</span>
          </div>
          <div className="bg-sky-500 rounded-2xl p-3 shadow-md flex flex-col justify-between">
            <span className="text-[9px] text-sky-100 font-bold uppercase tracking-widest block">Repetidas</span>
            <span className="text-xl font-extrabold text-white block mt-1">✨ {stats.totalDuplicates}</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="searchInput"
            type="text"
            placeholder="Buscar por código o selección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs placeholder:text-slate-450"
          />
        </div>

        {/* filter triggers */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'all' ? 'bg-white shadow-xs text-slate-900 border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterMode('missing')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'missing' ? 'bg-sky-600 shadow-xs text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Faltan
          </button>
          <button
            onClick={() => setFilterMode('duplicates')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterMode === 'duplicates' ? 'bg-amber-500 shadow-xs text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Repes
          </button>
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100'
                    : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{group.flag}</span>
                <span>{group.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Stickers List Content */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {searchQuery ? 'Resultados de búsqueda' : `${activeGroup.flag} ${activeGroup.name}`}
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-400">
            {filteredStickers.length} figus
          </span>
        </div>

        {filteredStickers.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">
            🔍 No hay figuritas en esta categoría con el filtro seleccionado.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
          💡 <strong>¡Toca la figu para coleccionarla!</strong> Toca otra vez para añadir repetidas. Usa el botón <span className="inline-flex p-0.5 bg-white border border-slate-200 rounded text-xs leading-none"><Minus className="w-2 h-2 inline text-sky-600" /></span> para reducir la cantidad en tu colección.
        </p>
      </div>

    </div>
  );
};
