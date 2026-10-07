/* Math-only DOCX export. No network calls or storage writes. */
(function () {
  'use strict';
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const P = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const encoder = new TextEncoder();
  let busy = false;
  const crcTable = Array.from({length: 256}, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function esc(value) {
    return Array.from(String(value == null ? '' : value)).filter(c => {
      const n = c.codePointAt(0);
      return n === 9 || n === 10 || n === 13 || (n >= 32 && n <= 0xd7ff) ||
        (n >= 0xe000 && n <= 0xfffd) || (n >= 0x10000 && n <= 0x10ffff);
    }).join('').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  }
  function zip(entries) {
    if (entries.length > 65535) throw new Error('문서 항목이 너무 많습니다.');
    const chunks = [], directory = [];
    let offset = 0, directorySize = 0;
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
      let crc = 0xffffffff;
      for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
      crc = (crc ^ 0xffffffff) >>> 0;
      if (data.length > 0xffffffff || offset + data.length + name.length + 30 > 0xffffffff) {
        throw new Error('문서 용량이 너무 큽니다.');
      }
      const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); lv.setUint16(12, 33, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true);
      local.set(name, 30);
      const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(14, 33, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
      cv.setUint32(42, offset, true); central.set(name, 46);
      chunks.push(local, data); directory.push(central);
      offset += local.length + data.length; directorySize += central.length;
    }
    if (offset + directorySize > 0xffffffff) throw new Error('문서 용량이 너무 큽니다.');
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true); ev.setUint32(12, directorySize, true);
    ev.setUint32(16, offset, true);
    return new Blob([...chunks, ...directory, end], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }
  function runs(text) {
    return String(text == null ? '' : text).split('\t').map((part, i) =>
      (i ? '<w:r><w:tab/></w:r>' : '') + '<w:r><w:t xml:space="preserve">' + esc(part) + '</w:t></w:r>'
    ).join('');
  }
  function actionText(line) {
    // Remove only explicit bullet/decorative prefixes, never minus signs or numbers.
    return line.replace(/^[ \t]*(?:(?:[•●◦▪▫‣⁃]|💡\uFE0F?)[ \t]*)+/u, '');
  }
  function paragraph(text, options = {}) {
    const style = options.style || (options.bullet ? 'ListParagraph' : 'Normal');
    const properties = '<w:pStyle w:val="' + style + '"/>' +
      (options.keepNext ? '<w:keepNext/>' : '<w:keepNext w:val="0"/>') +
      (options.keepLines ? '<w:keepLines/>' : '<w:keepLines w:val="0"/>') +
      '<w:widowControl/>' +
      (options.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
      '<w:snapToGrid w:val="0"/>' +
      '<w:spacing w:before="0" w:after="' + (options.after == null ? 0 : options.after) + '" w:line="312" w:lineRule="auto"/>' +
      '<w:jc w:val="left"/>';
    return '<w:p><w:pPr>' + properties + '</w:pPr>' + runs(text) + '</w:p>';
  }
  async function prepareImage(src) {
    if (typeof src !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(src)) {
      throw new Error('저장된 이미지 데이터 형식이 올바르지 않습니다.');
    }
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => { img.onload = img.onerror = null; reject(new Error('이미지 읽기 시간 초과')); }, 20000);
      img.onload = () => { clearTimeout(timer); img.onload = img.onerror = null; resolve(img); };
      img.onerror = () => { clearTimeout(timer); img.onload = img.onerror = null; reject(new Error('이미지를 읽을 수 없습니다.')); };
      img.src = src;
    });
    const width = image.naturalWidth, height = image.naturalHeight;
    if (!width || !height) throw new Error('이미지 크기를 확인할 수 없습니다.');
    let bytes = Uint8Array.from(atob(src.slice(src.indexOf(',') + 1)), c => c.charCodeAt(0));
    let ext;
    if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) ext = 'png';
    else if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = 'jpg';
    else {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 3000 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('이미지 변환 기능을 사용할 수 없습니다.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('이미지를 PNG로 변환하지 못했습니다.');
      bytes = new Uint8Array(await blob.arrayBuffer()); ext = 'png';
      canvas.width = canvas.height = 1;
    }
    const scale = Math.min(1, 620 / width, 672 / height);
    return {bytes, ext, cx: Math.max(1, Math.round(width * scale * 9525)), cy: Math.max(1, Math.round(height * scale * 9525))};
  }
  function imageParagraph(image, id, label) {
    const {cx, cy} = image;
    return '<w:p><w:pPr><w:keepNext w:val="0"/><w:snapToGrid w:val="0"/>' +
      '<w:spacing w:before="0" w:after="240" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>' +
      '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
      `<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
      `<wp:docPr id="${id}" name="Picture ${id}" descr="${esc(label)}"/>` +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>' +
      `<pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.${image.ext}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="rIdImage${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }
  async function build(sourceNotes, curriculum, imageLoader = prepareImage, progress = () => {}) {
    const notes = sourceNotes.map(n => ({...n}));
    const subjects = [
      ['absolute', '최우선 절대 행동강령'], ['math1', '수학 I 행동강령'],
      ['math2', '수학 II 행동강령'], ['stats', '확률과 통계 행동강령']
    ];
    if (notes.some(n => !subjects.some(s => s[0] === (n.subject || 'absolute')))) {
      throw new Error('알 수 없는 과목이 있어 내보내기를 중단했습니다. 백업 데이터의 과목을 확인해주세요.');
    }
    let body = paragraph('수학 통합 파이널 실전 행동강령 리포트', {style:'Title', after:160});
    body += paragraph('생성일자: ' + new Date().toLocaleDateString('ko-KR') + ' | 총 ' + notes.length + '개 항목 수록', {style:'Subtitle', after:240});
    const media = [], relations = [];
    let count = 0;
    for (const [key, title] of subjects) {
      const subjectNotes = notes.filter(n => (n.subject || 'absolute') === key);
      if (!subjectNotes.length) continue;
      body += paragraph(title, {style:'Heading1', keepNext:true, keepLines:true, after:160});
      const groups = new Map((curriculum[key].units || []).map(u => [u, []]));
      for (const n of subjectNotes) {
        const unit = n.unit || '기타';
        if (!groups.has(unit)) groups.set(unit, []);
        groups.get(unit).push(n);
      }
      for (const [unit, items] of groups) {
        if (!items.length) continue;
        body += paragraph(unit, {style:'Heading2', keepNext:true, keepLines:true, after:120});
        for (const item of items) {
          progress(++count, notes.length);
          let image = null;
          if (item.image) {
            try { image = await imageLoader(item.image); }
            catch (error) { throw new Error('[' + (item.title || unit) + '] 사진 처리 실패: ' + error.message); }
          }
          const lines = String(item.content == null ? '' : item.content).replace(/\r\n?/g, '\n').split('\n').map(actionText);
          const compact = lines.length <= 6 && lines.join('').length <= 400;
          for (let i = 0; i < lines.length; i++) {
            const last = i === lines.length - 1;
            body += paragraph(lines[i], {
              bullet: lines[i].trim().length > 0,
              keepNext: image ? (compact || last) : false,
              keepLines: !!image && compact,
              after: last ? (image ? 120 : 240) : 0
            });
          }
          if (image) {
            const id = media.length + 1;
            media.push({name:`word/media/image${id}.${image.ext}`, data:image.bytes});
            relations.push(`<Relationship Id="rIdImage${id}" Type="${R}/image" Target="media/image${id}.${image.ext}"/>`);
            body += imageParagraph(image, id, item.title || unit);
          }
        }
      }
    }
    body += '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
    const font = '<w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕" w:cs="Malgun Gothic"/>';
    const styles = XML + `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:snapToGrid w:val="0"/><w:spacing w:after="0" w:line="312" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:next w:val="ListParagraph"/><w:qFormat/><w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr></w:style>' +
      [['Title',36,'DC2626'],['Subtitle',20,'64748B'],['Heading1',28,'DC2626'],['Heading2',24,'B45309']].map(([id,size,color]) =>
        `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr>${id === 'Subtitle' ? '' : '<w:b/>'}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr></w:style>`
      ).join('') + '</w:styles>';
    const numbering = XML + `<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="180"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
    return zip([
      {name:'[Content_Types].xml', data:XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>'},
      {name:'_rels/.rels', data:XML + `<Relationships xmlns="${P}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`},
      {name:'word/document.xml', data:XML + `<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}</w:body></w:document>`},
      {name:'word/styles.xml', data:styles},
      {name:'word/numbering.xml', data:numbering},
      {name:'word/_rels/document.xml.rels', data:XML + `<Relationships xmlns="${P}"><Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="${R}/numbering" Target="numbering.xml"/>${relations.join('')}</Relationships>`},
      ...media
    ]);
  }
  async function download(notes, curriculum) {
    if (busy) return;
    if (!notes.length) { alert('내보낼 오답 노트 기록이 없습니다.'); return; }
    busy = true;
    const buttons = Array.from(document.querySelectorAll('button[onclick="exportToWord()"]'));
    const state = buttons.map(b => ({b, text:b.textContent, disabled:b.disabled}));
    const snapshot = notes.map(n => ({...n}));
    try {
      buttons.forEach(b => { b.disabled = true; b.textContent = 'Word 생성 중…'; });
      await new Promise(resolve => setTimeout(resolve, 0));
      const blob = await build(snapshot, curriculum, prepareImage, (done,total) => {
        buttons.forEach(b => { b.textContent = `Word 생성 중… ${done}/${total}`; });
      });
      const now = new Date();
      const date = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      try {
        a.href = url; a.download = `수학통합_행동강령_사진포함_${date}.docx`;
        document.body.appendChild(a); a.click();
      } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    } catch (error) {
      console.error('Math Word export failed', error);
      alert('Word 내보내기 실패: ' + error.message + '\n원본 기록은 변경되지 않았습니다.');
    } finally {
      state.forEach(({b,text,disabled}) => { b.textContent = text; b.disabled = disabled; });
      busy = false;
    }
  }
  window.FloveMathWord = Object.freeze({build, download});
})();
