"use client";

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Plane Icon for FlightRadar integration simulation
const planeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10],
});

const CITY_COORDS: Record<string, [number, number]> = {
  "Bogor": [-6.5944, 106.7892],
  "Jakarta Selatan": [-6.2615, 106.8106],
  "Jakarta": [-6.2088, 106.8456],
  "Depok": [-6.4025, 106.7942],
  "Bekasi": [-6.2349, 106.9924],
  "Tangerang": [-6.1702, 106.6403],
  "Bandung": [-6.9175, 107.6191],
  "Surabaya": [-7.2575, 112.7521],
};

// Simulated Active Flights (Sacred Logistics)
const ACTIVE_FLIGHTS = [
    { id: 'SV817', callsign: 'SAUDIA 817', from: 'CGK', to: 'JED', pos: [-5.12, 98.45], alt: '38,000ft', speed: '512kt', pilgrims: 45 },
    { id: 'GA980', callsign: 'GARUDA 980', from: 'CGK', to: 'JED', pos: [-2.45, 92.10], alt: '36,000ft', speed: '495kt', pilgrims: 112 },
    { id: 'JT080', callsign: 'LION 080', from: 'SUB', to: 'MED', pos: [-6.80, 102.30], alt: '37,000ft', speed: '505kt', pilgrims: 85 },
];

interface MapProps {
  leads: any[];
}

export default function IndonesiaHeatmap({ leads }: MapProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-full h-full bg-slate-100 animate-pulse" />;

  const cityStats = leads.reduce((acc: any, lead) => {
    const city = lead.city || "Jakarta";
    if (!acc[city]) acc[city] = { count: 0, quality: 0 };
    acc[city].count += 1;
    acc[city].quality += (lead.lead_score || 0);
    return acc;
  }, {});

  const markers = Object.entries(cityStats).map(([cityName, stats]: [string, any]) => {
    const coords = CITY_COORDS[cityName] || CITY_COORDS["Jakarta"];
    const avgQuality = stats.quality / (stats.count || 1);
    const percentage = ((stats.count / (leads.length || 1)) * 100).toFixed(1);
    
    return {
      name: cityName,
      position: coords,
      count: stats.count,
      percentage,
      quality: avgQuality.toFixed(0),
      radius: Math.min(Math.max(stats.count * 3, 10), 30),
    };
  });

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl">
        <MapContainer 
            center={[-6.2, 106.8]} 
            zoom={7} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Geo-Fencing Strategy Layers */}
            <Circle 
                center={CITY_COORDS["Bogor"]} 
                radius={20000} 
                pathOptions={{ dashArray: '10, 10', color: '#6366f1', fillColor: 'transparent', weight: 1 }} 
            />
            <Circle 
                center={CITY_COORDS["Jakarta"]} 
                radius={45000} 
                pathOptions={{ dashArray: '10, 10', color: '#10b981', fillColor: 'transparent', weight: 1 }} 
            />
            
            {/* Lead Density Layer */}
            {markers.map((marker, i) => (
                <CircleMarker 
                    key={`lead-${i}`}
                    center={marker.position}
                    radius={marker.radius}
                    pathOptions={{
                        fillColor: '#6366f1',
                        color: 'white',
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.5,
                    }}
                >
                    <Popup>
                        <div className="p-1 min-w-[120px]">
                            <h4 className="text-[11px] font-black text-brand-600 uppercase italic mb-1.5 border-b border-slate-100 pb-1">{marker.name}</h4>
                            <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Acquisition</span>
                                    <span className="text-[10px] font-black text-slate-900">{marker.count} Lead <span className="text-brand-500">({marker.percentage}%)</span></span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Sacred Radar Layer (Flights) */}
            {ACTIVE_FLIGHTS.map((flight, i) => (
                <Marker key={`flight-${i}`} position={flight.pos as [number, number]} icon={planeIcon}>
                    <Popup>
                        <div className="p-1 min-w-[160px]">
                            <div className="flex justify-between items-center mb-1.5 border-b border-orange-100 pb-1">
                                <h4 className="text-[11px] font-black text-orange-600 uppercase italic">{flight.id}</h4>
                                <span className="px-1.5 py-0.5 bg-brand-500 text-[8px] font-black text-white rounded">LIVE</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{flight.from} <span className="text-slate-400 mx-1">✈</span> {flight.to}</p>
                                <div className="flex justify-between text-[9px] text-slate-600 font-bold border-t border-slate-50 pt-1">
                                    <span>Altitude: {flight.alt}</span>
                                    <span className="text-orange-600 italic">{flight.speed}</span>
                                </div>
                                <div className="mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-black text-brand-600 mb-0.5">SACRED PAYLOAD</p>
                                    <p className="text-[10px] font-bold text-slate-800">{flight.pilgrims} Connected Pilgrims</p>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
        
        {/* Map Header Overlay */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
            <div className="bg-black/80 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                <h5 className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-1 italic">Integrated Command Center</h5>
                <p className="text-[10px] text-brand-400 font-bold uppercase tracking-tighter">Umrah & Hajj Operations Radar</p>
            </div>
            <div className="bg-emerald-600/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex items-center gap-3 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse w-fit">
                <span className="w-2 h-2 bg-white rounded-full relative"><span className="absolute inset-0 bg-white rounded-full animate-ping" /></span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">JED/MED Vectors Only</span>
            </div>
        </div>
    </div>
  );
}
