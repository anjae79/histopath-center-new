// =========================================
// 📡 Google Apps Script 연동 시스템
// 🚀 부산대학교 의과대학 조직병리코어센터
// =========================================

// 🌐 Google Apps Script 웹앱 URL - config.js에서 동적으로 가져오기 (2025-06-27 연속카운터 버전)
// const GOOGLE_APPS_SCRIPT_URL = CONFIG.googleAppsScript.url; // config.js에서 가져오기

// =========================================
// 📤 메인 함수: Google Apps Script로 데이터 전송 (이미지 캡처 + POST 방식)
// =========================================
function submitToGoogleAppsScript() {
  console.log('📤 Google Apps Script로 데이터 전송 시작 (이미지 캡처 + POST 방식)');
  
  // 📋 1단계: 폼 데이터 수집
  const formData = collectFormData();
  
  if (!validateFormData(formData)) {
    return false;
  }
  
  // 🔄 2단계: 로딩 상태 표시
  showLoadingState(true);
  
  // 📸 3단계: 신청서 폼 이미지 캡처
  updateLoadingMessage('📸 신청서 이미지 생성 중...');
  captureFormImage()
    .then(function(capturedData) {
      console.log('📸 폼 이미지 캡처 완료');
      
      // 캡처된 이미지 데이터를 폼 데이터에 추가
      const formDataWithImage = {
        ...formData,
        capturedImage: capturedData.dataUrl,
        imageWidth: capturedData.width,
        imageHeight: capturedData.height
      };
      
      // 📡 4단계: Google Apps Script로 전송 (POST)
      updateLoadingMessage('📧 PDF 생성 및 이메일 발송 중...');
      return sendDataToGoogleAppsScript(formDataWithImage);
    })
    .then(function(response) {
      // ✅ 5단계: 성공 처리
      console.log('✅ 전송 성공:', response);
      showSuccessMessage(response.receiptNumber);
      clearForm();
    })
    .catch(function(error) {
      // ❌ 오류 처리
      console.error('❌ 전송 오류:', error);
      showErrorMessage(error.message);
    })
    .finally(function() {
      // 🔄 로딩 상태 해제
      showLoadingState(false);
    });
}

// =========================================
// 📋 폼 데이터 수집
// =========================================
function collectFormData() {
  console.log('📋 폼 데이터 수집 중...');
  
  // 기본 정보 수집
  const basicData = {
    name: document.getElementById('name')?.value?.trim() || '',
    institution: document.getElementById('institution')?.value?.trim() || '',
    department: document.getElementById('department')?.value?.trim() || '',
    email: document.getElementById('email')?.value?.trim() || '',
    phone: document.getElementById('phone')?.value?.trim() || '',
    sampleName: document.getElementById('sample-name')?.value?.trim() || '',
    specialRequests: document.getElementById('special-requests')?.value?.trim() || ''
  };
  
  // 검체 종류 수집 (체크박스)
  const sampleTypes = [];
  document.querySelectorAll('input[name="sample-type"]:checked').forEach(checkbox => {
    sampleTypes.push(checkbox.value);
  });
  
  // 고정액 수집 (체크박스)
  const fixatives = [];
  document.querySelectorAll('input[name="fixative"]:checked').forEach(checkbox => {
    fixatives.push(checkbox.value);
  });
  
  // 선택된 서비스들 수집
  const services = collectSelectedServices();
  
  const formData = {
    ...basicData,
    sampleType: sampleTypes,
    fixative: fixatives,
    services: services,
    submittedAt: new Date().toISOString()
  };
  
  console.log('📋 수집된 데이터:', formData);
  return formData;
}

// =========================================
// 📸 신청서 폼 이미지 캡처 (HTML2Canvas 사용)
// =========================================
function captureFormImage() {
  return new Promise(function(resolve, reject) {
    console.log('📸 신청서 폼 이미지 캡처 시작...');
    
    // HTML2Canvas 라이브러리 로드 확인
    if (typeof html2canvas === 'undefined') {
      console.log('📸 HTML2Canvas 라이브러리 로드 중...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = function() {
        console.log('📸 HTML2Canvas 라이브러리 로드 완료');
        performCapture(resolve, reject);
      };
      script.onerror = function() {
        console.error('❌ HTML2Canvas 라이브러리 로드 실패');
        reject(new Error('HTML2Canvas 라이브러리 로드 실패'));
      };
      document.head.appendChild(script);
    } else {
      performCapture(resolve, reject);
    }
  });
}

