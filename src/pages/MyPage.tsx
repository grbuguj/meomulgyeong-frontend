import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import RegionArt from "../components/RegionArt";
import { REGIONS, REGION_MAP } from "../data/regions";
import { useApp } from "../store/AppContext";
import { useState } from "react";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ApiError } from "../lib/apiClient";

export default function MyPage() {
  const { user, savedItineraries, removeSavedItinerary, logout, updateNickname } = useApp();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(user.nickname);
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const saveNickname = async () => {
    const value = nicknameDraft.trim();
    if (!value || savingNickname) return;
    setSavingNickname(true);
    setNicknameError(null);
    try {
      await updateNickname(value);
      setEditingNickname(false);
    } catch (e) {
      setNicknameError(e instanceof ApiError ? e.message : "닉네임 변경에 실패했어요.");
    } finally {
      setSavingNickname(false);
    }
  };

  const stampPct = Math.round((user.stamps.length / 15) * 100);

  return (
    <>
      <TopBar
        title="마이페이지"
        right={
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-full bg-white card-soft flex items-center justify-center text-base tap"
          >
            ⚙️
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile header */}
        <div
          className="mx-5 mt-4 rounded-[26px] p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, var(--color-accent-soft) 0%, white 100%)",
            boxShadow: "0 2px 8px rgba(28,26,22,0.04), 0 10px 28px -10px rgba(43,108,224,0.16)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #e8f0fd, #d0e4fc)",
              boxShadow: "0 4px 12px -4px rgba(43,108,224,0.25)",
            }}
          >
            🙂
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-extrabold text-[19px] tracking-tight truncate"
              style={{ color: "var(--color-ink)" }}
            >
              {user.nickname}님
            </p>
            <p
              className="text-[12px] font-medium mt-0.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              여행 {user.trips.length}회 완료 · 배지 {user.stamps.length}/15
            </p>
            {/* Progress bar */}
            <div
              className="mt-2.5 h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(43,108,224,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stampPct}%`,
                  background: "linear-gradient(90deg, #3b82f6, var(--color-accent-dark))",
                }}
              />
            </div>
            <p
              className="text-[10.5px] font-semibold mt-1"
              style={{ color: "var(--color-accent)" }}
            >
              경상북도 {stampPct}% 탐험
            </p>
          </div>
        </div>

        {/* 스탬프 */}
        <div className="px-5 mt-6">
          <p
            className="text-[14px] font-bold mb-3"
            style={{ color: "var(--color-ink)" }}
          >
            경상북도 15개 지역 스탬프
          </p>
          <div className="grid grid-cols-5 gap-2">
            {REGIONS.map((r) => {
              const done = user.stamps.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/region/${r.id}`)}
                  className="aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold tap"
                  style={
                    done
                      ? {
                          background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                          color: "white",
                          boxShadow: "0 4px 12px -4px rgba(43,108,224,0.5)",
                        }
                      : {
                          background: "var(--color-ivory-warm)",
                          color: "var(--color-ink-faint)",
                        }
                  }
                >
                  {r.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* 저장한 일정 */}
        <div className="px-5 mt-7">
          <p
            className="text-[14px] font-bold mb-3"
            style={{ color: "var(--color-ink)" }}
          >
            저장한 일정 ({savedItineraries.length})
          </p>
          {savedItineraries.length === 0 && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{
                background: "white",
                boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)",
              }}
            >
              <p className="text-2xl mb-2">📑</p>
              <p
                className="text-[12.5px] leading-relaxed"
                style={{ color: "var(--color-ink-soft)" }}
              >
                아직 저장한 일정이 없어요.
                <br />
                지역 추천에서 일정을 책갈피 해보세요.
              </p>
            </div>
          )}
          <div className="space-y-2.5">
            {savedItineraries.map((itin) => {
              const region = REGION_MAP[itin.regionId];
              return (
                <div
                  key={itin.id}
                  className="rounded-[20px] overflow-hidden flex items-stretch"
                  style={{
                    background: "white",
                    boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
                  }}
                >
                  <RegionArt region={region} className="w-20" label={false} />
                  <div className="flex-1 p-3.5 flex items-center justify-between">
                    <div>
                      <p
                        className="text-[13.5px] font-bold"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {region.name}
                      </p>
                      <p
                        className="text-[11.5px] font-medium mt-0.5"
                        style={{ color: "var(--color-ink-muted)" }}
                      >
                        {itin.nights}박 {itin.nights + 1}일
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const base = `/itinerary/${itin.regionId}?nights=${itin.nights}&companion=${itin.companion}`;
                          navigate(itin.backendItineraryId ? `${base}&itineraryId=${itin.backendItineraryId}` : base);
                        }}
                        className="text-[12px] font-bold tap"
                        style={{ color: "var(--color-accent)" }}
                      >
                        보기
                      </button>
                      <button
                        onClick={() => removeSavedItinerary(itin.id)}
                        className="text-[12px] font-bold tap"
                        style={{ color: "var(--color-ink-faint)" }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 완료한 여행 */}
        {user.trips.length > 0 && (
          <div className="px-5 mt-7">
            <p
              className="text-[14px] font-bold mb-3"
              style={{ color: "var(--color-ink)" }}
            >
              완료한 여행 기록
            </p>
            <div className="space-y-2">
              {user.trips.map((t, idx) => {
                const region = REGION_MAP[t.regionId];
                return (
                  <div
                    key={idx}
                    className="rounded-2xl p-3.5 flex justify-between items-center"
                    style={{
                      background: "white",
                      boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 14px -6px rgba(28,26,22,0.08)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[13.5px] font-bold"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {region.name}
                      </p>
                      <p
                        className="text-[11.5px] font-medium mt-0.5"
                        style={{ color: "var(--color-ink-muted)" }}
                      >
                        {t.visitedDays}일 체류 · {t.visitors}명
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--color-ink-faint)" }}
                    >
                      {new Date(t.completedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <BottomNav />

      {/* Settings modal */}
      <Modal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setEditingNickname(false);
        }}
        title="설정"
      >
        <div className="space-y-1">
          <div
            className="flex items-center justify-between py-3.5"
            style={{ borderBottom: "1px solid var(--color-line-soft)" }}
          >
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--color-ink-soft)" }}
            >
              닉네임
            </span>
            {editingNickname ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nicknameDraft}
                    onChange={(e) => setNicknameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                    maxLength={12}
                    className="text-right text-[14px] font-bold rounded-lg px-2 py-1 outline-none w-28"
                    style={{
                      background: "var(--color-ivory-deep)",
                      color: "var(--color-ink)",
                    }}
                  />
                  <button
                    onClick={saveNickname}
                    disabled={savingNickname}
                    className="text-[12px] font-bold tap"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {savingNickname ? "저장 중…" : "완료"}
                  </button>
                </div>
                {nicknameError && (
                  <span className="text-[10.5px] font-semibold" style={{ color: "#c0392b" }}>
                    {nicknameError}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setNicknameDraft(user.nickname);
                  setEditingNickname(true);
                }}
                className="flex items-center gap-1.5 text-[14px] font-bold tap"
                style={{ color: "var(--color-ink)" }}
              >
                {user.nickname}{" "}
                <span
                  className="text-[11px]"
                  style={{ color: "var(--color-ink-faint)" }}
                >
                  ✎ 수정
                </span>
              </button>
            )}
          </div>
          <div
            className="flex justify-between text-[13px] py-3.5"
            style={{ borderBottom: "1px solid var(--color-line-soft)" }}
          >
            <span className="font-semibold" style={{ color: "var(--color-ink-soft)" }}>로그인 방식</span>
            <span className="font-bold capitalize" style={{ color: "var(--color-ink)" }}>{user.loginProvider}</span>
          </div>
          <button
            onClick={() => setTermsOpen(true)}
            className="w-full flex justify-between text-[13px] py-3.5 tap"
            style={{ borderBottom: "1px solid var(--color-line-soft)" }}
          >
            <span className="font-semibold" style={{ color: "var(--color-ink-soft)" }}>이용약관 · 개인정보처리방침</span>
            <span style={{ color: "var(--color-ink-faint)" }}>›</span>
          </button>
          <div
            className="flex justify-between text-[13px] py-3.5"
            style={{ borderBottom: "1px solid var(--color-line-soft)" }}
          >
            <span className="font-semibold" style={{ color: "var(--color-ink-soft)" }}>버전</span>
            <span className="font-bold" style={{ color: "var(--color-ink)" }}>v0.1.0 (MVP)</span>
          </div>
          <Button variant="secondary" fullWidth className="mt-5" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </Modal>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="이용약관 · 개인정보처리방침">
        <div
          className="text-[12.5px] leading-relaxed space-y-3"
          style={{ color: "var(--color-ink-soft)" }}
        >
          <p>
            본 서비스는 2026 관광데이터 활용 공모전 제출을 위한 MVP 데모입니다. 실제 약관 문서는 서비스 정식 출시
            시점에 법무 검토를 거쳐 게시됩니다.
          </p>
          <p>수집 항목: 소셜 로그인 식별정보, 닉네임, 여행 일정·완료 기록(방문 지역, 체류일수, 인원)</p>
          <p>이용 목적: 지역 추천 정확도 개선, 지역 기여도 산출, 서비스 품질 개선</p>
        </div>
      </Modal>
    </>
  );
}
