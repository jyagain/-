/**
 * app.js
 * 어플리케이션의 메인 진입점(Entry Point)입니다.
 * DOM 로드가 완료되면 UIManager를 초기화하여 전체 오답 포털 시스템을 구동합니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 로컬 스토리지 브라우저 지원 여부 검증
    if (typeof(Storage) !== 'undefined') {
      console.log('Twin Problem Portal: 로컬 스토리지가 성공적으로 연결되었습니다.');
    } else {
      alert('죄송합니다. 현재 브라우저가 로컬 스토리지를 지원하지 않아 학습 데이터가 저장되지 않습니다. 최신 브라우저를 이용해 주세요.');
    }

    // UI 매니저 시동
    UIManager.init();
    
  } catch (error) {
    console.error('어플리케이션 초기화 중 치명적인 오류가 발생했습니다:', error);
  }
});
