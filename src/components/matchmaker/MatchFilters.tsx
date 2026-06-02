/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapPin, Search, UserRound } from 'lucide-react';

interface MatchFiltersProps {
  searchFiguCode: string;
  locationFilter: string;
  searchNickname: string;
  onSearchFiguCodeChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onSearchNicknameChange: (value: string) => void;
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
  searchFiguCode,
  locationFilter,
  searchNickname,
  onSearchFiguCodeChange,
  onLocationFilterChange,
  onSearchNicknameChange
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div>
        <label htmlFor="search_figu_input" className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">Buscar Figu</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="search_figu_input"
            type="text"
            placeholder="Ej: ARG10"
            value={searchFiguCode}
            onChange={(e) => onSearchFiguCodeChange(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="search_nickname_input" className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">Nombre o Nick</label>
        <div className="relative">
          <UserRound className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="search_nickname_input"
            type="text"
            placeholder="Ej: Mati"
            value={searchNickname}
            onChange={(e) => onSearchNicknameChange(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="search_loc_input" className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">Zona</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="search_loc_input"
            type="text"
            placeholder="Ej: Palermo"
            value={locationFilter}
            onChange={(e) => onLocationFilterChange(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