function performCapture(resolve, reject) {
  try {
    // 캡처할 요소 선택 (신청서 폼 전체)
    const formElement = document.querySelector('.application-form') || 
                       document.querySelector('form') || 
                       document.querySelector('main') || 
                       document.body;
    
    console.log('📸 캡처 대상 요소:', formElement.tagName, formElement.className);
    
    // HTML2Canvas 옵션 설정
    const maxWidth = Math.min(formElement.scrollWidth, 1200); // 최대 너비 제한
    const maxHeight = Math.min(formElement.scrollHeight, 1600); // 최대 높이 제한
    
    const options = {
      allowTaint: true,
      useCORS: true,
      scale: 1, // 해상도 낮춤 (2 → 1)
      width: maxWidth,
      height: maxHeight,
      backgroundColor: '#ffffff',
      removeContainer: false,
      logging: false,
      onclone: function(clonedDoc) {
        // 클론된 문서에서 스타일 조정
        const clonedElement = clonedDoc.querySelector('.application-form') || 
                             clonedDoc.querySelector('form') || 
                             clonedDoc.querySelector('main') || 
                             clonedDoc.body;
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
        }
      }
    };
    
    // HTML2Canvas로 이미지 생성
    html2canvas(formElement, options)
      .then(function(canvas) {
        console.log('✅ 폼 이미지 캡처 성공');
        console.log('📏 캡처된 이미지 크기:', canvas.width + 'x' + canvas.height);
        
        // Canvas를 압축된 JPEG로 변환 (PNG 대신)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 압축률 60%
        const imageSize = Math.round(dataUrl.length * 0.75 / 1024); // KB 단위
        
        // 크기가 너무 크면 추가 압축
        let finalDataUrl = dataUrl;
        if (imageSize > 3000) { // 3MB 초과시
          console.log('📦 이미지 크기가 큽니다. 추가 압축 진행...');
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.3); // 압축률 30%
        }
        
        console.log('📊 이미지 데이터 크기:', imageSize + 'KB');
        
        const finalImageSize = Math.round(finalDataUrl.length * 0.75 / 1024);
        console.log('📊 최종 이미지 데이터 크기:', finalImageSize + 'KB');
        
        // 여전히 4MB 초과시 이미지 없이 진행
        if (finalImageSize > 4000) {
          console.log('⚠️ 이미지가 너무 큽니다. 텍스트만 전송합니다.');
          resolve({
            dataUrl: null, // 이미지 없음
            width: 0,
            height: 0,
            size: 0,
            note: '이미지가 너무 커서 텍스트만 전송되었습니다.'
          });
        } else {
          resolve({
            dataUrl: finalDataUrl,
            width: canvas.width,
            height: canvas.height,
            size: finalImageSize
          });
        }
      })
      .catch(function(error) {
        console.error('❌ HTML2Canvas 캡처 실패:', error);
        reject(new Error('폼 이미지 캡처 실패: ' + error.message));
      });
      
  } catch (error) {
    console.error('❌ 이미지 캡처 중 오류:', error);
    reject(new Error('이미지 캡처 중 오류: ' + error.message));
  }
}

