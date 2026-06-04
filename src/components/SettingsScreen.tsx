/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Check, MapPin, UserRoundPen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALLOWED_SEARCH_RADII_KM, getProfileDisplayName } from '../utils/userProfile';

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsBootstrapPromise: Promise<void> | null = null;

const bootstrapGoogleMaps = (): Promise<void> => {
  if (window.google?.maps?.importLibrary || window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }

  if (googleMapsBootstrapPromise) {
    return googleMapsBootstrapPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key'));
  }

  googleMapsBootstrapPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-places-script') as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.google?.maps?.importLibrary || window.google?.maps?.places?.Autocomplete) {
        resolve();
      } else {
        reject(new Error('Google Maps cargó, pero Places Autocomplete no está disponible'));
      }
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-places-script';
    script.async = true;
    script.defer = true;
    // Keep classic places library enabled so we work both with and without importLibrary().
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=es&region=AR&v=weekly`;
    script.onload = handleLoad;
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps. Revisá que la API key tenga Places API habilitada y sin restricciones de dominio que bloqueen repeclub.digital'));
    document.head.appendChild(script);
  });

  return googleMapsBootstrapPromise;
};

const loadPlacesLibrary = async (): Promise<any> => {
  await bootstrapGoogleMaps();
  if (window.google?.maps?.importLibrary) {
    return window.google.maps.importLibrary('places');
  }
  return { Autocomplete: window.google?.maps?.places?.Autocomplete };
};

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateUserSettings } = useApp();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const placeElementHostRef = useRef<HTMLDivElement>(null);
  const placeElementRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);
  const [placeMeta, setPlaceMeta] = useState<{ placeId: string | null; lat: number | null; lng: number | null }>({
    placeId: null,
    lat: null,
    lng: null
  });
  const [isPlacesReady, setIsPlacesReady] = useState(false);
  const [usingNewPlacesElement, setUsingNewPlacesElement] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    setNickname(currentUser.nickname || currentUser.name);
    setLocation(currentUser.location || '');
    setSearchRadiusKm(currentUser.searchRadiusKm || 5);
    setPlaceMeta({
      placeId: currentUser.locationPlaceId ?? null,
      lat: typeof currentUser.locationLat === 'number' ? currentUser.locationLat : null,
      lng: typeof currentUser.locationLng === 'number' ? currentUser.locationLng : null
    });
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    let placeChangedListener: { remove?: () => void } | null = null;
    let legacyInputListener: ((event: Event) => void) | null = null;
    let newElementSelectListener: ((event: Event) => void) | null = null;
    let newElementInputListener: ((event: Event) => void) | null = null;
    let mountedPlaceElement: any = null;

    loadPlacesLibrary()
      .then((placesLib) => {
        if (!isMounted) {
          return;
        }

        const PlaceAutocompleteElementCtor =
          placesLib?.PlaceAutocompleteElement || window.google?.maps?.places?.PlaceAutocompleteElement;

        if (PlaceAutocompleteElementCtor && placeElementHostRef.current) {
          const placeElement = new PlaceAutocompleteElementCtor();
          mountedPlaceElement = placeElement;
          placeElementRef.current = placeElement;
          placeElement.setAttribute('aria-label', 'Buscar localidad');
          placeElement.setAttribute('placeholder', 'Buscá tu ciudad');
          placeElement.style.width = '100%';

          if (location.trim()) {
            placeElement.value = location;
          }

          newElementInputListener = (event: Event) => {
            const target = event.target as HTMLInputElement | null;
            if (!target) return;
            setLocation(target.value || '');
            setPlaceMeta({ placeId: null, lat: null, lng: null });
          };

          const onPlacePicked = async (event: Event) => {
            const anyEvent = event as any;
            const prediction = anyEvent?.placePrediction || anyEvent?.detail?.placePrediction;
            if (!prediction?.toPlace) return;

            const place = prediction.toPlace();
            try {
              await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] });
            } catch (error) {
              console.error('[Places] Failed fetching selected place fields:', error);
            }

            const lat = place?.location?.lat?.();
            const lng = place?.location?.lng?.();
            setLocation(place?.displayName || place?.formattedAddress || '');
            setPlaceMeta({
              placeId: place?.id || null,
              lat: typeof lat === 'number' ? lat : null,
              lng: typeof lng === 'number' ? lng : null
            });
          };

          newElementSelectListener = onPlacePicked;

          // Event names vary by rollout/channel; we listen to both.
          placeElement.addEventListener('gmp-select', onPlacePicked);
          placeElement.addEventListener('gmp-placeselect', onPlacePicked);
          placeElement.addEventListener('input', newElementInputListener);

          placeElementHostRef.current.innerHTML = '';
          placeElementHostRef.current.appendChild(placeElement);

          setUsingNewPlacesElement(true);
          setPlacesError(null);
          setIsPlacesReady(true);
          return;
        }

        if (!locationInputRef.current) {
          setIsPlacesReady(false);
          setPlacesError('No se pudo inicializar el campo de localidad.');
          return;
        }

        const AutocompleteCtor =
          placesLib?.Autocomplete || window.google?.maps?.places?.Autocomplete;

        if (!AutocompleteCtor) {
          console.error('[Places] Autocomplete class not found after loading. placesLib keys:', Object.keys(placesLib || {}));
          setIsPlacesReady(false);
          setPlacesError('Google Maps cargó pero no encontró el componente de autocompletado.');
          return;
        }

        const autocomplete = new AutocompleteCtor(locationInputRef.current, {
          types: ['(cities)'],
          fields: ['place_id', 'name', 'formatted_address', 'geometry']
        });

        legacyInputListener = (event: Event) => {
          const target = event.target as HTMLInputElement | null;
          if (!target) return;
          setLocation(target.value || '');
          setPlaceMeta({ placeId: null, lat: null, lng: null });
        };
        locationInputRef.current.addEventListener('input', legacyInputListener);

        placeChangedListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const lat = place?.geometry?.location?.lat?.();
          const lng = place?.geometry?.location?.lng?.();

          setLocation(place?.name || place?.formatted_address || locationInputRef.current?.value || '');
          setPlaceMeta({
            placeId: place?.place_id || null,
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null
          });
        });

        autocompleteRef.current = autocomplete;
        setUsingNewPlacesElement(false);
        setPlacesError(null);
        setIsPlacesReady(true);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Error desconocido cargando Google Maps';
        console.error('[Places] Load error:', message);
        setIsPlacesReady(false);
        setPlacesError(message);
      });

    return () => {
      isMounted = false;
      placeChangedListener?.remove?.();
      if (locationInputRef.current && legacyInputListener) {
        locationInputRef.current.removeEventListener('input', legacyInputListener);
      }
      if (mountedPlaceElement && newElementSelectListener) {
        mountedPlaceElement.removeEventListener('gmp-select', newElementSelectListener);
        mountedPlaceElement.removeEventListener('gmp-placeselect', newElementSelectListener);
      }
      if (mountedPlaceElement && newElementInputListener) {
        mountedPlaceElement.removeEventListener('input', newElementInputListener);
      }
      if (placeElementHostRef.current) {
        placeElementHostRef.current.innerHTML = '';
      }
      placeElementRef.current = null;
      autocompleteRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!usingNewPlacesElement || !placeElementRef.current) return;
    if (typeof placeElementRef.current.value === 'string' && placeElementRef.current.value !== location) {
      placeElementRef.current.value = location;
    }
  }, [location, usingNewPlacesElement]);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await updateUserSettings({
      nickname: nickname.trim() || currentUser.name,
      location: location.trim(),
      locationPlaceId: placeMeta.placeId,
      locationLat: placeMeta.lat,
      locationLng: placeMeta.lng,
      searchRadiusKm
    });

    setFeedback('Configuración guardada');
    setIsSaving(false);
    window.setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <section aria-labelledby="settings-title" className="w-full px-4 lg:px-6 pb-8 py-4 lg:py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white rounded-[2rem] p-5 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-5 opacity-10 text-7xl select-none rotate-12">⚙️</div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-sky-200 font-black">Configuración</p>
          <h2 id="settings-title" className="text-2xl font-black tracking-tight mt-2">Perfil y preferencias</h2>
          <p className="text-sm text-slate-300 mt-2 max-w-xl">Ajustá cómo te ven y qué tan lejos querés ver canjes.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <UserRoundPen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Tu nombre visible</p>
                <p className="text-[11px] text-slate-500">El nickname se muestra en canjes y contactos.</p>
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nickname</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={currentUser.name}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </label>
          </div>

          <div className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Zona y distancia</p>
                <p className="text-[11px] text-slate-500">Mostrá canjes dentro del radio que elijas.</p>
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localidad</span>
              {usingNewPlacesElement ? (
                <div
                  ref={placeElementHostRef}
                  className="mt-1 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500"
                />
              ) : (
                <input
                  ref={locationInputRef}
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPlaceMeta({ placeId: null, lat: null, lng: null });
                  }}
                  placeholder={isPlacesReady ? 'Buscá tu ciudad' : 'Escribí tu localidad'}
                  autoComplete="off"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              )}
            </label>
            {placesError ? (
              <p className="text-[10px] text-red-600 font-semibold">
                ⚠️ {placesError}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">
                {isPlacesReady
                  ? '🗺️ Autocompletado activo — buscá y seleccioná tu ciudad.'
                  : 'Cargando autocompletado de ciudades...'}
              </p>
            )}

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radio de canjes</span>
              <select
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                {ALLOWED_SEARCH_RADII_KM.map((radius) => (
                  <option key={radius} value={radius}>{radius} km</option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-[1.5rem] p-4 text-xs text-sky-950 leading-relaxed">
            <strong className="block mb-1">Vista previa</strong>
            Te van a ver como <strong>{getProfileDisplayName(currentUser)}</strong> y vas a ver canjes dentro de <strong>{searchRadiusKm} km</strong>.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-white font-black text-sm shadow-lg shadow-sky-200 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-70"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar configuración'}
            </button>
            {feedback && <span className="text-[11px] font-semibold text-emerald-700">{feedback}</span>}
          </div>
        </form>
      </div>
    </section>
  );
};
