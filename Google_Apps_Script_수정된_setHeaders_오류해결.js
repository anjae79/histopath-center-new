// =========================================
// 📡 부산대학교 의과대학 조직병리코어센터
// 🚀 Google Apps Script - setHeaders 오류 해결 버전
// 📅 2025-06-27 setHeaders 오류 수정
// =========================================

const CONFIG = {
  SHEET_ID: '1hbM1bd2N2F7icdss-exCBjBOAkRQ-PfKnsKsnvVQbHk',
  ADMIN_EMAIL: 'histopath.pnu@gmail.com',
  SHEET_NAME: 'Application_Data'
};

// =========================================
// 📤 POST 요청 처리 (메인 함수)
// =========================================
function doPost(e) {
  try {
    console.log('📡 POST 요청 수신');
    console.log('요청 데이터:', JSON.stringify(e || {}));
    
    let data;
    
    // FormData 방식으로 전송된 데이터 처리
    if (e && e.parameter && e.parameter.data) {
      console.log('📦 FormData에서 데이터 추출');
      data = JSON.parse(e.parameter.data);
    }
    // JSON 방식으로 전송된 데이터 처리 
    else if (e && e.postData && e.postData.contents) {
      console.log('📦 PostData에서 데이터 추출');
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.log('JSON 파싱 실패, URL 디코딩 시도');
        const decoded = decodeURIComponent(e.postData.contents);
        data = JSON.parse(decoded);
      }
    }
    // 직접 parameter 사용
    else if (e && e.parameter) {
      console.log('📦 직접 Parameter 사용');
      data = e.parameter;
    }
    else {
      throw new Error('요청 데이터를 찾을 수 없습니다');
    }
    
    console.log('✅ 파싱된 데이터:', JSON.stringify(data));
    
    // 필수 데이터 검증
    if (!data || !data.name || !data.email) {
      throw new Error('필수 데이터(이름, 이메일)가 누락되었습니다');
    }
    
    // 📋 1단계: 스프레드시트에 저장
    console.log('📋 스프레드시트 저장 시작...');
    const receiptNumber = saveToSheet(data);
    console.log('✅ 접수번호 생성:', receiptNumber);
    
    // 📧 2단계: 이메일 발송
    console.log('📧 이메일 발송 시작...');
    sendEmail(data, receiptNumber);
    console.log('✅ 이메일 발송 완료');
    
    // ✅ 성공 응답 (setHeaders 제거)
    const successResponse = {
      success: true,
      message: '신청이 성공적으로 접수되었습니다',
      receiptNumber: receiptNumber,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 처리 완료:', receiptNumber);
    
    return ContentService
      .createTextOutput(JSON.stringify(successResponse))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ POST 처리 오류:', error);
    
    const errorResponse = {
      success: false,
      message: '오류가 발생했습니다: ' + error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================
// 🔄 GET 요청 처리 (setHeaders 오류 수정)
// =========================================
function doGet(e) {
  try {
    console.log('📡 GET 요청 수신');
    
    // JSONP 콜백 지원 (기존 호환성)
    if (e && e.parameter && e.parameter.callback) {
      console.log('📞 JSONP 요청 처리');
      
      if (e.parameter.data) {
        const data = JSON.parse(e.parameter.data);
        const receiptNumber = saveToSheet(data);
        sendEmail(data, receiptNumber);
        
        const result = {
          success: true,
          message: '신청이 성공적으로 접수되었습니다',
          receiptNumber: receiptNumber
        };
        
        const jsonpResponse = e.parameter.callback + '(' + JSON.stringify(result) + ');';
        return ContentService
          .createTextOutput(jsonpResponse)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }
    
    // 일반 GET 요청 (상태 확인) - setHeaders 제거
    const output = {
      message: '부산대학교 의과대학 조직병리코어센터 신청 시스템',
      status: 'ready',
      version: '2.1 - setHeaders 오류 수정',
      methods: ['POST', 'GET'],
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('❌ GET 처리 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '오류: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================
// 📋 스프레드시트 저장
// =========================================
function saveToSheet(data) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    
    // 시트가 없으면 생성
    if (!sheet) {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      const newSheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      
      // 헤더 추가
      newSheet.getRange(1, 1, 1, 14).setValues([[
        '접수번호', '접수일시', '신청자명', '소속기관', '부서/학과', 
        '이메일', '연락처', '검체명', '신청서비스', '검체종류', 
        '고정액', '특별요청', '처리상태', '비고'
      ]]);
    }
    
    const receiptNumber = generateReceiptNumber();
    const timestamp = new Date();
    
    // 데이터 행 추가
    sheet.appendRow([
      receiptNumber,
      timestamp,
      data.name || '',
      data.institution || '',
      data.department || '',
      data.email || '',
      data.phone || '',
      data.sampleName || '',
      JSON.stringify(data.services || []),
      JSON.stringify(data.sampleType || []),
      JSON.stringify(data.fixative || []),
      data.specialRequests || '',
      'Received',
      ''
    ]);
    
    console.log('✅ 스프레드시트 저장 완료:', receiptNumber);
    return receiptNumber;
    
  } catch (error) {
    console.error('❌ 스프레드시트 저장 실패:', error);
    throw error;
  }
}

// =========================================
// 📊 접수번호 생성
// =========================================
function generateReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const todayKey = year + month + day;
  const properties = PropertiesService.getScriptProperties();
  let counter = parseInt(properties.getProperty(todayKey) || '0');
  counter += 1;
  properties.setProperty(todayKey, counter.toString());
  
  return year + month + day + '-' + counter.toString().padStart(3, '0');
}

// =========================================
// 📧 이메일 발송 시스템
// =========================================
function sendEmail(data, receiptNumber) {
  try {
    console.log('📧 이메일 발송 시작');
    
    // PDF 생성 (이미지가 있으면 포함, 없으면 텍스트만)
    const pdfBlob = createPDF(data, receiptNumber);
    const fileName = `조직병리코어센터_신청서_${receiptNumber}.pdf`;
    
    // 관리자에게 이메일 발송
    sendAdminEmail(data, receiptNumber, pdfBlob, fileName);
    
    // 신청자에게 이메일 발송
    if (data.email) {
      sendUserEmail(data, receiptNumber, pdfBlob, fileName);
    }
    
    console.log('✅ 이메일 발송 완료');
    
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    throw error;
  }
}

// =========================================
// 📄 PDF 생성
// =========================================
function createPDF(data, receiptNumber) {
  try {
    console.log('📄 PDF 생성 시작');
    
    // 새 Google 문서 생성
    const doc = DocumentApp.create(`조직병리코어센터_신청서_${receiptNumber}`);
    const body = doc.getBody();
    
    // 문서 스타일 설정
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Malgun Gothic';
    style[DocumentApp.Attribute.FONT_SIZE] = 11;
    body.setAttributes(style);
    
    // 제목
    const title = body.appendParagraph('부산대학교 의과대학 조직병리코어센터 신청서');
    title.setHeading(DocumentApp.ParagraphHeading.TITLE);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    // 접수번호
    body.appendParagraph(`접수번호: ${receiptNumber}`).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    body.appendParagraph('');
    
    // 신청자 정보
    body.appendParagraph('■ 신청자 정보').setBold(true);
    body.appendParagraph(`이름: ${data.name || ''}`);
    body.appendParagraph(`소속기관: ${data.institution || ''}`);
    body.appendParagraph(`부서/학과: ${data.department || ''}`);
    body.appendParagraph(`연락처: ${data.phone || ''}`);
    body.appendParagraph(`이메일: ${data.email || ''}`);
    body.appendParagraph('');
    
    // 신청 내역
    body.appendParagraph('■ 신청 내역').setBold(true);
    if (data.services && data.services.length > 0) {
      data.services.forEach(service => {
        body.appendParagraph(`• ${service.category}: ${service.items.join(', ')}`);
      });
    }
    body.appendParagraph('');
    
    // 검체 정보
    body.appendParagraph('■ 검체 정보').setBold(true);
    body.appendParagraph(`검체명: ${data.sampleName || ''}`);
    body.appendParagraph(`검체종류: ${(data.sampleType || []).join(', ')}`);
    body.appendParagraph(`고정액: ${(data.fixative || []).join(', ')}`);
    if (data.specialRequests) {
      body.appendParagraph(`특별요청사항: ${data.specialRequests}`);
    }
    body.appendParagraph('');
    
    // 이미지가 있으면 추가
    if (data.capturedImage && data.capturedImage !== null) {
      try {
        console.log('🖼️ 캡처된 이미지를 PDF에 추가');
        const imageBlob = Utilities.newBlob(
          Utilities.base64Decode(data.capturedImage.split(',')[1]),
          'image/jpeg',
          'captured_form.jpg'
        );
        
        body.appendParagraph('■ 신청서 이미지').setBold(true);
        body.appendImage(imageBlob);
      } catch (imageError) {
        console.error('🖼️ 이미지 추가 실패:', imageError);
        body.appendParagraph('■ 신청서 이미지').setBold(true);
        body.appendParagraph('(이미지 처리 중 오류가 발생했습니다)');
      }
    }
    
    // 문서를 PDF로 변환
    const pdfBlob = doc.getAs('application/pdf');
    
    // 임시 문서 삭제
    DriveApp.getFileById(doc.getId()).setTrashed(true);
    
    console.log('✅ PDF 생성 완료');
    return pdfBlob;
    
  } catch (error) {
    console.error('❌ PDF 생성 실패:', error);
    throw error;
  }
}

// =========================================
// 📧 관리자 이메일 발송
// =========================================
function sendAdminEmail(data, receiptNumber, pdfBlob, fileName) {
  try {
    const subject = `[조직병리코어센터] 새 신청 접수 - ${receiptNumber}`;
    
    const body = `
새로운 조직병리 분석 신청이 접수되었습니다.

■ 접수 정보
- 접수번호: ${receiptNumber}
- 접수일시: ${new Date().toLocaleString('ko-KR')}

■ 신청자 정보
- 이름: ${data.name || ''}
- 소속기관: ${data.institution || ''}
- 부서/학과: ${data.department || ''}
- 연락처: ${data.phone || ''}
- 이메일: ${data.email || ''}

■ 신청 내역
- 검체명: ${data.sampleName || ''}
- 검체종류: ${(data.sampleType || []).join(', ')}
- 고정액: ${(data.fixative || []).join(', ')}
- 특별요청: ${data.specialRequests || '없음'}

■ 신청 서비스
${data.services ? data.services.map(service => `- ${service.category}: ${service.items.join(', ')}`).join('\n') : '없음'}

자세한 내용은 첨부된 PDF 파일을 확인해주세요.

--
부산대학교 의과대학 조직병리코어센터 자동 알림 시스템
    `;
    
    const attachments = pdfBlob ? [{
      fileName: fileName,
      content: pdfBlob.getBytes(),
      mimeType: 'application/pdf'
    }] : [];
    
    GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body, {
      attachments: attachments
    });
    
    console.log('✅ 관리자 이메일 발송 완료');
    
  } catch (error) {
    console.error('❌ 관리자 이메일 발송 실패:', error);
    throw error;
  }
}

// =========================================
// 📧 신청자 이메일 발송
// =========================================
function sendUserEmail(data, receiptNumber, pdfBlob, fileName) {
  try {
    const subject = `[조직병리코어센터] 신청 접수 완료 - ${receiptNumber}`;
    
    const body = `
${data.name}님, 안녕하세요.

조직병리 분석 신청이 성공적으로 접수되었습니다.

■ 접수 정보
- 접수번호: ${receiptNumber}
- 접수일시: ${new Date().toLocaleString('ko-KR')}

■ 다음 단계
1. 담당자가 신청 내용을 검토합니다
2. 검토 완료 후 개별 연락드립니다
3. 검체 접수 일정을 안내해드립니다

■ 검체 접수 안내
- 접수 시간: 평일 15:00-17:00
- 접수 장소: 첨단의생명융합센터 202호
- 문의 전화: 051-510-8057, 8525

■ 검체 준비 사항
- 고정액: 10% NBF 사용 권장
- 검체 크기: 5mm 이하
- 고정액 양: 조직 크기의 10-15배
- 라벨링: 영문/숫자 8자 이내

궁금한 사항이 있으시면 언제든 연락주세요.

감사합니다.

--
부산대학교 의과대학 조직병리코어센터
전화: 051-510-8057, 8525
이메일: histopath.pnu@gmail.com
    `;
    
    const attachments = pdfBlob ? [{
      fileName: fileName,
      content: pdfBlob.getBytes(),
      mimeType: 'application/pdf'
    }] : [];
    
    GmailApp.sendEmail(data.email, subject, body, {
      attachments: attachments
    });
    
    console.log('✅ 신청자 이메일 발송 완료');
    
  } catch (error) {
    console.error('❌ 신청자 이메일 발송 실패:', error);
    throw error;
  }
}

// =========================================
// 🧪 테스트 함수
// =========================================
function testPOST() {
  const testData = {
    name: '테스트 사용자',
    institution: '부산대학교',
    department: '의과대학',
    email: 'test@example.com',
    phone: '010-1234-5678',
    sampleName: '테스트 검체',
    sampleType: ['조직'],
    fixative: ['10% NBF'],
    services: [{
      category: '면역조직화학염색 (IHC)',
      items: ['Ki-67']
    }],
    specialRequests: '테스트용 신청입니다'
  };
  
  try {
    const receiptNumber = saveToSheet(testData);
    sendEmail(testData, receiptNumber);
    console.log('✅ 테스트 완료:', receiptNumber);
    return receiptNumber;
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    return error.toString();
  }
} 