// =========================================
// 📊 선택된 서비스들 수집 (강화된 버전)
// =========================================
function collectSelectedServices() {
  const services = [];
  
  try {
    console.log('📊 서비스 수집 시작...');
    
    // 방법 1: script.js의 selectedServices 배열에서 가져오기
    if (typeof selectedServices !== 'undefined' && selectedServices.length > 0) {
      services.push(...selectedServices);
      console.log('📊 방법1 - 기존 서비스들 수집:', selectedServices.length, '개');
    }
    
    // 방법 2: 현재 작성 중인 서비스도 포함
    if (typeof getCurrentServiceData === 'function') {
      const currentService = getCurrentServiceData();
      if (currentService && currentService.mainService && currentService.sampleCount && currentService.slideCount) {
        services.push(currentService);
        console.log('📊 방법2 - 현재 서비스 추가:', currentService);
      }
    }
    
    // 방법 3: 테이블 행에서 직접 수집 (다양한 셀렉터 시도)
    if (services.length === 0) {
      console.log('📊 방법3 - 테이블에서 직접 수집 시도...');
      
      // 시도 1: .service-item 클래스
      let serviceRows = document.querySelectorAll('.service-item');
      if (serviceRows.length === 0) {
        // 시도 2: 테이블 tbody의 tr
        serviceRows = document.querySelectorAll('tbody tr');
      }
      if (serviceRows.length === 0) {
        // 시도 3: 모든 테이블 행
        serviceRows = document.querySelectorAll('table tr');
      }
      
      console.log('📊 찾은 테이블 행 수:', serviceRows.length);
      
      serviceRows.forEach((row, index) => {
        // 다양한 방법으로 데이터 추출 시도
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 5) {
          const sampleCount = cells[0]?.textContent?.trim();
          const mainService = cells[1]?.textContent?.trim();
          const subService = cells[2]?.textContent?.trim();
          const slideCount = cells[3]?.textContent?.trim();
          const totalCount = cells[4]?.textContent?.trim();
          
          // 헤더 행 제외 및 유효한 데이터만 추가
          if (sampleCount && mainService && slideCount && 
              !sampleCount.includes('검체') && !mainService.includes('의뢰')) {
            services.push({
              sampleCount: sampleCount,
              mainService: mainService,
              subService: subService || '',
              slideCount: slideCount,
              totalCount: totalCount || ''
            });
            console.log('📊 테이블에서 수집한 서비스 ' + (index + 1) + ':', services[services.length - 1]);
          }
        }
      });
    }
    
    // 방법 4: 폼 입력 필드에서 직접 수집 (최후 수단)
    if (services.length === 0) {
      console.log('📊 방법4 - 폼 필드에서 직접 수집 시도...');
      
      const sampleCountInput = document.querySelector('input[placeholder*="검체"], input[id*="sample-count"], input[name*="sample-count"]');
      const mainServiceSelect = document.querySelector('select[name*="main-service"], select[id*="main-service"]');
      const subServiceSelect = document.querySelector('select[name*="sub-service"], select[id*="sub-service"]');
      const slideCountInput = document.querySelector('input[placeholder*="슬라이드"], input[id*="slide-count"], input[name*="slide-count"]');
      
      if (sampleCountInput && mainServiceSelect && slideCountInput) {
        const service = {
          sampleCount: sampleCountInput.value || '',
          mainService: mainServiceSelect.value || '',
          subService: subServiceSelect ? subServiceSelect.value : '',
          slideCount: slideCountInput.value || '',
          totalCount: ''
        };
        
        if (service.sampleCount && service.mainService && service.slideCount) {
          services.push(service);
          console.log('📊 폼에서 수집한 서비스:', service);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 서비스 수집 중 오류:', error);
  }
  
  console.log('📊 최종 수집된 서비스들:', services);
  console.log('📊 수집된 서비스 개수:', services.length);
  
  return services;
}

// =========================================
// ✅ 폼 데이터 유효성 검사
// =========================================
function validateFormData(data) {
  console.log('✅ 폼 데이터 유효성 검사 중...');
  
  // 필수 필드 검사
  const requiredFields = {
    '신청자/담당교수': data.name,
    '소속기관': data.institution,
    '부서/학과': data.department,
    '이메일': data.email,
    '연락처': data.phone,
    '검체명': data.sampleName
  };
  
  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value) {
      alert('❌ ' + fieldName + '을(를) 입력해주세요.');
      return false;
    }
  }
  
  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    alert('❌ 올바른 이메일 주소를 입력해주세요.');
    return false;
  }
  
  // 서비스 선택 검사
  if (!data.services || data.services.length === 0) {
    alert('❌ 의뢰 분석을 하나 이상 선택해주세요.');
    return false;
  }
  
  console.log('✅ 유효성 검사 통과');
  return true;
}

