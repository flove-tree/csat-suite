/* Samun note ordering and matching Word summaries. Does not rewrite note storage. */
(() => {
  'use strict';
  const subjects = ['absolute', 'concept', 'statistics'];
  const names = {absolute: '절대강령', concept: '개념 & 선지', statistics: '도표 & 통계'};
  const modes = {manual: '저장된 순서 (수동)', unit: '단원별 묶기', newest: '최근 등록순', oldest: '오래된 등록순'};
  const key = 'samun_sort_preferences_v1';
  const subjectOf = note => note.subject || 'absolute';
  const text = value => value == null ? '' : String(value);
  const escape = value => text(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const groupOf = (note, subject) => subject === 'absolute' ? '공통 행동강령' : text(note.unit).trim() || '미분류';
  function registeredAt(note) {
    const id = Number(note.id);
    if (Number.isFinite(id) && id >= 1e12 && id <= 8.64e15) return id;
    const raw = text(note.createdAt).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
      const time = Date.parse(raw);
      return Number.isFinite(time) ? time : null;
    }
    const match = raw.match(/^(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\.?$/);
    if (!match) return null;
    const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    const time = Date.UTC(y, m - 1, d), date = new Date(time);
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? time : null;
  }
  function orderNotes(source, subject, mode = 'manual', units = []) {
    const rows = source.filter(n => subjectOf(n) === subject).map((note, index) => ({note, index, time: registeredAt(note)}));
    if (!Object.hasOwn(modes, mode) || mode === 'manual') return rows.map(r => r.note);
    const chronological = (a, b, oldest = false) => {
      if (a.time === null || b.time === null) {
        if (a.time !== b.time) return a.time === null ? 1 : -1;
      } else if (a.time !== b.time) return oldest ? a.time - b.time : b.time - a.time;
      return a.index - b.index;
    };
    const groupCompare = (a, b) => {
      if (a === b) return 0;
      if (a === '미분류' || b === '미분류') return a === '미분류' ? 1 : -1;
      const ai = units.indexOf(a), bi = units.indexOf(b);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? units.length : ai) - (bi < 0 ? units.length : bi);
      return a.localeCompare(b, 'ko', {numeric: true});
    };
    rows.sort((a, b) => mode === 'unit'
      ? groupCompare(groupOf(a.note, subject), groupOf(b.note, subject)) || chronological(a, b)
      : chronological(a, b, mode === 'oldest'));
    return rows.map(r => r.note);
  }
  function wordHtml(source, preferences, unitOrders) {
    const titles = {
      absolute: {text: '🔥 사회문화 최우선 절대 행동강령', color: '#dc2626'},
      concept: {text: '📚 개념 & 선지 행동강령', color: '#16a34a'},
      statistics: {text: '📊 도표 & 통계 풀이 행동강령', color: '#0d9488'}
    };
    let body = '<h1 class="main-title">사회문화 통합 파이널 행동강령 체크리스트</h1>';
    body += '<p class="created-date">생성일자: ' + escape(new Date().toLocaleDateString('ko-KR')) + '</p>';
    for (const subject of subjects) {
      const mode = preferences[subject] || 'manual';
      const units = unitOrders[subject] || [];
      let rows = orderNotes(source, subject, mode, units);
      if (!rows.length) continue;
      if (subject !== 'absolute') {
        const groups = [...new Set(orderNotes(rows, subject, 'unit', units).map(note => groupOf(note, subject)))];
        rows = groups.flatMap(group => rows.filter(note => groupOf(note, subject) === group));
      }
      const title = titles[subject];
      body += '<h2 class="section-title" style="color:' + title.color + ';border-bottom:2pt solid ' + title.color + '">' + escape(title.text) + '</h2>';
      let last = null, opened = false;
      for (const note of rows) {
        const group = subject !== 'absolute' ? groupOf(note, subject) : '';
        if (!opened || group !== last) {
          if (opened) body += '</ol>';
          if (group) body += '<h3 class="unit-title">' + escape(group) + '</h3>';
          body += '<ol class="content-list">';
          opened = true;
          last = group;
        }
        const content = text(note.content).trim() || text(note.passageTitle).trim() || '(빈 노트)';
        body += '<li>' + escape(content).replace(/\r\n|\r|\n/g, '<br>') + '</li>';
      }
      if (opened) body += '</ol>';
    }
    const css = '@page{size:A4;margin:1.5cm}body{font-family:"Malgun Gothic","맑은 고딕",sans-serif;font-size:12pt;line-height:1.7;color:#111827}.main-title{font-size:24pt;font-weight:bold;color:#111827;border-bottom:3pt solid #111827;padding-bottom:12pt;margin:0 0 12pt}.created-date{font-size:11pt;color:#737373;margin:0 0 28pt}.section-title{font-size:18pt;font-weight:bold;padding-bottom:8pt;margin:28pt 0 14pt;page-break-after:avoid}.unit-title{font-size:14pt;font-weight:bold;margin:14pt 0 8pt;page-break-after:avoid}.content-list{margin:12pt 0 20pt;padding-left:22pt}.content-list li{font-size:12pt;line-height:1.7;padding-left:4pt;margin:0 0 9pt}';
    return '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ko"><head><meta charset="utf-8"><title>사회문화 통합 파이널 행동강령 체크리스트</title><style>' + css + '</style></head><body>' + body + '</body></html>';
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {orderNotes, registeredAt, wordHtml, groupOf};
    return;
  }
  const cfg = window.FLOVE_SYNC_CONFIG || {};
  if (cfg.page !== 'samun' || cfg.readOnly) return;
  function init() {
    const controls = document.querySelector('.controls-bar');
    const list = document.getElementById('notesList');
    if (!controls || !list || document.getElementById('samunSortOrder')) return;
    const unitOrders = {
      absolute: [],
      concept: typeof conceptUnits === 'undefined' ? [] : conceptUnits,
      statistics: typeof statisticsUnits === 'undefined' ? [] : statisticsUnits
    };
    const preferences = {absolute: 'manual', concept: 'manual', statistics: 'manual'};
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      if (saved && typeof saved === 'object') for (const subject of subjects) {
        if (Object.hasOwn(modes, saved[subject])) preferences[subject] = saved[subject];
      }
    } catch (error) { console.warn('[Samun sort] Preferences unavailable', error); }
    const label = document.createElement('label');
    label.htmlFor = 'samunSortOrder';
    label.textContent = '정렬 ';
    label.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:.85rem;white-space:nowrap';
    const select = document.createElement('select');
    select.id = 'samunSortOrder';
    select.style.width = 'auto';
    for (const [value, caption] of Object.entries(modes)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = caption;
      select.append(option);
    }
    label.append(select);
    controls.append(label);
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.style.cssText = 'flex-basis:100%;margin:0';
    hint.textContent = '정렬은 탭별로 기억합니다. 단원별 묶기는 단원 안에서 최근 등록순이며, 미분류는 마지막입니다. Word 통합 내보내기는 검색·필터와 관계없이 세 탭 전체를 포함하고, 개념 & 선지와 도표 & 통계는 항상 단원별로 구분합니다. 단원 안에서는 선택한 정렬을 유지합니다.';
    controls.append(hint);
    const originalRender = window.renderNotes;
    window.renderNotes = function(...args) {
      const subject = currentSubject;
      const mode = preferences[subject] || 'manual';
      select.value = mode;
      const original = notes;
      const ordered = orderNotes(original, subject, mode, unitOrders[subject] || []);
      let index = 0, result;
      try {
        notes = original.map(note => subjectOf(note) === subject ? ordered[index++] : note);
        result = originalRender.apply(this, args);
      } finally {
        notes = original;
      }
      if (mode === 'unit') {
        let last = null;
        for (const card of list.querySelectorAll('.note-card')) {
          const badge = card.querySelector('.badge-unit');
          const group = subject === 'absolute' ? '공통 행동강령' : (badge ? badge.textContent.trim() : '') || '미분류';
          if (group !== last) {
            const heading = document.createElement('h3');
            heading.textContent = group;
            heading.className = 'samun-unit-heading';
            heading.style.cssText = 'font-size:1rem;color:var(--primary);margin:12px 0 0';
            list.insertBefore(heading, card);
            last = group;
          }
        }
      }
      if (mode !== 'manual') for (const button of list.querySelectorAll('[onclick*="moveNoteUp("],[onclick*="moveNoteDown("]')) {
        button.disabled = true;
        button.title = '직접 순서를 이동하려면 저장된 순서 (수동)를 선택하세요.';
      }
      return result;
    };
    select.addEventListener('change', () => {
      preferences[currentSubject] = select.value;
      try { localStorage.setItem(key, JSON.stringify(preferences)); }
      catch (error) { console.warn('[Samun sort] Using in-memory preferences', error); }
      renderNotes();
    });
    window.exportToWord = function() {
      if (!notes.some(note => subjects.includes(subjectOf(note)))) {
        alert('내보낼 행동강령이 없습니다.');
        return;
      }
      const html = wordHtml(notes, preferences, unitOrders);
      const blob = new Blob(['\ufeff', html], {type: 'application/msword;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '사회문화_통합_파이널_행동강령_' + new Date().toISOString().slice(0, 10) + '.doc';
      document.body.append(link);
      try { link.click(); }
      finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    };
    renderNotes();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
