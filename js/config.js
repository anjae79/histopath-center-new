// =========================================
// 🔧 환경별 설정 파일
// 🏥 부산대학교 의과대학 조직병리핵심센터
// =========================================

// 🌐 환경 감지
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.protocol === 'file:';

// 🧪 테스트 모드 설정 (true: 실제 이메일 발송, false: 시뮬레이션만)
const FORCE_EMAIL_SENDING = true; // 로컬에서도 실제 이메일 발송하려면 true로 설정

// 📍 Google Apps Script 웹앱 URL - 연속카운터 + JPG최적화 + 사용자PDF첨부 (2025-06-27 최종 배포)
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDM9K2r0THTNEziwE5pZ_gtQnMZoMU0eaMc1k1PPECjEWIwRCPzEeKZxRdMsXf0t1hLQ/exec'; // 연속카운터 최종 완벽 버전

// 🎯 환경별 설정
const CONFIG = {
    // Google Apps Script 설정
    googleAppsScript: {
        url: GOOGLE_APPS_SCRIPT_URL,
        timeout: 30000, // 30초
        retryAttempts: 3
    },
    
    // 개발 환경 설정
    development: {
        debug: isLocalhost,
        logLevel: isLocalhost ? 'debug' : 'error'
    },
    
    // UI 설정
    ui: {
        loadingTimeout: 30000,
        autoCloseDelay: 5000,
        animationDuration: 300
    },
    
    // 이미지 최적화 설정
    images: {
        lazyLoading: true,
        compressionQuality: 0.8,
        maxWidth: 1200,
        maxHeight: 800
    }
};

// 🔧 유틸리티 함수들
const ConfigUtils = {
    // 디버그 로그
    log: function(message, level = 'info') {
        if (CONFIG.development.debug || level === 'error') {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    },
    
    // 환경 정보 출력
    getEnvironmentInfo: function() {
        return {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            isLocalhost: isLocalhost,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
};

// 🌍 전역으로 노출
window.CONFIG = CONFIG;
window.ConfigUtils = ConfigUtils;
window.FORCE_EMAIL_SENDING = FORCE_EMAIL_SENDING;

// 🚀 초기화 로그
ConfigUtils.log(`환경 설정 로드 완료 - ${isLocalhost ? '개발' : '프로덕션'} 모드`); 
ConfigUtils.log(`연속카운터 + JPG최적화 + 사용자PDF첨부 최종 배포 URL 적용: AKfycbyDM9K2r0THTNEziwE5pZ_gtQnMZoMU0eaMc1k1PPECjEWIwRCPzEeKZxRdMsXf0t1hLQ`); 