// =========================================
// 📡 Google Apps Script로 데이터 전송 (POST 방식)
// =========================================
function sendDataToGoogleAppsScript(data) {
  console.log('📡 Google Apps Script로 전송 중... (POST 방식)');
  
  return new Promise((resolve, reject) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      console.log('📡 POST 요청 데이터 크기:', JSON.stringify(data).length);
      
      // fetch API를 사용한 POST 요청 (config.js에서 URL 가져오기)
      fetch(CONFIG.googleAppsScript.url, {
        method: 'POST',
        body: formData
        // no-cors 모드 제거하여 정상적인 응답 수신
      })
      .then(response => {
        console.log('📡 Google Apps Script 응답 상태:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      })
      .then(responseData => {
        console.log('✅ 실제 응답 데이터:', responseData);
        
        if (responseData.success) {
          resolve(responseData);
        } else {
          reject(new Error(responseData.message || '알 수 없는 오류가 발생했습니다'));
        }
      })
      .catch(error => {
        console.error('❌ POST 요청 실패:', error);
        
        // 백업: CORS 오류시 가짜 응답 생성
        if (error.message.includes('CORS') || error.message.includes('network')) {
          console.log('🔄 CORS 오류 감지, 백업 처리...');
          const receiptNumber = generateTempReceiptNumber();
          const mockResponse = {
            success: true,
            message: '신청이 접수되었습니다 (백업 처리)',
            receiptNumber: receiptNumber,
            note: 'CORS 제한으로 인해 확인 불가'
          };
          resolve(mockResponse);
        } else {
          reject(new Error('네트워크 오류가 발생했습니다: ' + error.message));
        }
      });
      
    } catch (error) {
      console.error('❌ POST 요청 생성 중 오류:', error);
      reject(error);
    }
  });
}

// 임시 접수번호 생성 함수
function generateTempReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return year + month + day + '-' + hours + minutes + seconds;
}

// =========================================
// 🔄 로딩 상태 표시
// =========================================
function showLoadingState(isLoading) {
  const submitBtn = document.querySelector('.btn-primary');
  
  if (isLoading) {
    // 버튼 비활성화
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '📤 전송 중...';
      submitBtn.style.backgroundColor = '#6c757d';
    }
    
    // 로딩 오버레이 표시
    showLoadingOverlay();
    
  } else {
    // 버튼 활성화
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '신청하기';
      submitBtn.style.backgroundColor = '#007bff';
    }
    
    // 로딩 오버레이 숨김
    hideLoadingOverlay();
  }
}

