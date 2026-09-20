import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CompanionType, Itinerary, TagKey, TripCompletion, UserProfile } from "../types";
import {
  fetchMe,
  logoutLocally,
  registerOnboardingNickname,
  updateProfile as updateProfileApi,
  type MeResponse,
} from "../lib/authApi";
import { getAccessToken } from "../lib/apiClient";
import {
  listBookmarkedItineraries,
  resolveFrontendRegionId,
  toFrontendItinerarySummary,
  unbookmarkItinerary,
} from "../lib/itineraryApi";
import { getCompletedTrips, getMyStamps } from "../lib/myPageApi";

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
  /** 인증 초기화(토큰 검증 + 내 정보 조회) 진행 중 여부 — 앱 부팅 시 깜빡임/오탐 리다이렉트 방지용 */
  authLoading: boolean;
  /** 로그인 성공 콜백(OAuthCallbackPage)에서 토큰 저장 후 이 함수로 사용자 정보를 불러온다 */
  /** 온보딩 완료 여부를 반환한다. */
  refreshMe: () => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (nickname: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  setSelection: (tags: TagKey[], nights: number, companion: CompanionType) => void;
  saveItinerary: (itin: Itinerary) => void;
  removeSavedItinerary: (itinId: string, backendItineraryId?: number) => Promise<void>;
  completeTrip: (trip: TripCompletion) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialUser: UserProfile = {
  nickname: "",
  name: "",
  email: null,
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

// 로그인/토큰은 서버가 진실 소스(source of truth)이므로 localStorage에는
// 여행 관련 화면 상태(저장 일정, 마지막 선택)만 캐싱한다.
function loadInitialState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed, isLoggedIn: false, hasOnboarded: false, user: initialUser };
  } catch {
    return initialState;
  }
}

function toUserProfile(me: MeResponse, prev: UserProfile): UserProfile {
  return {
    ...prev,
    nickname: me.nickname ?? "",
    name: me.name,
    email: me.email,
    loginProvider: me.provider,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const loaded = useMemo(loadInitialState, []);
  const [user, setUser] = useState<UserProfile>(loaded.user);
  const [isLoggedIn, setIsLoggedIn] = useState(loaded.isLoggedIn);
  const [hasOnboarded, setHasOnboarded] = useState(loaded.hasOnboarded);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>(loaded.savedItineraries);
  const [lastSelection, setLastSelection] = useState<AppState["lastSelection"]>(loaded.lastSelection);

  // 여행 상태(저장 일정/마지막 선택)만 로컬에 캐싱 — 로그인 여부/유저 정보는 서버 재조회로 관리
  useEffect(() => {
    const state = { savedItineraries, lastSelection };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — silently skip persistence
    }
  }, [savedItineraries, lastSelection]);

  /** 로그인 상태를 서버 기준으로 갱신한다. 온보딩 완료 여부를 반환해 호출부가
   *  React state 갱신을 기다리지 않고도 바로 어느 화면으로 갈지 정할 수 있게 한다. */
  const refreshMe = async (): Promise<boolean> => {
    const token = getAccessToken();
    if (!token) {
      setIsLoggedIn(false);
      setHasOnboarded(false);
      setAuthLoading(false);
      return false;
    }
    try {
      const me = await fetchMe();
      setUser((u) => toUserProfile(me, u));
      setIsLoggedIn(true);
      setHasOnboarded(me.onboardingCompleted);
      // 서버의 북마크 목록을 로컬 상태에 동기화한다 — 실패해도 로컬 캐시를 유지한다.
      listBookmarkedItineraries()
        .then((serverItins) => {
          const mapped = serverItins.map((summary) =>
            toFrontendItinerarySummary(
              summary,
              resolveFrontendRegionId(summary.region.regionName, summary.region.regionId)
            )
          );
          // 북마크는 서버가 기준이다. 로컬에 남은 항목을 합쳐두면 같은 브라우저에서
          // 다른 계정으로 로그인했을 때 앞 사용자의 일정이 그대로 보이고,
          // 열어보면 접근 권한이 없다는 오류가 난다.
          setSavedItineraries(
            mapped.map((i) => ({ ...i, savedAt: i.savedAt ?? new Date().toISOString() }))
          );
        })
        .catch(() => {/* 서버 동기화 실패 — 로컬 캐시 유지 */});

      // 완료 여행과 스탬프도 서버를 기준으로 갱신한다. 각 요청은 독립적이라
      // 하나가 실패해도 기존 화면 상태를 보존한다.
      getMyStamps()
        .then(({ stamps }) => {
          setUser((prev) => ({
            ...prev,
            stamps: stamps
              .filter((stamp) => stamp.collected)
              .map((stamp) => resolveFrontendRegionId(stamp.regionName, stamp.regionId)),
          }));
        })
        .catch(() => {/* 서버 동기화 실패 — 로컬 캐시 유지 */});

      getCompletedTrips()
        .then(({ completedTrips }) => {
          setUser((prev) => ({
            ...prev,
            trips: completedTrips.map((trip) => ({
              itineraryId: String(trip.itineraryId),
              regionId: resolveFrontendRegionId(trip.region.regionName, trip.region.regionId),
              visitedDays: trip.nights + 1,
              visitors: trip.partySize,
              completedAt: trip.completedAt,
              contribution: {
                stayHours: trip.stayHours,
                estimatedSpending: trip.estimatedSpending,
                populationContributionDays: trip.populationContributionDays,
              },
            })),
          }));
        })
        .catch(() => {/* 서버 동기화 실패 — 로컬 캐시 유지 */});

      return me.onboardingCompleted;
    } catch {
      // 토큰 만료/무효 — apiClient가 이미 로컬 토큰을 정리했으므로 로그아웃 상태로 되돌림
      setIsLoggedIn(false);
      setHasOnboarded(false);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // 앱 부팅 시 저장된 토큰이 있으면 내 정보를 조회해 로그인 상태를 복원한다.
  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    logoutLocally();
    setIsLoggedIn(false);
    setHasOnboarded(false);
    setUser(initialUser);
    setSavedItineraries([]);
    // 여행 캐시도 함께 비운다. 남겨두면 다음에 로그인한 계정 화면에 잠깐 비쳤다가 사라진다.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — 메모리 상태만 비운 것으로 충분하다
    }
  };

  const completeOnboarding = async (nickname: string) => {
    const me = await registerOnboardingNickname(nickname);
    setUser((u) => toUserProfile(me, u));
    setHasOnboarded(me.onboardingCompleted);
  };

  const updateNickname = async (nickname: string) => {
    const me = await updateProfileApi({ nickname });
    setUser((u) => toUserProfile(me, u));
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

  /** 서버 북마크를 먼저 해제하고, 성공했을 때만 로컬 목록에서 제거한다. */
  const removeSavedItinerary = async (itinId: string, backendItineraryId?: number) => {
    if (backendItineraryId) {
      await unbookmarkItinerary(backendItineraryId);
    }
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
      authLoading,
      savedItineraries,
      lastSelection,
      refreshMe,
      logout,
      completeOnboarding,
      updateNickname,
      setSelection,
      saveItinerary,
      removeSavedItinerary,
      completeTrip,
    }),
    [user, isLoggedIn, hasOnboarded, authLoading, savedItineraries, lastSelection]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
