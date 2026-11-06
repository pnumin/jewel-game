# PRD — 보석 맞추기 (React + Supabase)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v2.0 (2026-11-07) — React 전환, 카카오 로그인 화면 분리, 점수 저장·랭킹 추가 |
| 이전 버전 | v1.0 — 바닐라 JS 단일 파일(`jewel.html`) |
| 저장소 | https://github.com/pnumin/jewel-game |
| 배포 | Vercel (주 배포처) |
| 상태 표기 | ✅ 기존 구현을 옮겨 옴 · 🆕 새로 개발 |

---

## 1. 개요

브라우저에서 바로 플레이하는 **매치-3 보석 퍼즐 게임**을 **React**로 다시 개발한다.
사용자는 **카카오 계정으로 로그인(Supabase Auth)** 한 뒤 게임 화면으로 이동해 플레이하고, 끝난 판의 점수를 **저장**하며, 저장된 점수를 **높은 점수 순 랭킹**으로 확인한다.

Supabase 연결 정보는 코드에 직접 쓰지 않고 **환경변수**로 관리한다.

## 2. 목표

1. 기존 `jewel.html`의 게임 규칙·그래픽·조작을 React 컴포넌트 구조로 옮긴다.
2. **로그인 화면 → 게임 화면** 흐름을 라우트로 분리하고, 로그인하지 않으면 게임 화면에 들어갈 수 없게 한다.
3. **점수 저장** 버튼으로 현재 판의 점수를 Supabase DB에 저장한다.
4. **점수 확인** 버튼으로 저장된 점수를 최고 점수 순으로 보여 준다.
5. Supabase 주소·키를 환경변수(`.env`, Vercel Environment Variables)로 관리한다.

### 비목표
- 카카오 외 소셜 로그인, 이메일 회원가입
- 스테이지/레벨, 특수 보석, 사운드
- 관리자 화면, 점수 수정·삭제 화면
- 서버 측 점수 검증(부정 점수 방지)은 이번 범위에서 제외 (§9 미결 사항)

## 3. 대상 사용자

- 교육청 특강 참가자 및 링크를 받은 일반 사용자
- PC 브라우저(Chrome, Edge) 및 모바일 브라우저 사용자

## 4. 기술 스택

| 구분 | 선택 |
|---|---|
| 프레임워크 | React 18 + Vite (JavaScript) |
| 라우팅 | React Router v6 |
| 인증·DB | Supabase (`@supabase/supabase-js` v2) — Auth(Kakao OAuth), Postgres |
| 렌더링 | HTML5 Canvas 2D (보드·보석·파티클), 나머지 UI는 React 컴포넌트 |
| 스타일 | CSS 파일 (CSS 변수 기반 다크 테마, 기존 디자인 유지) |
| 배포 | Vercel (Framework Preset: Vite, Build: `npm run build`, Output: `dist`) |

## 5. 화면 구성과 흐름

```
[ / 로그인 화면 ] --카카오 로그인--> (카카오 인증) --> Supabase 콜백
        ^                                              |
        | 로그아웃                                      v
[ /game 게임 화면 ] <------------------------ 로그인 완료 시 자동 이동
        |  점수 확인
        v
[ 랭킹 (모달) ]
```

| 경로 | 화면 | 접근 조건 |
|---|---|---|
| `/` | 로그인 화면 | 이미 로그인되어 있으면 `/game`으로 자동 이동 |
| `/game` | 게임 화면 (+ 랭킹 모달) | 로그인 필요. 아니면 `/`로 이동 |
| 그 외 | — | `/`로 이동 |

> Vercel에서 `/game`을 새로고침해도 404가 나지 않도록 `vercel.json`에 SPA rewrite(모든 경로 → `/index.html`)를 둔다.

## 6. 기능 요구사항

### 6.1 로그인 화면 (`/`) 🆕

