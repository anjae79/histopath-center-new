document.addEventListener('DOMContentLoaded', function() {
    // 🎯 핵심 기능만 유지 - 사용하지 않는 슬라이더 코드 제거
    
    // 스크롤 시 헤더 스타일 변경
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    
    // 네비게이션 링크 클릭 시 스무스 스크롤
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // 모바일 메뉴가 열려있다면 닫기
                if (navList && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    if (mobileMenuBtn) {
                        mobileMenuBtn.classList.remove('active');
                    }
                }
            }
        });
    });
    
    // 모바일 메뉴 토글
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuBtn && navList) {
        mobileMenuBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            
            // 모바일 메뉴 열려있을 때 클릭하면 닫기
            if (navList.classList.contains('active')) {
                document.addEventListener('click', function closeMenu(e) {
                    if (!navList.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                        navList.classList.remove('active');
                        mobileMenuBtn.classList.remove('active');
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }
        });
    }

    // 서비스 신청 폼 처리 - 제거됨 (신청하기 버튼이 application-form.html로 직접 이동하도록 변경)
    
    // 서비스 폼 처리 기능 추가
    const mainServiceSelect = document.getElementById('main-service');
    const subServiceSelect = document.getElementById('sub-service');
    const subServiceGroup = document.querySelector('.sub-service-group');
    const specialTypeSelect = document.getElementById('special-type');
    const specialTypeGroup = document.querySelector('.special-type-group');
    const sampleCountInput = document.getElementById('sample-count');
    const slideCountInput = document.getElementById('slide-count');
    const totalCountInput = document.getElementById('total-count');
    
    // 서비스별 세부 옵션 정의
    const serviceOptions = {
        'paraffin': ['Block제작', 'Only section', 'Only section & H&E', 'Block & section', 'Block & section & H&E'],
        'frozen': ['Block제작', 'Only section', 'Only section & H&E', 'Block & section', 'Block & section & H&E'],
        'special': ['Only special stain', 'Only section & special stain', 'Block & section & special stain'],
        'ihc': ['Only IHC stain', 'Only section & IHC stain', 'Block & section & IHC stain'],
        'icc': ['단일 마커', '다중 마커'],
        'if': ['Only IF stain', 'Only section & IF stain', 'Block & section & IF stain'],
        'fish': ['단일 프로브', '다중 프로브'],
        'tma': ['TMA Block (상담문의)', 'Only section', 'Only section & H&E', 'Only section & IHC', 'Only section & IF'],
        'extraction': ['DNA 추출', 'RNA 추출', '정량 분석']
    };
    
    // 특수염색 종류 정의
    const specialStainingTypes = [
        'PAS', 'MT - (Masson\'s Trichrome)', 'Alcian Blue', 'Oil Red O', 'Picro sirius red', '기타(문의가능)'
    ];
    
    // 메인 서비스 변경 시 세부 서비스 업데이트
    if (mainServiceSelect) {
        mainServiceSelect.addEventListener('change', function() {
            const selectedService = this.value;
            
            // 세부 서비스 옵션 업데이트
            updateSubService(selectedService);
            
            // 특수염색인 경우 특수염색 종류 표시
            if (selectedService === 'special') {
                showSpecialTypeGroup();
            } else {
                hideSpecialTypeGroup();
            }
            
            // 총수량 계산
            calculateTotal();
        });
    }
    
    // 세부 서비스 업데이트 함수
    function updateSubService(mainService) {
        if (!subServiceSelect || !subServiceGroup) return;
        
        // 세부 서비스 초기화
        subServiceSelect.innerHTML = '<option value="">세부 분석을 선택하세요</option>';
        
        if (mainService && serviceOptions[mainService]) {
            // 세부 서비스 옵션 추가
            serviceOptions[mainService].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                subServiceSelect.appendChild(optionElement);
            });
            
            // 세부 서비스 그룹 표시
            subServiceGroup.style.display = 'block';
            subServiceSelect.disabled = false;
        } else {
            // 세부 서비스 그룹 숨기기
            subServiceGroup.style.display = 'none';
            subServiceSelect.disabled = true;
        }
    }
    
    // 특수염색 종류 그룹 표시
    function showSpecialTypeGroup() {
        if (!specialTypeGroup || !specialTypeSelect) return;
        
        // 특수염색 종류 옵션 초기화 및 추가
        specialTypeSelect.innerHTML = '<option value="">특수염색 종류를 선택하세요</option>';
        specialStainingTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            specialTypeSelect.appendChild(option);
        });
        
        specialTypeGroup.style.display = 'block';
        specialTypeSelect.disabled = false;
    }
    
    // 특수염색 종류 그룹 숨기기
    function hideSpecialTypeGroup() {
        if (!specialTypeGroup || !specialTypeSelect) return;
        
        specialTypeGroup.style.display = 'none';
        specialTypeSelect.disabled = true;
        specialTypeSelect.value = '';
    }
    
    // 총수량 계산 함수
    function calculateTotal() {
        const sampleCount = parseInt(sampleCountInput?.value) || 0;
        const slideCount = parseInt(slideCountInput?.value) || 0;
        const total = sampleCount * slideCount;
        
        if (totalCountInput) {
            totalCountInput.value = total > 0 ? total : '';
        }
    }
    
    // 수량 입력 필드 이벤트 리스너
    if (sampleCountInput) {
        sampleCountInput.addEventListener('input', calculateTotal);
    }
    
    if (slideCountInput) {
        slideCountInput.addEventListener('input', calculateTotal);
    }
    
    // 세부 서비스 변경 시에도 총수량 계산
    if (subServiceSelect) {
        subServiceSelect.addEventListener('change', calculateTotal);
    }
    
    // 입력 필드 클리어 버튼 기능
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('clear-input-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                targetInput.value = '';
                targetInput.focus();
                
                // 총수량 필드인 경우 재계산
                if (targetId === 'sample-count' || targetId === 'slide-count') {
                    calculateTotal();
                }
            }
        }
        
        if (e.target.classList.contains('clear-select-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const targetSelect = document.getElementById(targetId);
            if (targetSelect) {
                targetSelect.value = '';
                targetSelect.dispatchEvent(new Event('change'));
            }
        }
    });
    
    // 입력 필드 포커스/블러 시 클리어 버튼 표시/숨김
    document.querySelectorAll('input, textarea, select').forEach(input => {
        function toggleClearButton() {
            const wrapper = input.closest('.input-wrapper');
            if (!wrapper) return;
            
            const clearBtn = wrapper.querySelector('.clear-input-btn, .clear-select-btn');
            if (!clearBtn) return;
            
            if (input.value.trim() !== '') {
                clearBtn.style.display = 'flex';
                                    } else {
                clearBtn.style.display = 'none';
            }
        }
        
        input.addEventListener('input', toggleClearButton);
        input.addEventListener('change', toggleClearButton);
        input.addEventListener('focus', toggleClearButton);
        input.addEventListener('blur', function() {
            // 약간의 지연을 두어 클릭 이벤트가 처리될 시간을 줌
            setTimeout(toggleClearButton, 100);
        });
        
        // 초기 상태 설정
        toggleClearButton();
    });
    
    // 추가 의뢰 분석 버튼 기능
    const addServiceBtn = document.getElementById('add-service-btn');
    const servicesList = document.getElementById('services-list');
    
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', function() {
            addServiceToTable();
        });
    }
    
    // 서비스를 테이블에 추가하는 함수
    function addServiceToTable() {
        const sampleCount = sampleCountInput?.value || '';
        const mainService = mainServiceSelect?.value || '';
        const subService = subServiceSelect?.value || '';
        const specialType = specialTypeSelect?.value || '';
        const slideCount = slideCountInput?.value || '';
        const totalCount = totalCountInput?.value || '';
        
        // 필수 필드 검증
        if (!sampleCount || !mainService || !slideCount) {
            alert('검체 수, 의뢰 분석, 슬라이드 수는 필수 항목입니다.');
            return;
        }
        
        // 서비스 이름 가져오기
        const mainServiceText = mainServiceSelect?.options[mainServiceSelect.selectedIndex]?.text || '';
        const subServiceText = subService || '';
        const specialTypeText = specialType || '';
        
        // 세부 분석 표시 텍스트 구성
        let detailServiceText = subServiceText;
        if (mainService === 'special' && specialTypeText) {
            detailServiceText = specialTypeText + (subServiceText ? ` (${subServiceText})` : '');
        }
        
        // 테이블 행 생성
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sampleCount}</td>
            <td>${mainServiceText}</td>
            <td>${detailServiceText}</td>
            <td>${slideCount}</td>
            <td>${totalCount}</td>
            <td><button type="button" class="btn-delete" onclick="removeServiceRow(this)">삭제</button></td>
        `;
        
        // 데이터 속성으로 값 저장
        row.dataset.sampleCount = sampleCount;
        row.dataset.mainService = mainService;
        row.dataset.subService = subService;
        row.dataset.specialType = specialType;
        row.dataset.slideCount = slideCount;
        row.dataset.totalCount = totalCount;
        
        // 테이블에 추가
        if (servicesList) {
            servicesList.appendChild(row);
        }
        
        // 폼 초기화
        resetServiceForm();
    }
    
    // 서비스 폼 초기화 함수
    function resetServiceForm() {
        if (sampleCountInput) sampleCountInput.value = '';
        if (mainServiceSelect) {
            mainServiceSelect.value = '';
            mainServiceSelect.dispatchEvent(new Event('change'));
        }
        if (subServiceSelect) subServiceSelect.value = '';
        if (specialTypeSelect) specialTypeSelect.value = '';
        if (slideCountInput) slideCountInput.value = '';
        if (totalCountInput) totalCountInput.value = '';
        
        // 세부 서비스 그룹 숨기기
        if (subServiceGroup) subServiceGroup.style.display = 'none';
        if (specialTypeGroup) specialTypeGroup.style.display = 'none';
    }
    
    // 전역 함수로 서비스 행 삭제 (HTML onclick에서 호출)
    window.removeServiceRow = function(button) {
        const row = button.closest('tr');
        if (row) {
            row.remove();
        }
    };
});

// =========================================
// 🚀 신청하기 버튼 함수 - 자동 데이터 전달 (팝업 차단 해결)
// =========================================
window.openApplicationForm = function() {
    console.log('🚀 신청하기 버튼 클릭 - 신청서 페이지로 이동');
    
    try {
        // 메인 폼에서 입력된 데이터 수집
        const formData = collectFormData();
        
        // URL 파라미터 생성
        const urlParams = createUrlParameters(formData);
        
        // application-form.html 경로 (절대 경로로 변경)
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const applicationUrl = baseUrl + 'application-form.html' + (urlParams ? '?' + urlParams : '');
        
        console.log('📄 신청서 URL:', applicationUrl);
        
        // 즉시 확인 대화상자 표시
        const userChoice = confirm(`✅ 신청서 페이지로 이동합니다.

