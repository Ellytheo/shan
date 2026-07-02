import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';

const API_URL = 'https://Shanvilla.pythonanywhere.com';

/* ── Fallback counts if API is unreachable ── */
const FALLBACK_AVAILABILITY = {
  1: 6, // Standard Single Room
  2: 5, // Deluxe Single Room
  3: 4, // Deluxe Twin Room
  4: 6, // Superior Single Room
};

const RoomAvailabilityContext = createContext(null);

/**
 * Fetches live availability directly from the backend /availability API.
 * Uses today → 1-year-from-now window to check active bookings.
 */
async function fetchFromApi() {
  const checkin  = dayjs().format('YYYY-MM-DD');
  const checkout = dayjs().add(365, 'day').format('YYYY-MM-DD');
  try {
    const res  = await fetch(`${API_URL}/availability?checkin=${checkin}&checkout=${checkout}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.rooms)) {
      const map = {};
      json.rooms.forEach((r) => { map[r.id] = r.available; });
      return map;
    }
  } catch (e) {
    console.warn('[RoomAvailability] API fetch failed, using fallback:', e.message);
  }
  return null;
}

export const RoomAvailabilityProvider = ({ children }) => {
  const [availability, setAvailability] = useState(FALLBACK_AVAILABILITY);
  const [loading, setLoading] = useState(true);

  /** Re-fetch from DB and update state */
  const refreshAvailability = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchFromApi();
    if (fresh) setAvailability(fresh);
    setLoading(false);
  }, []);

  /** Optimistic decrement — instant UI update while API catches up */
  const decrementRoom = useCallback((roomId) => {
    setAvailability((prev) => ({
      ...prev,
      [roomId]: Math.max(0, (prev[roomId] ?? 0) - 1),
    }));
  }, []);

  /* Fetch real counts on first mount */
  useEffect(() => { refreshAvailability(); }, [refreshAvailability]);

  return (
    <RoomAvailabilityContext.Provider value={{ availability, loading, decrementRoom, refreshAvailability }}>
      {children}
    </RoomAvailabilityContext.Provider>
  );
};

export const useRoomAvailability = () => {
  const ctx = useContext(RoomAvailabilityContext);
  if (!ctx) throw new Error('useRoomAvailability must be used inside RoomAvailabilityProvider');
  return ctx;
};
