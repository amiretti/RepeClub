/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { ArrowDown, BadgeCheck, BarChart3, Sparkles, Sticker, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SPECIALS, TEAMS, getStickersForGroup, TOTAL_STICKER_COUNT } from '../catalog';
import { getStickerNameAndTeam } from '../stickerData';
import { FlagIcon } from './FlagIcon';

interface SelectionStats {
  code: string;
  name: string;
  flag: string;
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  completionPercent: number;
}

export const StatsScreen: React.FC = () => {
  const { inventory } = useApp();

  const metrics = useMemo(() => {
    const fwcA = SPECIALS.find((group) => group.code === 'FWC-A');
    const fwcB = SPECIALS.find((group) => group.code === 'FWC-B');
    const cc = SPECIALS.find((group) => group.code === 'CC');

    const fwcStickers = [
      ...(fwcA ? getStickersForGroup(fwcA) : []),
      ...(fwcB ? getStickersForGroup(fwcB) : [])
    ];

    const selectionPool: SelectionStats[] = [
      {
        code: 'FWC',
        name: 'FIFA World Cup',
        flag: '⚽',
        total: fwcStickers.length,
        owned: 0,
        missing: 0,
        duplicates: 0,
        completionPercent: 0
      },
      {
        code: 'CC',
        name: 'Coca-Cola',
        flag: '🥤',
        total: cc ? getStickersForGroup(cc).length : 0,
        owned: 0,
        missing: 0,
        duplicates: 0,
        completionPercent: 0
      },
      ...TEAMS.map((team) => ({
        code: team.code,
        name: team.name,
        flag: team.flag,
        total: getStickersForGroup(team).length,
        owned: 0,
        missing: 0,
        duplicates: 0,
        completionPercent: 0
      }))
    ];

    const selectionStickersByCode: Record<string, string[]> = {
      FWC: fwcStickers,
      CC: cc ? getStickersForGroup(cc) : []
    } as Record<string, string[]>;

    TEAMS.forEach((team) => {
      selectionStickersByCode[team.code] = getStickersForGroup(team);
    });

    const computedSelections = selectionPool
      .map((selection) => {
        const stickers = selectionStickersByCode[selection.code] || [];
        const owned = stickers.reduce((acc, sticker) => acc + ((inventory[sticker] || 0) > 0 ? 1 : 0), 0);
        const duplicates = stickers.reduce((acc, sticker) => {
          const count = inventory[sticker] || 0;
          return acc + (count > 1 ? count - 1 : 0);
        }, 0);
        const missing = Math.max(stickers.length - owned, 0);
        const completionPercent = stickers.length > 0 ? Math.round((owned / stickers.length) * 100) : 0;

        return {
          ...selection,
          total: stickers.length,
          owned,
          duplicates,
          missing,
          completionPercent
        };
      })
      .filter((selection) => selection.total > 0);

    const validStickerSet = new Set(computedSelections.flatMap((selection) => selectionStickersByCode[selection.code] || []));
    const validCodes = Array.from(validStickerSet);

    const uniqueOwned = validCodes.reduce((acc, code) => acc + ((inventory[code] || 0) > 0 ? 1 : 0), 0);
    const totalDuplicates = validCodes.reduce((acc, code) => {
      const count = inventory[code] || 0;
      return acc + (count > 1 ? count - 1 : 0);
    }, 0);
    const missingCount = Math.max(TOTAL_STICKER_COUNT - uniqueOwned, 0);
    const completionPercent = Math.round((uniqueOwned / TOTAL_STICKER_COUNT) * 100);

    const repeatedEntries = validCodes
      .map((code) => {
        const total = inventory[code] || 0;
        return { code, total, repeats: Math.max(total - 1, 0) };
      })
      .filter((entry) => entry.repeats > 0)
      .sort((a, b) => b.repeats - a.repeats || b.total - a.total || a.code.localeCompare(b.code));

    const mostRepeated = repeatedEntries[0] || null;
    const topRepeated = repeatedEntries.slice(0, 5);

    const inProgress = computedSelections.filter((selection) => selection.completionPercent < 100);
    const easiestToClose = inProgress
      .slice()
      .sort((a, b) => b.completionPercent - a.completionPercent || a.missing - b.missing)[0] || null;
    const hardestSelection = computedSelections
      .slice()
      .sort((a, b) => a.completionPercent - b.completionPercent || b.missing - a.missing)[0] || null;

    const sortedSelections = computedSelections
      .slice()
      .sort((a, b) => b.completionPercent - a.completionPercent || a.missing - b.missing || a.name.localeCompare(b.name));

    return {
      uniqueOwned,
      totalDuplicates,
      missingCount,
      completionPercent,
      mostRepeated,
      topRepeated,
      easiestToClose,
      hardestSelection,
      sortedSelections
    };
  }, [inventory]);

  const repeatedLabel = metrics.mostRepeated ? getStickerNameAndTeam(metrics.mostRepeated.code) : null;

  return (
    <section aria-labelledby="stats_title" className="w-full px-4 lg:px-6 pb-8 py-4 lg:py-6">
      <div className="max-w-5xl mx-auto space-y-4 lg:space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-cyan-950 via-slate-950 to-indigo-950 p-5 text-white shadow-xl">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-cyan-300/20 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-indigo-300/20 blur-2xl" aria-hidden="true" />

          <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-200 font-black">Estadísticas</p>
          <h2 id="stats_title" className="mt-2 text-2xl lg:text-3xl font-black tracking-tight">Tu radar del álbum</h2>
          <p className="mt-2 text-sm text-slate-200 max-w-2xl">
            Seguimiento por selección, repes dominantes y focos de cierre para llegar al 100% más rápido.
          </p>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5" role="list" aria-label="Resumen general de avance">
            <article className="rounded-2xl border border-white/15 bg-white/10 p-3" role="listitem">
              <p className="text-[10px] uppercase tracking-widest text-cyan-100 font-black">Avance total</p>
              <p className="mt-1 text-2xl font-black leading-none">{metrics.completionPercent}%</p>
              <p className="mt-1 text-[11px] text-cyan-50/90">{metrics.uniqueOwned} / {TOTAL_STICKER_COUNT}</p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-white/10 p-3" role="listitem">
              <p className="text-[10px] uppercase tracking-widest text-cyan-100 font-black">Faltantes</p>
              <p className="mt-1 text-2xl font-black leading-none">{metrics.missingCount}</p>
              <p className="mt-1 text-[11px] text-cyan-50/90">Para completar el álbum</p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-white/10 p-3" role="listitem">
              <p className="text-[10px] uppercase tracking-widest text-cyan-100 font-black">Repes totales</p>
              <p className="mt-1 text-2xl font-black leading-none">{metrics.totalDuplicates}</p>
              <p className="mt-1 text-[11px] text-cyan-50/90">Capital de canje</p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-white/10 p-3" role="listitem">
              <p className="text-[10px] uppercase tracking-widest text-cyan-100 font-black">Selecciones</p>
              <p className="mt-1 text-2xl font-black leading-none">{metrics.sortedSelections.length}</p>
              <p className="mt-1 text-[11px] text-cyan-50/90">FWC + Coca-Cola incluidas</p>
            </article>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <article className="rounded-[1.6rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-sm">
            <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-amber-700 font-black">
              <Sticker className="w-3.5 h-3.5" aria-hidden="true" />
              Más repetida
            </p>
            {metrics.mostRepeated && repeatedLabel ? (
              <>
                <p className="mt-2 text-xl font-black text-slate-900 leading-tight">{metrics.mostRepeated.code}</p>
                <p className="text-xs text-slate-600 mt-0.5">{repeatedLabel.name}</p>
                <p className="mt-2 text-sm text-slate-700">
                  La tenés <strong>{metrics.mostRepeated.total}</strong> veces ({metrics.mostRepeated.repeats} repes).
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Todavía no hay repes registradas. Cuando aparezcan, las vas a ver acá.</p>
            )}
          </article>

          <article className="rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-lime-50 to-green-50 p-4 shadow-sm">
            <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-700 font-black">
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              Más cerca de cerrar
            </p>
            {metrics.easiestToClose ? (
              <>
                <p className="mt-2 text-xl font-black text-slate-900 leading-tight inline-flex items-center gap-2">
                  <FlagIcon emoji={metrics.easiestToClose.flag} label={metrics.easiestToClose.name} className="w-5 h-5" />
                  <span>{metrics.easiestToClose.name}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {metrics.easiestToClose.completionPercent}% y solo <strong>{metrics.easiestToClose.missing}</strong> faltantes.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Ya completaste todas las selecciones. Tremendo cierre.</p>
            )}
          </article>

          <article className="rounded-[1.6rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 p-4 shadow-sm">
            <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-sky-700 font-black">
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              Mayor atraso
            </p>
            {metrics.hardestSelection ? (
              <>
                <p className="mt-2 text-xl font-black text-slate-900 leading-tight inline-flex items-center gap-2">
                  <FlagIcon emoji={metrics.hardestSelection.flag} label={metrics.hardestSelection.name} className="w-5 h-5" />
                  <span>{metrics.hardestSelection.name}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {metrics.hardestSelection.completionPercent}% y <strong>{metrics.hardestSelection.missing}</strong> por conseguir.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Sin datos suficientes para calcular este indicador.</p>
            )}
          </article>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 lg:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm lg:text-base font-black tracking-tight text-slate-900 inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" aria-hidden="true" />
              Avance por selección
            </h3>
          </div>

          <div className="mt-3 space-y-2" role="list" aria-label="Listado de avance por selección">
            {metrics.sortedSelections.map((selection) => (
              <article
                key={selection.code}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                role="listitem"
                aria-label={`${selection.name} ${selection.completionPercent}% completado`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      <span className="inline-flex items-center gap-1.5">
                        <FlagIcon emoji={selection.flag} label={selection.name} className="w-4 h-4" />
                        <span>{selection.name}</span>
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selection.owned}/{selection.total} | faltan {selection.missing} | repes {selection.duplicates}
                    </p>
                  </div>
                  <p className="text-sm font-black text-cyan-700 flex-shrink-0">{selection.completionPercent}%</p>
                </div>

                <div
                  className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label={`Progreso de ${selection.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={selection.completionPercent}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 transition-[width] duration-500"
                    style={{ width: `${selection.completionPercent}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />
            Top repes para publicar
          </h3>
          {metrics.topRepeated.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {metrics.topRepeated.map((entry) => {
                const details = getStickerNameAndTeam(entry.code);
                return (
                  <li key={entry.code} className="rounded-xl border border-violet-100 bg-white/90 px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{entry.code} · {details.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{details.team}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                      x{entry.repeats}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Todavía no hay repes para rankear. Cargá paquetes y volvemos a medir.</p>
          )}
        </div>
      </div>
    </section>
  );
};
