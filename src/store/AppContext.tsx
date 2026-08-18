import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CompanionType, Itinerary, TagKey, TripCompletion, UserProfile } from "../types";

const STORAGE_KEY = "meomulgyeong_state_v1";

interface AppState {
  user: UserProfile;
  isLoggedIn: boolean;
  hasOnboarded: boolean;
  savedItineraries: Itinerary[];
  lastSelection: {
    tags: TagKey[];
    nights: number;
    companion: CompanionType | null;
  };
}

interface AppContextValue extends AppState {
  login: (provider: "google" | "kakao" | "naver") => void;
  logout: () => void;
  completeOnboarding: (nickname: string) => void;
  updateNickname: (nickname: string) => void;
  setSelection: (tags: TagKey[], nights: number, companion: CompanionType) => void;
  saveItinerary: (itin: Itinerary) => void;
  removeSavedItinerary: (itinId: string) => void;
  completeTrip: (trip: TripCompletion) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialUser: UserProfile = {
  nickname: "",
  loginProvider: null,
  stamps: [],
  savedItineraries: [],
  trips: [],
};

const initialState: AppState = {
  user: initialUser,
  isLoggedIn: false,
  hasOnboarded: false,
  savedItineraries: [],
  lastSelection: { tags: [], nights: 1, companion: null },
};

// 새로고침 시 로그인/여행 데이터가 사라지지 않도록 브라우저 로컬 저장소에 보관
// (이 앱은 claude.ai 아티팩트가 아닌 독립 실행형 웹앱이라 localStorage 사용 가능)
function loadInitialState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const loaded = useMemo(loadInitialState, []);
  const [user, setUser] = useState<UserProfile>(loaded.user);
  const [isLoggedIn, setIsLoggedIn] = useState(loaded.isLoggedIn);
  const [hasOnboarded, setHasOnboarded] = useState(loaded.hasOnboarded);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>(loaded.savedItineraries);
  const [lastSelection, setLastSelection] = useState<AppState["lastSelection"]>(loaded.lastSelection);

  useEffect(() => {
    const state: AppState = { user, isLoggedIn, hasOnboarded, savedItineraries, lastSelection };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — silently skip persistence
    }
  }, [user, isLoggedIn, hasOnboarded, savedItineraries, lastSelection]);

  const login = (provider: "google" | "kakao" | "naver") => {
    setUser((u) => ({ ...u, loginProvider: provider }));
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setHasOnboarded(false);
    setUser(initialUser);
    setSavedItineraries([]);
  };

  const completeOnboarding = (nickname: string) => {
    setUser((u) => ({ ...u, nickname }));
    setHasOnboarded(true);
  };

  const updateNickname = (nickname: string) => {
    setUser((u) => ({ ...u, nickname }));
  };

  const setSelection = (tags: TagKey[], nights: number, companion: CompanionType) => {
    setLastSelection({ tags, nights, companion });
  };

  const saveItinerary = (itin: Itinerary) => {
    setSavedItineraries((list) => {
      if (list.some((i) => i.id === itin.id)) return list;
      return [...list, { ...itin, savedAt: new Date().toISOString() }];
    });
    setUser((u) => ({ ...u, savedItineraries: [...u.savedItineraries, itin.id] }));
  };

  const removeSavedItinerary = (itinId: string) => {
    setSavedItineraries((list) => list.filter((i) => i.id !== itinId));
    setUser((u) => ({ ...u, savedItineraries: u.savedItineraries.filter((id) => id !== itinId) }));
  };

  const completeTrip = (trip: TripCompletion) => {
    setUser((u) => ({
      ...u,
      trips: [...u.trips, trip],
      stamps: u.stamps.includes(trip.regionId) ? u.stamps : [...u.stamps, trip.regionId],
    }));
  };

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isLoggedIn,
      hasOnboarded,
      savedItineraries,
      lastSelection,
      login,
      logout,
      completeOnboarding,
      updateNickname,
      setSelection,
      saveItinerary,
      removeSavedItinerary,
      completeTrip,
    }),
    [user, isLoggedIn, hasOnboarded, savedItineraries, lastSelection]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