| ID | 요구사항 |
|---|---|
| LOG-1 | 게임 제목 "💎 보석 맞추기", 짧은 안내 문구, 노란색 **카카오 로그인** 버튼(카카오 말풍선 아이콘)을 보여 준다. |
| LOG-2 | 버튼을 누르면 `supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: <origin>/game } })`를 호출한다. |
| LOG-3 | 인증 중에는 버튼을 비활성화하고 "로그인 중..."을 표시한다. |
| LOG-4 | 카카오 인증 후 돌아오면 세션을 확인하고 **게임 화면(`/game`)으로 이동**한다. 주소창의 `?code=` 등 인증 파라미터는 정리한다. |
| LOG-5 | 로그인 실패·취소 시 오류 메시지를 버튼 아래에 보여 준다 (예: "로그인에 실패했습니다: …"). |
| LOG-6 | 환경변수가 없어 Supabase를 만들 수 없으면 "설정 오류: Supabase 환경변수가 없습니다"를 표시하고 버튼을 비활성화한다. |
| LOG-7 | 카카오 이메일 동의는 받지 않는다 (비즈 앱 아님). 닉네임(필수)·프로필 사진(선택)만 사용한다. |

### 6.2 인증 상태 관리 🆕

| ID | 요구사항 |
|---|---|
| AUT-1 | `AuthProvider`(React Context)가 앱 시작 시 `getSession()`으로 세션을 읽고, `onAuthStateChange`로 변화를 구독한다. `user`, `loading`, `signInWithKakao()`, `signOut()`을 제공한다. |
| AUT-2 | 세션 확인 중(`loading`)에는 로딩 표시만 보여 주고 화면을 이동하지 않는다. |
| AUT-3 | `ProtectedRoute`가 로그인하지 않은 사용자의 `/game` 접근을 `/`로 돌려보낸다. |
| AUT-4 | 새로고침해도 로그인 상태가 유지된다 (Supabase 기본 세션 저장). |
| AUT-5 | 표시 이름: `user_metadata`의 `name` → `full_name` → `preferred_username` → `"플레이어"` 순. 프로필 사진은 `avatar_url`(없으면 기본 아이콘). |

### 6.3 게임 화면 (`/game`) — 상단 영역 🆕

| ID | 요구사항 |
|---|---|
| HDR-1 | 프로필 사진 + "○○ 님" + **로그아웃** 버튼. 로그아웃하면 세션을 지우고 `/`로 이동한다. |
| HDR-2 | 점수판: **점수**, **남은 이동**, **내 최고 점수**(DB에 저장된 내 점수 중 최댓값, 저장 전에는 0). |

### 6.4 게임 보드 ✅ (기존 규칙 유지)

| ID | 요구사항 |
|---|---|
| BRD-1 | 8×8 보드, 6종류 보석: 빨강 마름모, 초록 삼각형, 파랑 다이아몬드, 분홍 팔각형, 노랑 육각형, 보라 원형. |
| BRD-2 | 보석은 이미지 없이 Canvas 도형 + 면(facet) 음영 + 하이라이트로 그린다. |
| BRD-3 | 새 판은 처음부터 3개 줄·2×2 사각형이 없고, 가능한 이동이 1개 이상 있어야 한다. |
| BRD-4 | 시작 시 보석이 위에서 떨어지며 등장한다. |
| BRD-5 | devicePixelRatio를 반영해 선명하게 그린다. 보드는 최대 512px, 화면 폭의 92% 이내. |

### 6.5 조작 ✅

| ID | 요구사항 |
|---|---|
| CTL-1 | 클릭 2번: 보석 선택(노란 테두리·맥동) 후 이웃 보석 클릭 시 교환. 같은 보석 재클릭 시 선택 해제. |
| CTL-2 | 드래그/스와이프: 칸의 약 45% 이상 끌면 그 방향 이웃과 교환. 터치 지원(`touch-action: none`). |
| CTL-3 | 맞는 줄이 생기지 않는 교환은 되돌리고 이동 횟수를 차감하지 않는다. |
| CTL-4 | 애니메이션(교환·제거·낙하·섞기) 중에는 입력을 받지 않는다. |

### 6.6 매칭·점수 규칙 ✅

| ID | 요구사항 |
|---|---|
| MAT-1 | 가로·세로로 같은 보석 3개 이상 연속 시 제거. |
| MAT-2 | 같은 보석 4개가 2×2 사각형이면 제거. |
| MAT-3 | 제거 후 낙하·빈칸 채우기, 새 매칭은 연쇄(콤보)로 계속 처리. |
| SCO-1 | 기본 점수 = 제거 보석 수 × 10 × 콤보 단계 |
| SCO-2 | 한 번에 4개 이상 제거 시 (제거 수 − 3) × 30 보너스 |
| SCO-3 | 2×2 사각형 1개당 50점 보너스 ("사각형!" 표시) |
| SCO-4 | 획득 점수·콤보를 떠오르는 글자로 표시, 제거 시 보석 색 파티클 효과. |