📝 입력하신 정보가 자동으로 채워집니다.
🖊️ 서명 후 제출하시면 이메일이 발송됩니다.

확인을 누르시면 신청서 페이지로 이동합니다.
취소를 누르시면 현재 페이지에 남습니다.`);
        
        if (userChoice) {
            // 현재 창에서 신청서 페이지로 이동
            console.log('🔄 신청서 페이지로 이동 중...');
            window.location.href = applicationUrl;
        } else {
            console.log('❌ 사용자가 신청서 이동을 취소했습니다.');
        }
        
    } catch (error) {
        console.error('❌ 신청서 열기 오류:', error);
        alert(`❌ 신청서를 여는 중 오류가 발생했습니다.

오류 내용: ${error.message}

🔄 다시 시도해주세요.

문제가 계속되면 관리자에게 문의하세요:
📞 051-510-8057, 8525
📧 histopath.pnu@gmail.com`);
    }
};

// =========================================
// 📊 폼 데이터 수집 함수 (개선됨)
// =========================================
window.collectFormData = function() {
    const data = {};
    
    console.log('🔄 폼 데이터 수집 시작...');
    
    // 기본 정보 수집
    data.name = document.getElementById('name')?.value || '';
    data.institution = document.getElementById('institution')?.value || '';
    data.department = document.getElementById('department')?.value || '';
    data.email = document.getElementById('email')?.value || '';
    data.phone = document.getElementById('phone')?.value || '';
    data.sampleName = document.getElementById('sample-name')?.value || '';
    data.specialRequests = document.getElementById('special-requests')?.value || '';
    
    console.log('📝 기본 정보:', {
        name: data.name,
        institution: data.institution,
        department: data.department,
        email: data.email,
        phone: data.phone,
        sampleName: data.sampleName
    });
    
    // 서비스 테이블에서 데이터 수집
    const serviceRows = document.querySelectorAll('#services-list tr');
    console.log('📋 서비스 테이블 행 개수:', serviceRows.length);
    
    if (serviceRows.length > 0) {
        serviceRows.forEach((row, index) => {
            const serviceIndex = index + 1;
            const sampleCount = row.dataset.sampleCount || '';
            const mainService = row.dataset.mainService || '';
            const subService = row.dataset.subService || '';
            const specialType = row.dataset.specialType || '';
            const slideCount = row.dataset.slideCount || '';
            const totalCount = row.dataset.totalCount || '';
            
            console.log(`📊 서비스 ${serviceIndex}:`, {
                sampleCount, mainService, subService, specialType, slideCount, totalCount
            });
            
            if (sampleCount || mainService || slideCount) {
                data[`sample_count_${serviceIndex}`] = sampleCount;
                data[`service_name_${serviceIndex}`] = getServiceName(mainService);
                data[`antibody_type_${serviceIndex}`] = subService || specialType || '';
                data[`slide_count_${serviceIndex}`] = slideCount;
                data[`total_count_${serviceIndex}`] = totalCount;
                
                console.log(`✅ 설정된 서비스 ${serviceIndex}:`, {
                    [`sample_count_${serviceIndex}`]: data[`sample_count_${serviceIndex}`],
                    [`service_name_${serviceIndex}`]: data[`service_name_${serviceIndex}`],
                    [`antibody_type_${serviceIndex}`]: data[`antibody_type_${serviceIndex}`],
                    [`slide_count_${serviceIndex}`]: data[`slide_count_${serviceIndex}`],
                    [`total_count_${serviceIndex}`]: data[`total_count_${serviceIndex}`]
                });
            }
        });
    } else {
        console.log('⚠️ 서비스 테이블에 데이터가 없습니다.');
    }
    
    // 검체 종류 수집
    const sampleTypes = document.querySelectorAll('input[name="sample-type"]:checked');
    const sampleTypeValues = [];
    sampleTypes.forEach(checkbox => {
        sampleTypeValues.push(checkbox.value);
    });
    data.sampleType = sampleTypeValues.join(',');
    
    // 고정액 수집
    const fixatives = document.querySelectorAll('input[name="fixative"]:checked');
    const fixativeValues = [];
    fixatives.forEach(checkbox => {
        fixativeValues.push(checkbox.value);
    });
    data.fixative = fixativeValues.join(',');
    
    console.log('🎯 검체 종류:', data.sampleType);
    console.log('🧪 고정액:', data.fixative);
    console.log('📋 최종 수집된 폼 데이터:', data);
    
    return data;
};

// =========================================
// 🔗 URL 파라미터 생성 함수 (개선됨)
// =========================================
window.createUrlParameters = function(data) {
    console.log('🔗 URL 파라미터 생성 시작...');
    
    const params = new URLSearchParams();
    let paramCount = 0;
    
    // 기본 정보 우선 추가
    const basicFields = ['name', 'institution', 'department', 'email', 'phone', 'sampleName', 'specialRequests'];
    basicFields.forEach(key => {
        if (data[key] && data[key].trim() !== '') {
            params.append(key, data[key]);
            paramCount++;
            console.log(`✅ 기본 파라미터 추가: ${key} = ${data[key]}`);
        }
    });
    
    // 서비스 데이터 추가
    const serviceFields = [];
    Object.keys(data).forEach(key => {
        if (key.match(/^(sample_count_|service_name_|antibody_type_|slide_count_|total_count_)\d+$/)) {
            serviceFields.push(key);
        }
    });
    
    serviceFields.sort().forEach(key => {
        if (data[key] && data[key].trim() !== '') {
            params.append(key, data[key]);
            paramCount++;
            console.log(`✅ 서비스 파라미터 추가: ${key} = ${data[key]}`);
        }
    });
    
    // 체크박스 데이터 추가
    const checkboxFields = ['sampleType', 'fixative'];
    checkboxFields.forEach(key => {
        if (data[key] && data[key].trim() !== '') {
            params.append(key, data[key]);
            paramCount++;
            console.log(`✅ 체크박스 파라미터 추가: ${key} = ${data[key]}`);
        }
    });
    
    const urlString = params.toString();
    console.log(`📊 총 ${paramCount}개 파라미터 생성`);
    console.log(`🔗 생성된 URL 파라미터 (길이: ${urlString.length}):`, urlString);
    
    // URL 길이 체크 (너무 길면 경고)
    if (urlString.length > 2000) {
        console.warn('⚠️ URL이 너무 깁니다. 일부 브라우저에서 문제가 발생할 수 있습니다.');
    }
    
    return urlString;
};

// =========================================
// 📝 서비스명 변환 함수
// =========================================
window.getServiceName = function(serviceValue) {
    const serviceNames = {
        'paraffin': '파라핀 포매',
        'frozen': '동결절편',
        'special': '특수염색',
        'ihc': '면역조직화학염색 (IHC)',
        'icc': '면역세포화학염색 (ICC)',
        'if': '면역형광염색 (IF)',
        'fish': '형광제자리부합법 (FISH)',
        'tma': 'Tissue Microarray (TMA)',
        'extraction': 'DNA/RNA 추출'
    };
    
    return serviceNames[serviceValue] || serviceValue;
};

 