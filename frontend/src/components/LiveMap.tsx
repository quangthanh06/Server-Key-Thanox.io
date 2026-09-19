import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';

interface LiveMapProps {
  sessions: any[];
  selectedSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onBanIp?: (ip: string) => void;
}

export function LiveMap({ sessions, selectedSessionId, onBanIp }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [filter, setFilter] = useState<'all' | 'serverkey' | 'step1' | 'done'>('all');

  // Register global window helper for popup ban button
  useEffect(() => {
    (window as any).__liveMapBanIp = (ip: string) => {
      if (onBanIp && ip) {
        onBanIp(ip);
      }
    };
    return () => {
      delete (window as any).__liveMapBanIp;
    };
  }, [onBanIp]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center of Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [16.0544, 108.2022],
      zoom: 6,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Dark Matter tile layer by CartoDB (High-performance dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers when sessions or filter change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Filter sessions
    const validSessions = sessions.filter((s) => {
      const hasCoords = typeof s.lat === 'number' && typeof s.lon === 'number';
      if (!hasCoords) return false;

      const isStep2 = s.step === 'step2' || s.status === 'step2_pending';
      const isStep1 = s.step === 'step1' || s.step === 'step1_done' || s.status === 'step1_pending';
      const isDone = s.step === 'completed' || s.status === 'key_ready';

      if (filter === 'serverkey') return isStep2;
      if (filter === 'step1') return isStep1;
      if (filter === 'done') return isDone;
      return true;
    });

    // Remove old markers that no longer exist
    const currentIds = new Set(validSessions.map((s) => s.id));
    for (const [id, marker] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add or update markers
    validSessions.forEach((s) => {
      const isStep2 = s.step === 'step2' || s.status === 'step2_pending';
      const isDone = s.step === 'completed' || s.status === 'key_ready';
      const isStep1 = s.step === 'step1' || s.step === 'step1_done' || s.status === 'step1_pending';
      const isBlocked = s.badgeClass === 'blocked' || s.statusLabel?.includes('BANNED') || s.statusLabel?.includes('CẤM');

      let pinTypeClass = 'pin-visited';
      let iconSymbol = '📱';
      let badgeLabel = '⚡ Mới vào web';
      let badgeClass = 'visited';

      if (isBlocked) {
        pinTypeClass = 'pin-blocked';
        iconSymbol = '🚫';
        badgeLabel = '🚫 ĐÃ BỊ CẤM (BANNED)';
        badgeClass = 'blocked';
      } else if (isStep2) {
        pinTypeClass = 'pin-serverkey';
        iconSymbol = '🚀';
        badgeLabel = '🚀 ĐANG Ở SERVERKEY';
        badgeClass = 'serverkey';
      } else if (isDone) {
        pinTypeClass = 'pin-done';
        iconSymbol = '✅';
        badgeLabel = '✅ ĐÃ LẤY KEY';
        badgeClass = 'done';
      } else if (isStep1) {
        pinTypeClass = 'pin-step1';
        iconSymbol = '🟡';
        badgeLabel = '🟡 ĐANG VƯỢT LINK';
        badgeClass = 'step1';
      }

      const customIcon = L.divIcon({
        className: `cyber-map-pin ${pinTypeClass}`,
        html: `
          <div class="cyber-pin-ripple"></div>
          <div class="cyber-pin-core">${iconSymbol}</div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const popupHtml = `
        <div class="map-popup-card">
          <span class="map-popup-badge ${badgeClass}">${badgeLabel}</span>
          ${s.isVpn ? `<div class="map-popup-vpn">🛡️ PHÁT HIỆN VPN / DATACENTER PROXY</div>` : ''}
          <div class="map-popup-location">${s.location || (s.city ? `🇻🇳 ${s.city}, VN` : '🇻🇳 Việt Nam')}</div>
          <div class="map-popup-row">
            <span class="label">IP:</span>
            <span class="val ip-val">${s.ip || '127.0.0.1'}</span>
          </div>
          ${s.isp ? `
          <div class="map-popup-row">
            <span class="label">Mạng:</span>
            <span class="val">🏢 ${s.isp}</span>
          </div>` : ''}
          <div class="map-popup-row">
            <span class="label">Thiết bị:</span>
            <span class="val">${s.deviceIcon || '📱'} ${s.device || 'Thiết bị di động'} (${s.os || 'Web'})</span>
          </div>
          <div class="map-popup-row">
            <span class="label">Tọa độ:</span>
            <span class="val" style="font-family: monospace; font-size: 0.7rem; color: #a0aec0;">${s.lat?.toFixed(4)}, ${s.lon?.toFixed(4)}</span>
          </div>
          <div class="map-popup-actions">
            <a 
              href="https://www.google.com/maps?q=${s.lat},${s.lon}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="map-popup-btn"
            >
              🌍 Google Maps ↗
            </a>
            ${onBanIp && s.ip ? `
            <button 
              type="button" 
              class="map-popup-ban-btn"
              onclick="window.__liveMapBanIp('${s.ip}')"
            >
              🚫 Cấm IP
            </button>` : ''}
          </div>
        </div>
      `;

      let marker = markersRef.current.get(s.id);
      if (!marker) {
        marker = L.marker([s.lat, s.lon], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupHtml, { maxWidth: 280, closeButton: false });
        markersRef.current.set(s.id, marker);
      } else {
        marker.setLatLng([s.lat, s.lon]);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      }
    });
  }, [sessions, filter, onBanIp]);

  // Smooth Fly-To when a session is selected from table
  useEffect(() => {
    if (!selectedSessionId || !mapRef.current) return;
    const targetSession = sessions.find((s) => s.id === selectedSessionId);
    if (targetSession && typeof targetSession.lat === 'number' && typeof targetSession.lon === 'number') {
      mapRef.current.flyTo([targetSession.lat, targetSession.lon], 13, { duration: 1.2 });
      const marker = markersRef.current.get(selectedSessionId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 1300);
      }
    }
  }, [selectedSessionId, sessions]);

  // Reset View to whole Vietnam
  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([16.0544, 108.2022], 6, { duration: 1 });
  };

  const countServerKey = sessions.filter((s) => s.step === 'step2' || s.status === 'step2_pending').length;
  const countStep1 = sessions.filter((s) => s.step === 'step1' || s.step === 'step1_done' || s.status === 'step1_pending').length;
  const countDone = sessions.filter((s) => s.step === 'completed' || s.status === 'key_ready').length;

  return (
    <div className="live-map-wrapper">
      <div className="live-map-header">
        <div className="live-map-title">
          <span className="tag">// RADAR GPS</span>
          <span>BẢN ĐỒ ĐỊNH VỊ NGƯỜI DÙNG REAL-TIME</span>
        </div>

        <div className="live-map-filters">
          <button
            type="button"
            className={`map-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({sessions.length})
          </button>
          <button
            type="button"
            className={`map-filter-btn serverkey ${filter === 'serverkey' ? 'active' : ''}`}
            onClick={() => setFilter('serverkey')}
          >
            🚀 Đang ở ServerKey ({countServerKey})
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filter === 'step1' ? 'active' : ''}`}
            onClick={() => setFilter('step1')}
          >
            🟡 Đang vượt link ({countStep1})
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filter === 'done' ? 'active' : ''}`}
            onClick={() => setFilter('done')}
          >
            ✅ Đã nhận Key ({countDone})
          </button>
          <button
            type="button"
            className="map-filter-btn"
            onClick={handleResetView}
            title="Xem toàn bộ Việt Nam"
          >
            🎯 Toàn cảnh VN
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}
