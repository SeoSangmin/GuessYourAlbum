# 3D Interactive Web Photo Album 📚

실제 책을 넘기는 듯한 3D 효과를 갖춘 나만의 반응형 웹 사진 앨범입니다. 
Next.js, Prisma, 그리고 로컬 SQLite를 기반으로 가볍고 빠르게 동작하며, 누구든 쉽게 로컬 환경에서 실행할 수 있습니다.

## ✨ 주요 기능 (Features)

- 📖 **3D 책장 넘김 효과:** 실제 앨범을 넘기는 듯한 부드러운 3D 애니메이션
- 📐 **커스텀 비율 지원:** 16:9, 4:3, 1:1 등 앨범 생성 시 원하는 사진 비율 적용
- 📸 **직관적인 UI (Drag & Drop):** 사진 업로드 및 사진 간 위치 변경(이동)을 드래그 앤 드롭으로 지원
- 🔍 **스마트 확대/축소:** 브라우저 창 크기에 맞춰 UI를 침범하지 않는 가장 최적화된 최대 크기로 자동 렌더링
- ⬇️ **데이터 내보내기 (Export):**
  - **사진 이름 추출:** 앨범 순서대로 파일명을 추출하여 Excel 호환 `CSV` 다운로드
  - **원본 사진 백업:** 압축 손실 없이 업로드한 원본 사진 전체를 폴더로 묶어 `ZIP` 다운로드
- 🔒 **로컬 프라이버시 최적화:** 외부 서버 통신 없이 개인의 디스크(SQLite & 로컬 폴더)에 안전하게 데이터 보관

---

## 🚀 로컬 환경 실행 방법 (How to run locally)

### 1. 요구 사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [Git](https://git-scm.com/)

### 2. 설치 및 실행 (Installation)

```bash
# 1. 저장소 클론 (Clone the repository)
git clone 저장소_주소를_여기에_입력하세요
cd 폴더명

# 2. 패키지 모듈 설치 (Install dependencies)
npm install

# 3. 로컬 데이터베이스 초기화 및 생성 (Initialize Database)
npx prisma db push

# 4. 개발 서버 실행 (Start Development Server)
npm run dev
```

### 3. 접속 (Access)
서버가 실행되면 브라우저를 열고 아래 주소로 접속하세요:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚠️ 데이터 프라이버시 안내 (Privacy Policy for Git)

본 프로젝트는 깃허브(Github)에 코드를 업로드하거나 공유할 때 **사용자의 개인 사진과 DB 기록이 유출되지 않도록 완벽하게 차단**되어 있습니다.

미리 작성된 `.gitignore` 설정을 통해 다음 항목들은 Git 저장소에 업로드되지 않습니다:
- 🖼️ 사용자가 업로드한 실제 사진 파일들 (`/public/uploads/`)
- 🗄️ 개인 기록이 담긴 데이터베이스 파일들 (`/prisma/dev.db` 등)

따라서 코드를 마음껏 포크(Fork)하거나 푸시(Push)하셔도 개인 프라이버시가 보호되니 안심하고 사용하세요!
