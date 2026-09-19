import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getExactAddress } from '../utils/reverseGeocode';
import './LiveMap.css';

interface LiveMapProps {
  sessions: any[];
  selectedSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onBanIp?: (ip: string) => void;
}

type MapTheme = 'streets' | 'satellite' | 'cyber';

export function LiveMap({ sessions, selectedSessionId, onBanIp }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clickedMarkerRef = useRef<L.Marker | null>(null);

  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    return (localStorage.getItem('map_tile_theme') as MapTheme) || 'streets';
  });
  const [filter, setFilter] = useState<'all' | 'serverkey' | 'step1' | 'done'>('all');

  // Register global window helpers for popup buttons
  useEffect(() => {
    (window as any).__liveMapBanIp = (ip: string) => {
      if (onBanIp && ip) {
        onBanIp(ip);
      }
    };
    (window as any).__liveMapZoomMax = (lat: number, lon: number) => {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 19, { duration: 0.8 });
      }
    };
    return () => {
      delete (window as any).__liveMapBanIp;
      delete (window as any).__liveMapZoomMax;
    };
  }, [onBanIp]);

  // Function to apply tile layers
  const applyTileLayer = useCallback((map: L.Map, theme: MapTheme) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (theme === 'satellite') {
      // Google Satellite Hybrid (Real satellite imagery + Vietnamese streets/labels)
      const layer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=vi', {
        attribution: '&copy; Google Maps Vệ Tinh',
        maxZoom: 20
      });
      layer.addTo(map);
      tileLayerRef.current = layer;
    } else if (theme === 'streets') {
      // Google Maps Streets in Vietnamese (Full color, vibrant roads, blue water, green parks)
      const layer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi', {
        attribution: '&copy; Google Maps Đường Phố',
        maxZoom: 20
      });
      layer.addTo(map);
      tileLayerRef.current = layer;
    } else {
      // Cyber Dark Matter
      const layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19
      });
      layer.addTo(map);
      tileLayerRef.current = layer;
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center of Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [16.0544, 108.2022],
      zoom: 6,
      minZoom: 3,
      maxZoom: 20,
      zoomControl: true,
      scrollWheelZoom: true
    });

    applyTileLayer(map, mapTheme);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [applyTileLayer, mapTheme]);

  // Switch Map Theme
  const handleThemeChange = (newTheme: MapTheme) => {
    setMapTheme(newTheme);
    localStorage.setItem('map_tile_theme', newTheme);
    if (mapRef.current) {
      applyTileLayer(mapRef.current, newTheme);
    }
  };

  // Handle Click ANYWHERE on the map -> Instant pinpoint + reverse geocode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      const targetIcon = L.divIcon({
        className: 'cyber-map-pin pin-target',
        html: `
          <div class="cyber-pin-ripple"></div>
          <div class="cyber-pin-core">🎯</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const buildPopupContent = (addressText: string) => `
        <div class="map-popup-card">
          <span class="map-popup-badge" style="background: rgba(245, 158, 11, 0.25); color: #fbbf24; border: 1px solid #f59e0b;">
            🎯 VỊ TRÍ BẠN VỪA BẤM
          </span>
          <div class="map-popup-address">
            <strong>🏠 NƠI Ở / ĐỊA CHỈ CHI TIẾT:</strong>
            ${addressText}
          </div>
          <div class="map-popup-row">
            <span class="label">Tọa độ GPS:</span>
            <span class="val ip-val">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
          </div>
          <div class="map-popup-actions" style="flex-direction: column; gap: 5px;">
            <div style="display: flex; gap: 4px;">
              <a 
                href="https://www.google.com/maps/@${lat},${lng},19z/data=!3m1!1e3" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="map-popup-btn satellite"
                style="flex: 1;"
                title="Mở Google Maps ảnh vệ tinh xem rõ từng nóc nhà"
              >
                🛰️ Vệ Tinh Nóc Nhà ↗
              </a>
              <a 
                href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="map-popup-btn"
                style="flex: 1;"
                title="Xem mặt đường Google Street View"
              >
                🚶 Xem Mặt Đường ↗
              </a>
            </div>
            <button 
              type="button" 
              class="map-popup-btn zoom-btn"
              onclick="window.__liveMapZoomMax(${lat}, ${lng})"
            >
              🔍 Phóng to sát nóc nhà (Zoom x19)
            </button>
          </div>
        </div>
      `;

      if (!clickedMarkerRef.current) {
        clickedMarkerRef.current = L.marker([lat, lng], { icon: targetIcon }).addTo(map);
      } else {
        clickedMarkerRef.current.setLatLng([lat, lng]);
        clickedMarkerRef.current.setIcon(targetIcon);
      }

      // Open with immediate loading indicator
      clickedMarkerRef.current
        .bindPopup(buildPopupContent('⏳ Đang tra cứu số nhà & tên đường...'), { maxWidth: 300, closeButton: true })
        .openPopup();

      // Asynchronously resolve address
      const addr = await getExactAddress(lat, lng);
      if (clickedMarkerRef.current) {
        clickedMarkerRef.current.setPopupContent(buildPopupContent(addr));
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
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

      const buildUserPopupHtml = (addr?: string) => `
        <div class="map-popup-card">
          <span class="map-popup-badge ${badgeClass}">${badgeLabel}</span>
          ${s.isVpn ? `<div class="map-popup-vpn">🛡️ PHÁT HIỆN VPN / DATACENTER PROXY</div>` : ''}
          
          <div class="map-popup-address">
            <strong>🏠 NƠI Ở / ĐỊA CHỈ ƯỚC TÍNH:</strong>
            ${addr || s.location || (s.city ? `🇻🇳 ${s.city}, VN` : '🇻🇳 Việt Nam')}
          </div>

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
            <span class="val" style="font-family: monospace; font-size: 0.7rem; color: #a0aec0;">${s.lat?.toFixed(5)}, ${s.lon?.toFixed(5)}</span>
          </div>

          <div class="map-popup-actions" style="flex-direction: column; gap: 5px;">
            <div style="display: flex; gap: 4px;">
              <a 
                href="https://www.google.com/maps/@${s.lat},${s.lon},19z/data=!3m1!1e3" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="map-popup-btn satellite"
                style="flex: 1;"
                title="Mở ảnh vệ tinh Google Maps xem nóc nhà người này"
              >
                🛰️ Xem Nóc Nhà 3D ↗
              </a>
              <a 
                href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${s.lat},${s.lon}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="map-popup-btn"
                style="flex: 1;"
              >
                🚶 Mặt Đường ↗
              </a>
            </div>

            <div style="display: flex; gap: 4px;">
              <button 
                type="button" 
                class="map-popup-btn zoom-btn"
                onclick="window.__liveMapZoomMax(${s.lat}, ${s.lon})"
                style="flex: 1;"
              >
                🔍 Phóng to sát (Zoom 19)
              </button>
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
        </div>
      `;

      let marker = markersRef.current.get(s.id);
      if (!marker) {
        marker = L.marker([s.lat, s.lon], { icon: customIcon }).addTo(map);
        marker.bindPopup(buildUserPopupHtml(), { maxWidth: 300, closeButton: true });

        // When popup opens, asynchronously fetch exact street address
        marker.on('popupopen', async () => {
          const detailed = await getExactAddress(s.lat, s.lon);
          marker?.setPopupContent(buildUserPopupHtml(detailed));
        });

        markersRef.current.set(s.id, marker);
      } else {
        marker.setLatLng([s.lat, s.lon]);
        marker.setIcon(customIcon);
      }
    });
  }, [sessions, filter, onBanIp]);

  // Smooth Fly-To when a session is selected from table -> Zoom close into street & rooftop!
  useEffect(() => {
    if (!selectedSessionId || !mapRef.current) return;
    const targetSession = sessions.find((s) => s.id === selectedSessionId);
    if (targetSession && typeof targetSession.lat === 'number' && typeof targetSession.lon === 'number') {
      // Zoom 17 for building & rooftop level precision
      mapRef.current.flyTo([targetSession.lat, targetSession.lon], 17, { duration: 1.2 });
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
          <span>BẢN ĐỒ ĐỊNH VỊ THỜI GIAN THỰC (BẤM ĐÂU XEM ĐÓ)</span>
        </div>

        {/* Map Layer Switcher: Colorful Streets / Satellite Roof / Cyber Dark */}
        <div className="map-theme-switcher">
          <button
            type="button"
            className={`map-theme-btn ${mapTheme === 'streets' ? 'active' : ''}`}
            onClick={() => handleThemeChange('streets')}
            title="Bản đồ đường phố đầy đủ màu sắc, rõ nét tên đường tiếng Việt"
          >
            🗺️ Bản Đồ Màu Sắc
          </button>
          <button
            type="button"
            className={`map-theme-btn ${mapTheme === 'satellite' ? 'active' : ''}`}
            onClick={() => handleThemeChange('satellite')}
            title="Ảnh chụp vệ tinh thật (Xem rõ từng nóc nhà, sân vườn, ngõ phố)"
          >
            🛰️ Vệ Tinh (Xem Nóc Nhà)
          </button>
          <button
            type="button"
            className={`map-theme-btn ${mapTheme === 'cyber' ? 'active' : ''}`}
            onClick={() => handleThemeChange('cyber')}
            title="Giao diện Cyber Neon Dark"
          >
            🌌 Cyber Tối
          </button>
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
            🚀 ServerKey ({countServerKey})
          </button>
          <button
            type="button"
            className={`map-filter-btn ${filter === 'step1' ? 'active' : ''}`}
            onClick={() => setFilter('step1')}
          >
            🟡 Vượt link ({countStep1})
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
            title="Xem toàn cảnh Việt Nam"
          >
            🎯 Toàn cảnh VN
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="map-container" style={{ cursor: 'crosshair' }} />

      <div style={{
        padding: '0.45rem 1rem',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(0, 240, 255, 0.15)',
        fontSize: '0.72rem',
        color: 'rgba(255, 255, 255, 0.65)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          💡 <strong>Mẹo xem nơi ở:</strong> Bạn có thể <span style={{ color: '#00f0ff' }}>click vào bất kỳ điểm nào trên bản đồ</span> hoặc bấm <span style={{ color: '#00f0ff' }}>"📍 Radar"</span> trong bảng để phóng to sát nóc nhà và xem địa chỉ chi tiết!
        </div>
        <div style={{ color: '#10b981', fontWeight: 600 }}>
          {mapTheme === 'satellite' ? '🛰️ Đang bật: Vệ Tinh Trực Quan' : mapTheme === 'streets' ? '🗺️ Đang bật: Đường Phố Màu Sắc' : '🌌 Đang bật: Cyber Tối'}
        </div>
      </div>
    </div>
  );
}