### 6.7 게임 진행 ✅/🆕

| ID | 요구사항 |
|---|---|
| GAM-1 ✅ | 한 판은 이동 30회. 성공한 교환만 1회 차감. |
| GAM-2 ✅ | **힌트**: 가능한 교환 1개를 2.5초간 깜빡여 표시. |
| GAM-3 ✅ | **새 게임**: 점수·이동 횟수 초기화 후 새 판. |
| GAM-4 ✅ | 가능한 이동이 없으면 "움직일 곳이 없어요! 섞는 중..." 표시 후 자동 섞기. |
| GAM-5 🆕 | 이동을 모두 쓰면 "게임 종료!" 모달: 최종 점수, **점수 저장**, **점수 확인**, **다시 하기** 버튼. |
| GAM-6 🆕 | 기존 `localStorage` 최고 점수는 사용하지 않고, DB에 저장된 내 최고 점수로 대체한다. |

### 6.8 점수 저장 🆕

| ID | 요구사항 |
|---|---|
| SAV-1 | **점수 저장** 버튼은 게임 화면 하단 버튼줄과 게임 종료 모달에 있다. |
| SAV-2 | 누르면 현재 판의 점수를 `scores` 테이블에 1행 추가한다: `user_id`(로그인 사용자), `nickname`(표시 이름), `score`. |
| SAV-3 | 점수가 0이거나, 애니메이션 진행 중이거나, 이 판을 이미 저장했으면 버튼을 비활성화한다 (한 판에 한 번만 저장). |
| SAV-4 | 저장 중에는 "저장 중..."을 표시하고, 성공 시 "점수를 저장했습니다!" 토스트, 실패 시 오류 메시지를 보여 준다. |
| SAV-5 | 저장 성공 후 상단의 **내 최고 점수**를 갱신한다. |
| SAV-6 | 게임 도중(이동이 남아 있을 때)에도 저장할 수 있으며, 저장하면 그 판은 더 이상 저장할 수 없다. 새 게임/다시 하기를 누르면 다시 저장할 수 있다. |

### 6.9 점수 확인 (랭킹) 🆕

| ID | 요구사항 |
|---|---|
| RNK-1 | **점수 확인** 버튼은 게임 화면 하단 버튼줄과 게임 종료 모달에 있다. |
| RNK-2 | 누르면 랭킹 모달을 열고 `scores`를 **점수 내림차순**(같은 점수면 먼저 저장한 순)으로 **상위 20개**를 불러온다. |
| RNK-3 | 표 열: **순위**, **닉네임**, **점수**, **저장 일시**(YYYY-MM-DD HH:mm). 1~3위는 🥇🥈🥉로 표시. |
| RNK-4 | 내 기록 행은 강조 색으로 표시한다 (`user_id` 비교). |
| RNK-5 | 불러오는 중에는 로딩 표시, 기록이 없으면 "아직 저장된 점수가 없어요", 오류 시 메시지와 **다시 시도** 버튼. |
| RNK-6 | 모달은 닫기 버튼·배경 클릭·Esc로 닫는다. 열려 있는 동안 게임 입력은 막는다. |

## 7. 데이터 설계 (Supabase)

### 7.1 테이블 `public.scores`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | `bigint` | PK, identity | 기록 ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE, 기본값 `auth.uid()` | 저장한 사용자 |
| `nickname` | `text` | NOT NULL, 1~30자 | 저장 시점의 표시 이름 |
| `score` | `integer` | NOT NULL, `0 ≤ score ≤ 1000000` | 점수 |
| `created_at` | `timestamptz` | NOT NULL, 기본값 `now()` | 저장 일시 |

인덱스: `(score desc, created_at asc)` — 랭킹 조회용.

### 7.2 보안 정책 (RLS)

