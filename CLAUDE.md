# 베즈랩 홈페이지 — 프로젝트 지침

## 파일 구성
GitHub Pages 정적 사이트. 업로드 대상은 아래 전부.
- `index.html` — 메인 (단일 파일, 인라인 CSS/JS)
- `favicon.png` — 파비콘 + 상단 네비게이션 + 푸터 로고 (이 파일만 교체하면 3곳 동시 반영)
- `assets/report-p1.png`, `assets/report-p2.png` — 분석 리포트 예시 이미지
- `dashboard/` — 전국 노후 건축물 현황 (index.html, style.css, script.js, data.js, data.json)

## 지켜야 할 것
- `http://` 절대 금지 (SVG의 `xmlns`는 예외). 혼합 콘텐츠 경고가 발생함.
- 공통 요소(상단 네비게이션, 푸터, 버튼 문구)는 `index.html`과 `dashboard/index.html` **양쪽 모두** 수정.
- 한글 낱말 중간 줄바꿈 방지: 제목·본문에 `word-break: keep-all`.
- 모바일/태블릿 폭에서 가로 스크롤 발생 여부 확인. `.quick-item`에 `white-space: nowrap`이 있어 칸 수를 줄이면 반드시 중간 브레이크포인트(820px, 640px)를 함께 조정.
- 실적 수치를 임의로 만들지 않는다. 매칭 완료 건수·지원금·승인율은 실제 실적이 생길 때까지 넣지 않음.
- 무료 여부를 약속하는 문구 금지 (유·무료 방향 미정).
- 의견을 물으면 **답변만** 하고, 지시가 있을 때 수정한다.

## 정부지원사업 카드 — Supabase 연동 (완료)
전체 공고 DB(`gov_programs`)는 **비공개**. 홈페이지는 공개 전용 테이블 `gov_programs_anon`만 읽는다. 원본은 anon에게 열지 않는다.

```
GET {SUPABASE_URL}/rest/v1/gov_programs_anon?select=*&order=display_order.asc&limit=6
```

컬럼: `id, name, announcement_no, organization, region, support_types (text[]), start_date, end_date, support_content, application_url, display_order, created_at, published_at`

동작 원칙:
1. **자리 표시용 카드를 HTML에 먼저 그려둔다** — 데이터 도착 전 빈 화면/깜빡임 방지.
2. **네트워크 실패·0건이면 하드코딩된 카드를 그대로 남긴다** — 카드가 사라지지 않게.
3. **매번 호출한다** — 캐싱 생략. 6건이라 부담 없고 수정이 상시 반영된다.
4. **동적 카드는 `.visible`을 직접 붙인다** — 스크롤 관찰자는 로드 시점 요소만 등록하므로, 나중에 그린 카드는 `fade-up`(opacity 0)에 갇힌다.
5. 노출 순서는 `display_order` 오름차순. 숨기려면 7 이상으로 밀어낸다.
6. 카드가 6개 미만이면 그 수만큼만 그리고 나머지 칸은 비운다.

화면 표시: `organization` → 상단, `region` → 배지, `name` → 제목, `announcement_no` → 제목 아래 작게, `support_content` → 본문, `support_types` → 배지 여러 개, `end_date` → 하단 고정 (D-7 이내 붉은색 `D-3 · 2026. 4. 24 마감`, 당일 "오늘 마감", 지나면 "접수 마감", 없으면 `start_date` 또는 "상시 접수").

`application_url`, `start_date`는 가져오지만 아직 화면에 쓰지 않는다 (링크는 걸지 않기로 결정).

## Supabase
- 프로젝트 URL: `https://lpmkimjzpyuenrydxvxa.supabase.co` (서울 리전)
- 상담 신청은 `consult_requests` 테이블에 저장. 정책은 **삽입만 허용, 조회 차단**.
- 지원사업 테이블은 반대로 **조회만 허용**. anon key는 HTML에 노출되므로 민감 정보를 넣지 않는다.
- 알림 메일은 Formspree로 "도착 사실"만 전송 (개인정보 미포함).

## 개인정보
- 수집 항목: 성함·기관, 연락처, 이메일, 건물 주소, 건물 용도, 준공연도, 문의 내용
- 보유 기간: 수집일로부터 1년 (지원사업 재안내 목적)
- 동의 체크박스 필수. 서울 리전이라 국외 이전 동의는 불필요.

## 확인된 사실
- 공공건축물 그린리모델링 지원 대상: **사용승인 후 10년 이상** (그린리모델링센터 공고). "15년"은 2020년 추경 당시 기준이며 현행 아님.
- 민간건축물 이자지원: 노후 연한이 아니라 에너지 성능 개선 비율 기준, 최대 3% 이자 지원.

## IR 덱에서 아직 반영하지 않은 항목
슬로건·비전·미션, 4대 가치, 3단계 11절차 프로세스, 산출물 실제 명칭(에너지진단보고서/개선대안/ROI/실시설계도서), 해결하는 세 가지 문제, 고객이 얻는 가치 4개, 차별화 경쟁력 5개, 밸류체인 5단계, 사회적 가치 이중 트랙, 연혁 타임라인, 대표 이력 상세, 합류 예정 인원.

투자 유치 금액·밸류에이션·지분 희석·매출 목표·BEP는 고객용 페이지에 넣지 않는다.