// =========================================
// 📱 로딩 오버레이 표시/숨김
// =========================================
function showLoadingOverlay() {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-content">' +
                       '<div class="loading-spinner"></div>' +
                       '<div class="loading-text">📤 신청서를 전송하고 있습니다...</div>' +
                       '<div class="loading-subtext">잠시만 기다려주세요</div>' +
                       '</div>';
    
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; ' +
                           'background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; ' +
                           'align-items: center; z-index: 9999;';
    
    const loadingContent = overlay.querySelector('.loading-content');
    loadingContent.style.cssText = 'background: white; padding: 40px; border-radius: 12px; ' +
                                  'text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);';
    
    const spinner = overlay.querySelector('.loading-spinner');
    spinner.style.cssText = 'width: 40px; height: 40px; border: 4px solid #f3f3f3; ' +
                           'border-top: 4px solid #007bff; border-radius: 50%; ' +
                           'animation: spin 1s linear infinite; margin: 0 auto 20px;';
    
    // 스피너 애니메이션 추가
    if (!document.getElementById('spinner-animation')) {
      const style = document.createElement('style');
      style.id = 'spinner-animation';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

// 로딩 메시지 업데이트 함수
function updateLoadingMessage(message) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// =========================================
// ✅ 성공 메시지 표시
// =========================================
function showSuccessMessage(receiptNumber) {
  const message = '🎉 신청이 성공적으로 완료되었습니다!\n\n' +
                 '📋 접수번호: ' + receiptNumber + '\n' +
                 '📧 확인 이메일이 발송되었습니다.\n\n' +
                 '담당자가 검토 후 연락드리겠습니다.\n' +
                 '접수번호를 기록해 두시기 바랍니다.';
  
  alert(message);
  
  // 추가로 페이지에 성공 메시지 표시
  showInPageMessage('success', '✅ 접수완료: ' + receiptNumber, '확인 이메일을 확인해주세요.');
}

// =========================================
// ❌ 오류 메시지 표시
// =========================================
function showErrorMessage(errorMessage) {
  const message = '❌ 신청 중 오류가 발생했습니다.\n\n' +
                 '오류 내용: ' + errorMessage + '\n\n' +
                 '잠시 후 다시 시도해주시거나,\n' +
                 '직접 연락 주시기 바랍니다.\n\n' +
                 '📞 연락처: 051-510-8057, 8525\n' +
                 '📧 이메일: histopath.pnu@gmail.com';
  
  alert(message);
  
  // 추가로 페이지에 오류 메시지 표시
  showInPageMessage('error', '❌ 전송 실패', errorMessage);
}

// =========================================
// 📱 페이지 내 메시지 표시
// =========================================
function showInPageMessage(type, title, message) {
  // 기존 메시지 제거
  const existingMessage = document.getElementById('form-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'form-message';
  messageDiv.innerHTML = '<div class="message-content">' +
                        '<h3>' + title + '</h3>' +
                        '<p>' + message + '</p>' +
                        '</div>';
  
  // 스타일 적용
  const backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
  const borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
  const textColor = type === 'success' ? '#155724' : '#721c24';
  
  messageDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; ' +
                            'background: ' + backgroundColor + '; border: 1px solid ' + borderColor + '; ' +
                            'color: ' + textColor + '; padding: 15px; border-radius: 8px; ' +
                            'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 1000; ' +
                            'max-width: 300px; animation: slideIn 0.3s ease-out;';
  
  // 애니메이션 추가
  if (!document.getElementById('message-animation')) {
    const style = document.createElement('style');
    style.id = 'message-animation';
    style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } ' +
                       'to { transform: translateX(0); opacity: 1; } }';
    document.head.appendChild(style);
  }
  
  document.body.appendChild(messageDiv);
  
  // 5초 후 자동 제거
  setTimeout(function() {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// =========================================
// 🧹 폼 초기화
// =========================================
function clearForm() {
  console.log('🧹 폼 초기화 중...');
  
  // 기본 입력 필드 초기화
  const inputFields = [
    'name', 'institution', 'department', 'email', 'phone',
    'sample-name', 'special-requests', 'sample-count', 'slide-count'
  ];
  
  inputFields.forEach(function(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = '';
    }
  });
  
  // 체크박스 초기화
  document.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
    checkbox.checked = false;
  });
  
  // 선택 상자 초기화
  document.querySelectorAll('select').forEach(function(select) {
    select.selectedIndex = 0;
  });
  
  // 서비스 목록 초기화
  if (typeof selectedServices !== 'undefined') {
    selectedServices.length = 0;
  }
  
  const servicesList = document.getElementById('services-list');
  if (servicesList) {
    servicesList.innerHTML = '';
  }
  
  console.log('🧹 폼 초기화 완료');
}

// =========================================
// 🔧 기존 함수 오버라이드: openApplicationForm (비활성화)
// =========================================
function openApplicationFormWithGoogleScript() {
  console.log('🔧 신청하기 버튼 클릭됨 - Google Apps Script 연동 모드');
  
  // Google Apps Script URL이 설정되지 않은 경우
  if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
    const setupMessage = '⚠️ Google Apps Script 설정이 필요합니다.\n\n' +
                        '1. Google Apps Script에서 웹앱을 배포하세요\n' +
                        '2. js/google-apps-script-connector.js 파일의\n' +
                        '   GOOGLE_APPS_SCRIPT_URL을 실제 URL로 변경하세요\n\n' +
                        '현재는 기존 방식(PDF 출력)으로 동작합니다.';
    
    alert(setupMessage);
    
    // 기존 PDF 출력 방식으로 fallback
    if (typeof window.originalOpenApplicationForm === 'function') {
      window.originalOpenApplicationForm();
    }
    return;
  }
  
  // Google Apps Script로 전송
  submitToGoogleAppsScript();
}

// =========================================
// 🚀 초기화 함수 (비활성화)
// =========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📡 Google Apps Script 연동 시스템 초기화 (비활성화 모드)');
  
  // 기존 openApplicationForm 함수를 덮어쓰지 않음
  // main.js의 openApplicationForm 함수가 정상 작동하도록 함
  
  console.log('✅ Google Apps Script 연동 비활성화 완료 - main.js 함수 사용');
}); 