| 정책 | 대상 | 조건 |
|---|---|---|
| 랭킹 조회 | `select` · `authenticated` | 모두 허용 (`true`) |
| 점수 저장 | `insert` · `authenticated` | `user_id = auth.uid()` (자기 점수만 저장) |
| 수정·삭제 | — | 정책 없음 = 불가 |

### 7.3 생성 SQL (Supabase SQL Editor에서 실행)

```sql
create table public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 30),
  score      integer not null check (score between 0 and 1000000),
  created_at timestamptz not null default now()
);

create index scores_rank_idx on public.scores (score desc, created_at asc);

alter table public.scores enable row level security;

create policy "scores_select_authenticated"
  on public.scores for select to authenticated using (true);

create policy "scores_insert_own"
  on public.scores for insert to authenticated with check (user_id = auth.uid());
```

### 7.4 주요 쿼리 (클라이언트)

```js
// 저장
await supabase.from('scores').insert({ nickname, score });

// 랭킹 상위 20
await supabase.from('scores')
  .select('id, user_id, nickname, score, created_at')
  .order('score', { ascending: false })
  .order('created_at', { ascending: true })
  .limit(20);

// 내 최고 점수
await supabase.from('scores')
  .select('score').eq('user_id', user.id)
  .order('score', { ascending: false }).limit(1);
```

## 8. 환경변수

Vite는 `VITE_`로 시작하는 환경변수만 **빌드할 때** 브라우저 코드에 넣어 준다. 코드에서는 `import.meta.env.VITE_…`로 읽는다.

| 변수 | 예시 | 사용처 |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | `createClient` 첫 번째 인자 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | `createClient` 두 번째 인자 |

| 환경 | 저장 위치 |
|---|---|
| 로컬 개발 | 프로젝트 루트 `.env.local` (`.gitignore`에 포함, 커밋 금지) |
| 예시 파일 | `.env.example` — 변수 이름만 적고 값은 비워서 커밋 |
| Vercel | Project → Settings → Environment Variables (Production·Preview 모두). 값 변경 후 **재배포**해야 반영 |

규칙
- `src/lib/supabase.js` 한 곳에서만 환경변수를 읽어 클라이언트를 만든다. 값이 없으면 오류를 던지고 로그인 화면이 LOG-6을 표시한다.
- publishable 키는 브라우저에 공개되는 키다. 데이터 보호는 RLS(§7.2)로 한다.
- `service_role` / `sb_secret_…` 키, 카카오 REST API 키·Client Secret은 **절대** `VITE_` 변수나 프론트엔드 코드에 넣지 않는다. 카카오 키는 Supabase 대시보드에만 입력한다.

## 9. 프로젝트 구조

```
jewel-game/
├── index.html                 # Vite 진입 HTML
├── package.json
├── vite.config.js
├── vercel.json                # SPA rewrite
├── .env.example               # VITE_SUPABASE_URL=, VITE_SUPABASE_PUBLISHABLE_KEY=
├── supabase/
│   └── schema.sql             # §7.3 SQL
└── src/
    ├── main.jsx               # 라우터 + AuthProvider
    ├── App.jsx                # 라우트 정의
    ├── lib/
    │   └── supabase.js        # 환경변수 → createClient
    ├── auth/
    │   ├── AuthProvider.jsx   # 세션 상태 Context
    │   └── ProtectedRoute.jsx
    ├── pages/
    │   ├── LoginPage.jsx      # /
    │   └── GamePage.jsx       # /game
    ├── components/
    │   ├── UserBar.jsx        # 프로필·로그아웃
    │   ├── Hud.jsx            # 점수·남은 이동·내 최고 점수
    │   ├── GameBoard.jsx      # Canvas + 입력 처리
    │   ├── GameOverModal.jsx
    │   ├── RankingModal.jsx
    │   └── Toast.jsx
    ├── game/                  # React와 무관한 순수 로직 (테스트 가능)
    │   ├── constants.js       # N=8, TYPES=6, MAX_MOVES=30, 점수 상수
    │   ├── board.js           # newBoard, findMatches(줄+사각형), findMove, applyGravity, shuffle
    │   ├── scoring.js         # SCO-1~3 계산
    │   └── renderer.js        # drawGem, 파티클, 팝업 그리기
    ├── services/
    │   └── scores.js          # saveScore, fetchRanking, fetchMyBest
    └── styles.css
```

