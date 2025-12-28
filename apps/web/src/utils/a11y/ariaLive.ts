/**
 * ariaLive 유틸
 * - 스크린리더용 라이브 리전을 문서에 주입하고 메시지를 공지한다.
 * - polite / assertive 두 채널 제공.
 * - SR 일부 엔진에서 동일 텍스트가 무시되는 문제를 피하기 위해 텍스트 토글 기법 사용.
 */
type Channel = "polite" | "assertive";

let politeNode: HTMLElement | null = null;
let assertiveNode: HTMLElement | null = null;
let toggle = false;

function ensureRegions() {
  if (!politeNode) {
    politeNode = document.createElement("div");
    politeNode.setAttribute("role", "status"); // aria-live="polite" 포함
    politeNode.setAttribute("aria-atomic", "true");
    baseStyle(politeNode);
    document.body.appendChild(politeNode);
  }
  if (!assertiveNode) {
    assertiveNode = document.createElement("div");
    assertiveNode.setAttribute("role", "alert"); // aria-live="assertive" 포함
    assertiveNode.setAttribute("aria-atomic", "true");
    baseStyle(assertiveNode);
    document.body.appendChild(assertiveNode);
  }
}

function baseStyle(node: HTMLElement) {
  node.style.position = "fixed";
  node.style.width = "1px";
  node.style.height = "1px";
  node.style.padding = "0";
  node.style.overflow = "hidden";
  node.style.clip = "rect(0 0 0 0)";
  node.style.clipPath = "inset(50%)";
  node.style.border = "0";
  node.style.whiteSpace = "nowrap";
  node.style.bottom = "0";
  node.style.right = "0";
  node.style.zIndex = "-1";
}

function setLiveText(node: HTMLElement, text: string) {
  // 일부 스크린리더에서 같은 텍스트 반복이 무시되는 문제를 회피
  // 텍스트 앞뒤로 토글 플래그를 붙인다.
  node.textContent = `${toggle ? "\u200B" : ""}${text}${toggle ? "" : "\u200B"}`;
  toggle = !toggle;
}

/** 지정 채널로 공지 */
export function announce(text: string, channel: Channel = "polite") {
  if (!text) return;
  ensureRegions();
  const node = channel === "assertive" ? assertiveNode! : politeNode!;
  // 새로 붙인 노드는 곧바로 읽히지 않는 경우가 있어 다음 틱에 텍스트 설정
  setTimeout(() => setLiveText(node, text), 10);
}

/** 빈 메시지로 초기화 */
export function clearAnnouncements() {
  ensureRegions();
  setLiveText(politeNode!, "");
  setLiveText(assertiveNode!, "");
}

/** 자주 쓰는 프리셋 */
export const Announce = {
  moved: (title: string, toIndex: number) =>
    announce(`${title} 이동됨. 새 위치 ${toIndex + 1}번째.`),
  reordered: (count: number) => announce(`${count}개 항목 정렬 완료.`),
  added: (title: string) => announce(`${title} 추가됨.`),
  removed: (title: string) => announce(`${title} 삭제됨.`, "assertive"),
};
