import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import TagChip from "../components/TagChip";
import Button from "../components/Button";
import RegionCard from "../components/RegionCard";
import StepDots from "../components/StepDots";
import { TAGS } from "../data/tags";
import type { CompanionType, Region, TagKey } from "../types";
import { matchRegions } from "../lib/match";
import { useApp } from "../store/AppContext";

const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const COMPANIONS: { key: CompanionType; label: string; emoji: string; desc: string }[] = [
  { key: "alone", label: "혼자", emoji: "🧍", desc: "나만의 템포로" },
  { key: "family", label: "가족", emoji: "👨‍👩‍👧", desc: "온 가족 함께" },
  { key: "couple", label: "연인", emoji: "💑", desc: "둘만의 여행" },
  { key: "friend", label: "친구", emoji: "👯", desc: "함께 즐기는" },
];

const STEPS: { key: "tags" | "nights" | "companion" | "result"; index: number }[] = [
  { key: "tags", index: 0 },
  { key: "nights", index: 1 },
  { key: "companion", index: 2 },
  { key: "result", index: 3 },
];

type Step = "tags" | "nights" | "companion" | "result";

export default function HomePage() {
  const { user, setSelection } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("tags");
  const [tags, setTags] = useState<TagKey[]>([]);
  const [nights, setNights] = useState<number>(2);
  const [customNights, setCustomNights] = useState("");
  const [companion, setCompanion] = useState<CompanionType | null>(null);
  const [results, setResults] = useState<Region[]>([]);

  const stepIndex = STEPS.find((s) => s.key === step)?.index ?? 0;

  const toggleTag = (t: TagKey) => {
    setTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 3) return prev;
      return [...prev, t];
    });
  };

  const runMatch = (finalCompanion: CompanionType) => {
    const matched = matchRegions(tags, finalCompanion, nights);
    setResults(matched);
    setSelection(tags, nights, finalCompanion);
    setStep("result");
  };

  const reset = () => {
    setStep("tags");
    setTags([]);
    setNights(2);
    setCompanion(null);
    setResults([]);
  };

  return (
    <>
      <TopBar
        title={step === "result" ? "추천 지역" : "머물;경"}
        onBack={step !== "tags" && step !== "result"}
        right={
          step !== "tags" ? (
            <button
              onClick={reset}
              className="text-[11.5px] font-bold tap"
              style={{ color: "var(--color-ink-muted)" }}
            >
              처음부터
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
        {step !== "result" && <StepDots total={3} current={stepIndex} />}

        {/* ── STEP 1: 취향 태그 ── */}
        {step === "tags" && (
          <div className="animate-in">
            <p
              className="text-[13px] font-bold mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              {user.nickname}님, 반가워요 👋
            </p>
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              오늘의 취향을
              <br />
              골라주세요
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              최대 3개까지 선택할 수 있어요 · {tags.length}/3
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <TagChip
                  key={t.key}
                  label={t.label}
                  emoji={t.emoji}
                  active={tags.includes(t.key)}
                  disabled={!tags.includes(t.key) && tags.length >= 3}
                  onClick={() => toggleTag(t.key)}
                />
              ))}
            </div>
            <Button
              fullWidth
              variant="accent"
              className="mt-10"
              disabled={tags.length === 0}
              onClick={() => setStep("nights")}
            >
              다음 →
            </Button>
          </div>
        )}

        {/* ── STEP 2: 박수 선택 ── */}
        {step === "nights" && (
          <div className="animate-in">
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              며칠 머무를까요?
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              1박부터 7박까지, 더 길게도 가능해요
            </p>
            <div className="grid grid-cols-4 gap-2">
              {NIGHT_OPTIONS.map((n) => {
                const isActive = nights === n && !customNights;
                return (
                  <button
                    key={n}
                    onClick={() => {
                      setNights(n);
                      setCustomNights("");
                    }}
                    className="py-4 rounded-2xl text-[14px] font-bold tap"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                            color: "white",
                            boxShadow: "0 6px 18px -6px rgba(43,108,224,0.52)",
                          }
                        : {
                            background: "white",
                            color: "var(--color-ink)",
                            boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)",
                          }
                    }
                  >
                    {n}박
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <p
                className="text-[13px] mb-2 font-semibold"
                style={{ color: "var(--color-ink-soft)" }}
              >
                7박 이상 머무르시나요?
              </p>
              <input
                type="number"
                min={8}
                value={customNights}
                onChange={(e) => {
                  setCustomNights(e.target.value);
                  if (e.target.value) setNights(Number(e.target.value));
                }}
                placeholder="직접 입력 (예: 10)"
                className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none font-semibold"
                style={{
                  background: "white",
                  color: "var(--color-ink)",
                  border: "1.5px solid var(--color-line)",
                  boxShadow: "0 1px 2px rgba(28,26,22,0.04)",
                }}
              />
            </div>
            <Button fullWidth variant="accent" className="mt-10" onClick={() => setStep("companion")}>
              다음 →
            </Button>
          </div>
        )}

        {/* ── STEP 3: 동행 ── */}
        {step === "companion" && (
          <div className="animate-in">
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              누구와 함께
              <br />
              가시나요?
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              동행 형태에 맞춰 지역을 추천해드려요
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COMPANIONS.map((c) => {
                const isActive = companion === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCompanion(c.key)}
                    className="py-7 rounded-3xl flex flex-col items-center gap-2 tap"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                            color: "white",
                            boxShadow: "0 10px 28px -10px rgba(43,108,224,0.58)",
                          }
                        : {
                            background: "white",
                            color: "var(--color-ink)",
                            boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.1)",
                          }
                    }
                  >
                    <span className="text-3xl">{c.emoji}</span>
                    <div className="text-center">
                      <p className="text-[14px] font-bold leading-none">{c.label}</p>
                      <p
                        className="text-[10.5px] font-medium mt-0.5"
                        style={{ opacity: isActive ? 0.78 : undefined, color: isActive ? undefined : "var(--color-ink-muted)" }}
                      >
                        {c.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              fullWidth
              variant="accent"
              className="mt-10"
              disabled={!companion}
              onClick={() => companion && runMatch(companion)}
            >
              지역 추천 받기
            </Button>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && (
          <div className="animate-in space-y-3">
            <div className="mb-4">
              <p
                className="text-[13px] font-bold mb-1"
                style={{ color: "var(--color-accent)" }}
              >
                {user.nickname}님을 위한 맞춤 추천
              </p>
              <h2
                className="text-[24px] font-extrabold tracking-tight"
                style={{ color: "var(--color-ink)" }}
              >
                추천 지역 {results.length}곳
              </h2>
              <p
                className="text-[13px] mt-1"
                style={{ color: "var(--color-ink-soft)" }}
              >
                선택한 조건과 가장 잘 맞는 순서예요
              </p>
            </div>
            {results.map((r, idx) => (
              <RegionCard
                key={r.id}
                region={r}
                reason={
                  idx === 0
                    ? "가장 높은 일치도"
                    : `${tags.filter((t) => r.tags.includes(t)).length}개 태그 일치`
                }
                onClick={() => navigate(`/itinerary/${r.id}?nights=${nights}&companion=${companion}`)}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