설계 원칙
- 보드 상태·애니메이션은 `GameBoard` 안의 `useRef` + `requestAnimationFrame` 루프에서 관리하고, 점수·이동 횟수·게임 종료 같은 **화면에 표시할 값만** `useState`로 올려 리렌더링을 최소화한다.
- `game/` 폴더는 DOM·React에 의존하지 않는 함수로 작성한다.

## 10. 외부 설정 체크리스트

| 위치 | 설정 | 상태 |
|---|---|---|
| Kakao Developers (앱 "보석게임", ID 1640537) | 카카오 로그인 ON | 완료 |
| 〃 | REST API 키 리다이렉트 URI: `https://<project-ref>.supabase.co/auth/v1/callback` | 완료 (`qmbmkcjwtbfzuypjzqqk` 기준) |
| 〃 | 동의항목: 닉네임(필수), 프로필 사진(선택) | 완료 |
| Supabase › Sign In / Providers › Kakao | Enabled, REST API Key, Client Secret, **Allow users without an email** ON | 필요 |
| Supabase › URL Configuration | Site URL: Vercel 주소. Redirect URLs: `https://<vercel 도메인>/**`, `http://localhost:5173/**` | 필요 |
| Supabase › SQL Editor | §7.3 SQL 실행 | 필요 |
| Vercel › Environment Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | 필요 |
| Vercel › Build | Framework Vite, `npm run build`, Output `dist` | 필요 |

> 사용할 Supabase 프로젝트를 하나로 확정하고, Kakao Developers의 리다이렉트 URI도 그 프로젝트 주소에 맞춘다.

## 11. 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 성능 | 게임 루프는 `requestAnimationFrame` 60fps, 프레임 간격 최대 50ms 제한. 게임 중 React 리렌더링은 점수·이동 변화 시에만. |
| 호환성 | 최신 Chrome·Edge·Safari·모바일 브라우저, 폭 360px 이상에서 가로 스크롤 없음. |
| 접근성 | 버튼은 `<button>`, 모달은 `role="dialog"`·포커스 이동·Esc 닫기. |
| 언어 | UI 문구 한국어. |
| 보안 | §8 규칙 준수, RLS 필수, 저장소에 `.env.local` 커밋 금지. |

## 12. 인수 기준

1. 로그인하지 않고 `/game`에 접속하면 로그인 화면(`/`)으로 이동한다.
2. 로그인 화면에서 카카오 로그인을 마치면 **자동으로 게임 화면**으로 이동하고, 닉네임·프로필이 보인다.
3. 새로고침해도 로그인과 게임 화면이 유지되고, 로그아웃하면 로그인 화면으로 돌아간다.
4. 3개 줄과 2×2 사각형이 제거되고 SCO-1~3대로 점수가 오른다. 맞지 않는 교환은 되돌아가고 이동이 줄지 않는다.
5. **점수 저장**을 누르면 `scores`에 1행이 추가되고 토스트가 뜨며, 같은 판에서 다시 누를 수 없다.
6. **점수 확인**을 누르면 상위 20개가 점수 내림차순으로 보이고, 내 기록이 강조된다.
7. 30회 이동 후 게임 종료 모달에서 저장·확인·다시 하기가 동작한다.
8. 소스 코드와 저장소에 Supabase 주소·키 값이 없고, Vercel 환경변수만으로 연결된다.
9. 다른 사용자의 `user_id`로 점수를 넣으려는 요청은 RLS로 거부된다.

## 13. 미결 사항

- 사용할 Supabase 프로젝트 확정 (현재 Kakao Provider 비활성 상태)
- Vercel 배포 도메인 확정 후 Redirect URL 등록
- 랭킹을 "모든 기록"이 아닌 "사용자별 최고 점수 1개"로 보여 줄지 여부 (현재: 모든 기록 상위 20개)
- 부정 점수 방지: 클라이언트가 점수를 보내므로 조작 가능. 필요 시 Edge Function 검증 도입
- 사각형 매칭 시 4개 이상 보너스(30)와 사각형 보너스(50) 중복 지급 여부 (현재 중복, 사각형 1개 = 120점)
- 기존 `jewel.html`·`index.html`(바닐라 버전)과 GitHub Pages 배포를 유지할지, React 버전으로 대체할지
