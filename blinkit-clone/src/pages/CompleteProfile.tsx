import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Save, AlertCircle, MapPin, Search, Compass } from 'lucide-react';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { saveAddress } = useAuth();

  // Load state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Address fields
  const [houseNumber, setHouseNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [label, setLabel] = useState('Home'); // Home, Work, Other
  const [isDefault, setIsDefault] = useState(true);

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet dynamically on mount
  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletReady(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletReady(true);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const defaultLat = 28.6139; // Noida/Delhi coordinates
    const defaultLng = 77.2090;

    const initialLat = lat || defaultLat;
    const initialLng = lng || defaultLng;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true
    }).addTo(map);

    // Marker drag end handler
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
      await handleReverseGeocode(position.lat, position.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Load initial reverse geocode if coordinates are empty
    if (!lat || !lng) {
      setLat(defaultLat);
      setLng(defaultLng);
      handleReverseGeocode(defaultLat, defaultLng);
    }

    return () => {
      map.remove();
    };
  }, [leafletReady]);

  // Places Autocomplete search (OpenStreetMap Nominatim)
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching autocomplete suggestions:', err);
    }
  };

  // Select place from autocomplete
  const handleSelectSuggestion = (place: any) => {
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);

    setLat(latitude);
    setLng(longitude);
    setSearchQuery(place.display_name);
    setSuggestions([]);
    setShowSuggestions(false);

    // Center map
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([latitude, longitude], 15);
      markerRef.current.setLatLng([latitude, longitude]);
    }

    // Populate address details
    const address = place.address || {};
    setStreet(address.road || address.suburb || '');
    setArea(place.display_name.split(',')[0] || address.suburb || '');
    setCity(address.city || address.town || address.village || '');
    setState(address.state || '');
    setPincode(address.postcode || '');

    // Deep lookup detail fields
    handleReverseGeocode(latitude, longitude);
  };

  // Reverse Geocoding
  const handleReverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};

        setStreet(address.road || address.suburb || '');
        setArea(address.neighbourhood || address.suburb || address.residential || data.name || '');
        setCity(address.city || address.town || address.village || '');
        setState(address.state || '');
        setPincode(address.postcode || '');
        setSearchQuery(data.display_name);
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  };

  // Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        await handleReverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setError('Failed to retrieve location. Please check browser permissions.');
      }
    );
  };

  const isFormValid = 
    houseNumber.trim().length > 0 &&
    buildingName.trim().length > 0 &&
    street.trim().length > 0 &&
    area.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    /^\d{6}$/.test(pincode);

  // Submit address details
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill in all required fields and enter a valid 6-digit pincode.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await saveAddress({
        house_flat_number: houseNumber,
        building_name: buildingName,
        street,
        landmark: landmark || undefined,
        area,
        city,
        state,
        pincode,
        latitude: lat,
        longitude: lng,
        label,
        is_default: isDefault
      });

      // Route to main application on success
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save address coordinates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4 py-8">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-lg bg-white shadow-2xl relative flex flex-col justify-between border border-neutral-200 md:rounded-3xl p-6 overflow-hidden min-h-[650px]">
        
        {/* Top Header */}
        <div className="flex items-center space-x-2 pb-4 border-b border-neutral-100 flex-shrink-0 text-left">
          <MapPin className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-black text-neutral-800">Complete Delivery Profile</span>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col justify-start pt-4 space-y-4 text-left overflow-y-auto max-h-[500px] pr-1">
          
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-neutral-800 tracking-tight">Configure Delivery Address</h2>
            <p className="text-xs text-neutral-500 font-semibold">
              The user cannot place orders until at least one delivery address is saved.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Autocomplete Search input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-450" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search Landmark, Area, or Location..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(place)}
                    className="w-full text-left px-4 py-2.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-none"
                  >
                    {place.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map Box */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                Drag Pin to Fine-Tune Position
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center space-x-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Use Current Location</span>
              </button>
            </div>
            
            <div 
              ref={mapContainerRef} 
              className="w-full h-36 bg-neutral-100 border border-neutral-200 rounded-xl shadow-sm overflow-hidden z-10"
            />
          </div>

          {/* Details Form fields */}
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-2">
            
            {/* Grid 1: House Number & Building Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  House / Flat No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. Flat 104"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  Building Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. Paras Tiara"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Grid 2: Street & Landmark */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  Street <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Sector 137 Road"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Metro Station"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Grid 3: Area & City */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Sector 137"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Noida"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Grid 4: State & Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase block">
                  Pincode (6 digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="e.g. 201305"
                  className={`w-full bg-neutral-50 border rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none ${
                    pincode && pincode.length !== 6 
                      ? 'border-rose-450 focus:ring-1 focus:ring-rose-450' 
                      : 'border-neutral-200 focus:ring-1 focus:ring-yellow-400'
                  }`}
                />
              </div>
            </div>

            {/* Address Label selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[9px] font-black text-neutral-400 uppercase block">
                Save Address As
              </label>
              <div className="flex space-x-2">
                {['Home', 'Work', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setLabel(lbl)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      label === lbl
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Default address Checkbox */}
            <div className="flex items-center space-x-2.5 py-1">
              <input
                type="checkbox"
                id="isDefaultAddress"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="isDefaultAddress" className="text-xs font-bold text-neutral-600 select-none cursor-pointer">
                Set as default delivery address
              </label>
            </div>

            {/* Save CTA Button */}
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className={`w-full py-3 text-xs font-black rounded-xl shadow-md flex justify-center items-center space-x-2 uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${
                isFormValid && !saving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Address...' : 'Save & Complete Profile'}</span>
            </button>
          </form>
        </div>

        {/* Info footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 font-bold rounded-b-2xl mt-4">
          🔐 Coordinates & address securely saved in backend PostgreSQL database.
        </div>

      </div>
    </div>
  );
};
