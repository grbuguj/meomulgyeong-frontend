/**
 * 한글 조사 처리.
 * 지역 이름이 데이터에서 오기 때문에 "영주을 천천히"처럼 어색하게 붙는 경우가 생긴다.
 * 한글 음절은 유니코드상 28개 종성 단위로 배열돼 있어 받침 유무를 계산할 수 있다.
 */
function finalConsonantOf(word: string): number | null {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

/** 받침이 있으면 withFinal, 없으면 withoutFinal. 예: josa("영주", "은", "는") → "는" */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const final = finalConsonantOf(word);
  if (final === null) return withoutFinal;
  return final > 0 ? withFinal : withoutFinal;
}

/** "으로 / 로" — 받침이 ㄹ(8)일 때도 "로"를 쓴다. */
export function ro(word: string): string {
  const final = finalConsonantOf(word);
  if (final === null) return "로";
  return final === 0 || final === 8 ? "로" : "으로";
}
