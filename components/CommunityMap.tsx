'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IncidentReport, ShelterData } from '@/lib/types';
import { AlertOctagon, HelpCircle, Shield, Plus, Loader2 } from 'lucide-react';

// Reset Default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface CommunityMapProps {
  userLat: number;
  userLng: number;
  shelters: ShelterData[];
  reports: IncidentReport[];
  onSubmitReport: (type: string, description: string, lat: number, lng: number, photoUrl?: string) => Promise<void>;
}

// Map Controller to fly to coordinates when updated
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

// Map Click Listener to create new report markers
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CommunityMap({ userLat, userLng, shelters, reports, onSubmitReport }: CommunityMapProps) {
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reportType, setReportType] = useState('flood');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds the 2MB limit');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data
          })
        });

        if (res.ok) {
          const data = await res.json();
          setPhotoUrl(data.url);
        } else {
          const err = await res.json();
          alert(`Upload failed: ${err.error || 'Unknown error'}`);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setMapTheme(isDark ? 'dark' : 'light');
    }

    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMapTheme(isDark ? 'dark' : 'light');
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  // Custom DivIcons utilizing Tailwind styles
  const createUserIcon = () => L.divIcon({
    className: 'relative flex items-center justify-center w-8 h-8',
    html: `
      <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
      <span class="relative rounded-full h-4 w-4 bg-indigo-500 border-2 border-white shadow-md"></span>
    `,
    iconSize: [32, 32]
  });

  const createShelterIcon = () => L.divIcon({
    className: 'relative flex items-center justify-center w-8 h-8 bg-emerald-500 border border-white rounded-full shadow-lg text-white',
    html: `<div class="flex items-center justify-center h-full w-full text-xs">🏠</div>`,
    iconSize: [28, 28]
  });

  const createHospitalIcon = () => L.divIcon({
    className: 'relative flex items-center justify-center w-8 h-8 bg-rose-500 border border-white rounded-full shadow-lg text-white',
    html: `<div class="flex items-center justify-center h-full w-full text-xs">🏥</div>`,
    iconSize: [28, 28]
  });

  const createIncidentIcon = (type: string) => {
    let color = 'bg-amber-500';
    let icon = '⚠️';
    if (type === 'flood') {
      color = 'bg-blue-600';
      icon = '💧';
    } else if (type === 'road-block') {
      color = 'bg-orange-500';
      icon = '🚫';
    } else if (type === 'power-cut') {
      color = 'bg-yellow-500';
      icon = '⚡';
    } else if (type === 'medical') {
      color = 'bg-red-600';
      icon = '🚨';
    }

    return L.divIcon({
      className: `relative flex items-center justify-center w-8 h-8 ${color} border-2 border-white rounded-xl shadow-lg text-white animate-bounce`,
      html: `<div class="flex items-center justify-center h-full w-full text-sm">${icon}</div>`,
      iconSize: [30, 30]
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickCoords({ lat, lng });
    setDescription('');
    setPhotoUrl('');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickCoords || !description.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitReport(reportType, description, clickCoords.lat, clickCoords.lng, photoUrl || undefined);
      setClickCoords(null);
      setDescription('');
      setPhotoUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950">
      <MapContainer
        center={[userLat, userLng]}
        zoom={14}
        className="w-full h-full z-10"
        style={{ background: '#09090b' }}
      >
        <ChangeView center={[userLat, userLng]} />
        <MapClickHandler onMapClick={handleMapClick} />
        
        {/* CartoDB tiles matching the active theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={mapTheme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />

        {/* User Marker */}
        <Marker position={[userLat, userLng]} icon={createUserIcon()}>
          <Popup className="custom-popup">
            <div className="p-2 text-zinc-900 text-xs font-semibold">
              You are here
            </div>
          </Popup>
        </Marker>

        {/* Shelter Markers */}
        {shelters.map((shelter, idx) => (
          <Marker
            key={`shelter-${idx}`}
            position={[shelter.lat, shelter.lng]}
            icon={shelter.type === 'hospital' ? createHospitalIcon() : createShelterIcon()}
          >
            <Popup>
              <div className="p-2 text-zinc-900">
                <p className="font-bold text-sm flex items-center gap-1">
                  {shelter.type === 'hospital' ? '🏥' : '🏠'} {shelter.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{shelter.address}</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1">Distance: {shelter.distanceKm} km</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Report Markers */}
        {reports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={[report.lat, report.lng]}
            icon={createIncidentIcon(report.type)}
          >
            <Popup>
              <div className="p-2 text-zinc-900 max-w-xs">
                <p className="font-bold text-sm capitalize flex items-center gap-1.5">
                  {report.type === 'flood' ? '💧 Flooding' : 
                   report.type === 'road-block' ? '🚫 Road Blocked' :
                   report.type === 'power-cut' ? '⚡ Power Outage' :
                   report.type === 'medical' ? '🚨 Medical Emergency' : '⚠️ Alert'}
                </p>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{report.description}</p>
                {report.photoUrl && (
                  <img 
                    src={report.photoUrl} 
                    alt="User submitted incident photo" 
                    className="w-full h-24 object-cover rounded-lg mt-2 border border-zinc-200" 
                  />
                )}
                <p className="text-[9px] text-zinc-400 mt-2 font-medium">
                  Reported {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Temporary click report marker */}
        {clickCoords && (
          <Marker position={[clickCoords.lat, clickCoords.lng]}>
            <Popup eventHandlers={{ remove: () => setClickCoords(null) }}>
              <div className="p-2 text-zinc-900 w-52">
                <p className="font-bold text-xs flex items-center gap-1 mb-1.5">
                  <Plus className="h-3.5 w-3.5 text-indigo-600" /> File Local Hazard Report
                </p>
                <form onSubmit={handleReportSubmit} className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full text-xs rounded border border-zinc-300 p-1"
                    >
                      <option value="flood">💧 Flooding</option>
                      <option value="road-block">🚫 Road Block</option>
                      <option value="power-cut">⚡ Power Outage</option>
                      <option value="tree-fallen">🌲 Tree Fallen</option>
                      <option value="medical">🚨 Medical Help</option>
                      <option value="other">⚠️ Other Hazard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. water is 2 feet deep..."
                      className="w-full text-xs rounded border border-zinc-300 p-1 h-12"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Attach Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="w-full text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                    />
                    {uploadingPhoto && <p className="text-[9px] text-indigo-500 mt-1 animate-pulse">Uploading...</p>}
                    {photoUrl && <p className="text-[9px] text-emerald-600 mt-1">✓ Photo attached</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1.5 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Submit Report'}
                  </button>
                </form>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map legend overlay */}
      <div className="absolute bottom-4 right-4 z-20 bg-zinc-950/90 border border-zinc-900 px-3 py-2.5 rounded-2xl backdrop-blur-md text-[10px] text-zinc-400 space-y-1.5 shadow-xl hidden sm:block">
        <p className="font-semibold text-zinc-200 mb-1 border-b border-zinc-900 pb-1">Map Legend</p>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block">🏠</span>
          <span>Emergency Shelter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block">🏥</span>
          <span>Emergency Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block">💧</span>
          <span>Flooded Roads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block">🚫</span>
          <span>Blocked Passages</span>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-20 bg-zinc-950/90 border border-zinc-900 px-3 py-1.5 rounded-2xl backdrop-blur-md text-[10px] text-zinc-300 font-medium shadow-md">
        💡 Click anywhere on the map to file a report.
      </div>
    </div>
  );
}
