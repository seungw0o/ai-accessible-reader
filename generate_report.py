from fpdf import FPDF

class ReportPDF(FPDF):
    def header(self):
        self.add_font("ArialUnicode", "", "/Library/Fonts/Arial Unicode.ttf")
        self.set_font("ArialUnicode", size=16)
        self.cell(0, 10, "개발일지(2차)", ln=True, align="C")
        self.ln(10)

    def draw_table_row(self, label1, val1, label2=None, val2=None):
        self.set_font("ArialUnicode", size=10)
        self.set_fill_color(240, 240, 240)
        
        # Calculate widths
        w1 = 40
        w2 = 55
        
        self.cell(w1, 10, label1, border=1, fill=True)
        self.cell(w2, 10, val1, border=1)
        
        if label2:
            self.cell(w1, 10, label2, border=1, fill=True)
            self.cell(w2, 10, val2, border=1)
        
        self.ln()

    def add_section(self, title, content_dict):
        self.set_font("ArialUnicode", size=12)
        self.set_fill_color(240, 240, 240)
        
        # Section title row
        self.cell(40, 0, title, border=1, fill=True) # Placeholder for height, will use multi_cell
        
        # Get current y to draw the left title column
        start_y = self.get_y()
        
        # Content part
        self.set_x(50)
        self.set_font("ArialUnicode", size=10)
        
        content_text = ""
        for k, v in content_dict.items():
            content_text += f"* {k}:\n{v}\n\n"
        
        self.multi_cell(0, 5, content_text, border=1)
        end_y = self.get_y()
        
        # Draw the title box covering the height
        self.set_y(start_y)
        self.set_x(10)
        self.cell(40, end_y - start_y, title, border=1, fill=True, align='C')
        self.set_y(end_y)
        self.ln(5)

pdf = ReportPDF()
pdf.add_page()

# Header table
pdf.draw_table_row("개발기간", "2026년 6월 1일 - 6월 7일")
pdf.draw_table_row("학 번", "3212", "성 명", "정승우")
pdf.draw_table_row("프로젝트 주제", "AI 시각장애인·난독증 사용자를 위한 웹 페이지 요약 & 리더기")

pdf.ln(5)

# Section 1: 기능 구현 및 진행상황
pdf.add_section("기능 구현 및\n진행상항", {
    "이번 주 목표 및 진행률": "2주차 목표는 사용자가 URL을 입력하면 웹페이지에서 광고나 메뉴 등을 제외한 핵심 본문만 추출하는 기능을 구현하는 것이었습니다. Node.js 백엔드 서버 구축, 본문 추출 알고리즘(Readability) 연동, 프론트엔드 API 호출 및 결과 렌더링까지 완료하여 2주차 목표를 100% 달성하였습니다.",
    "주요 개발 내용": "이번 주에는 실제 데이터 처리를 위한 백엔드 환경을 구축하였습니다. 프론트엔드(React)에서 직접 외부 웹사이트를 크롤링할 때 발생하는 CORS 문제를 해결하기 위해 Node.js Express 서버를 별도로 구성하였습니다. 본문 추출을 위해 Mozilla의 Readability 라이브러리와 JSDOM을 활용하였으며, 이를 통해 웹페이지의 복잡한 구조 속에서 순수 본문 텍스트와 HTML 구조를 효과적으로 분리해낼 수 있게 되었습니다. 프론트엔드에서는 사용자가 URL을 입력하고 '분석 시작' 버튼을 누르면 서버와 통신하여 결과를 받아오고, 분석 중임을 나타내는 진행 상태바(Progress Bar)를 구현하여 사용자 피드백을 강화하였습니다. 추출된 본문은 ReaderView 화면에 깔끔하게 렌더링되도록 연동하였습니다."
})

# Section 2: 이슈 관리 및 해결 과정
pdf.add_section("이슈 관리 및\n해결 과정", {
    "발생한 이슈": "백엔드 서버 구축 과정에서 TypeScript 설정 및 모듈 시스템(ESM vs CommonJS) 충돌로 인해 ts-node 실행 시 에러가 발생하여 서버가 구동되지 않는 문제가 있었습니다. 또한, 일부 웹사이트의 경우 보안 정책이나 복잡한 HTML 구조로 인해 본문 추출 결과가 부정확하거나 빈 값으로 반환되는 경우가 발생하였습니다.",
    "원인 분석": "package.json의 type: module 설정과 TypeScript의 컴파일 옵션이 일치하지 않아 발생한 문제였으며, ts-node가 최신 ESM 문법을 완벽히 처리하지 못하는 것이 원인이었습니다. 파싱 이슈는 웹사이트마다 본문을 담고 있는 태그의 ID나 클래스명이 제각각이기 때문에 범용적인 알고리즘 적용에 한계가 있었습니다.",
    "해결 과정 및 결과": "ts-node 대신 ESM을 더 잘 지원하는 tsx 라이브러리로 교체하고 package.json 설정을 수정하여 서버 구동 문제를 해결하였습니다. 본문 추출 정확도를 높이기 위해 Readability 라이브러리의 파라미터를 조정하고, 파싱 실패 시 사용자에게 알림을 주는 예외 처리 로직을 추가하였습니다."
})

# Section 3: KPT 회고 및 차주 계획
pdf.add_section("KPT 회고 및\n차주 계획", {
    "Keep (유지할 점)": "백엔드 서버를 통한 안정적인 데이터 처리 및 CORS 문제 해결 방식. 사용자에게 진행 상태를 시각적으로 보여주는 UI 구성.",
    "Problem (문제점/아쉬운 점)": "요약 기능이 아직 없어 긴 본문을 그대로 읽어야 하는 부담이 남아 있음.",
    "Try (시도할 점/개선 방향)": "OpenAI 또는 Claude API를 연동하여 추출된 본문을 3문장으로 요약하는 기능 추가.",
    "차주 개발 계획": "3주차: AI 요약 기능(OpenAI/Claude API) 및 TTS 음성 읽기 기능 구현."
})

pdf.output("개발일지_2차.pdf")
