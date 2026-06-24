# AI 웹 페이지 요약 & 리더기

시각장애인 및 난독증 사용자를 위한 웹 콘텐츠 접근성 도구입니다.

## 주요 기능
- **본문 추출**: 광고, 메뉴 등을 제외한 핵심 본문 파싱 (2차 스프린트 완료)
- **AI 요약**: 긴 글을 3문장으로 요약 (3차 스프린트 예정)
- **음성 리더**: 웹 페이지 내용을 음성으로 읽어줌 (3차 스프린트 예정)
- **접근성 설정**: 글꼴, 자간, 고대비 등 커스텀 (4차 스프린트 예정)

## 실행 방법

### 1. 백엔드 서버 실행
```bash
cd server
npm install
npm run dev
```
서버는 `http://localhost:3001`에서 실행됩니다.
Claude 요약을 사용하려면 `server/.env`에 `ANTHROPIC_API_KEY`를 설정하세요. 모델은 기본값으로 `claude-sonnet-4-6`을 사용하며, 필요하면 `ANTHROPIC_MODEL` 환경변수로 바꿀 수 있습니다.

### 2. 프론트엔드 실행
```bash
npm install
npm run dev
```
프론트엔드는 `http://localhost:5173` (기본값)에서 실행됩니다.
개발 환경에서는 프론트엔드의 `/api/*` 요청이 Vite 프록시를 통해 `http://localhost:3001` 백엔드로 전달됩니다.

### 3. 프로덕션 빌드 실행
```bash
npm run build
cd server
npm run start
```
빌드 후에는 Express 서버가 `dist`의 프론트엔드 파일과 `/api/*` 엔드포인트를 함께 제공합니다.

## 기술 스택
- **Frontend**: React, TypeScript, Mantine UI
- **Backend**: Node.js (Express), Axios, JSDOM, @mozilla/readability
- **AI**: OpenAI/Claude API (예정)
