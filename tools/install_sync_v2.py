"""Guarded, one-time HTML installer for Flove protocol-2 sync."""
from pathlib import Path
import hashlib,json,re,subprocess,tempfile
EXPECTED={
'eng.html':'ae335839bee5fe0c7d0c62704c923ce55eed85b1',
'index.html':'bdef6efc014690000dc5d1824dae88ff530a8fff',
'korean.html':'1de7fa8481852c9ad441ece480a98d7d9c4b4d54',
'math.html':'d24c0df1f1963fa8e1a81e967bb1040894ddaf62',
'plan.html':'5ea1a346266a2002c383eef837cb1222f73b4ff0',
'samun.html':'328e8b31b1f36e931ce792128f6563eb9ecfeb53',
'sang.html':'aaba843124cf69405f1a382959266deb3e27aa18',
'timer.html':'6bfd54ef1363985f2edee064a650f3b1d5959d87'}
KEYS={'math.html':['math_review_notes_v3'],'korean.html':['saegibun_notes_v3'],'samun.html':['samun_notes_v1'],'eng.html':['english_exam_logs_v14'],'sang.html':['liv_ethic_notes_v11','liv_ethic_layout_v11'],'plan.html':['flove-active-preset','flove-custom-hex','flove-last-save'],'index.html':['math_review_notes_v3','saegibun_notes_v3','samun_notes_v1','english_exam_logs_v14','liv_ethic_notes_v11'],'timer.html':[]}
def patch(name,t):
    cfg={'page':name.split('.')[0],'keys':KEYS[name]}
    if name=='plan.html':cfg['plan']=True
    if name=='index.html':cfg['readOnly']=True
    blocks=[m for m in re.finditer(r'<script\b[^>]*>[\s\S]*?</script>',t,re.I) if 'const SYNC_SERVER_URL' in m.group()]
    if len(blocks)!=1:raise RuntimeError(name+': missing or duplicate legacy sync')
    m=blocks[0];head='<script>window.FLOVE_SYNC_CONFIG='+json.dumps(cfg,ensure_ascii=False,separators=(',',':'))+';</script>\n<script src="sync-v2.js?v=2.0.2"></script>'
    t=t[:m.start()]+head+t[m.end():]
    if name in ['math.html','korean.html','samun.html']:
        key=KEYS[name][0];fn='loadAndConsolidateNotes' if name=='math.html' else 'loadAndInjectRestoredNotes'
        t=t.replace('function '+fn+'() {','function '+fn+'() {\n    if(localStorage.getItem('+repr(key)+')!==null)return FloveSync.readArray('+repr(key)+');',1)
        a=t.index('if (editingId)');b=t.index('function cancelEdit()',a)
        part=t[a:b].replace('      cancelEdit();\n','').replace('    saveAndRender();\n','    saveAndRender();\n    if(editingId!==null)cancelEdit();\n',1);t=t[:a]+part+t[b:]
        m=re.search(r'function saveAndRender\(\) \{[\s\S]*?\n  \}',t)
        if not m:raise RuntimeError(name+': save function missing')
        t=t[:m.start()]+'function saveAndRender(){FloveSync.saveLocal('+repr(key)+',JSON.stringify(notes));renderNotes();FloveSync.markSaved();}'+t[m.end():]
        if name in ['math.html','korean.html']:
            t=t.replace('const importedNotes = Array.isArray(parsed) ? parsed : (parsed.notes || []);','const importedNotes = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.notes) ? parsed.notes : null);')
            t=t.replace('        notes = importedNotes;','        FloveSync.validateData('+repr(key)+',JSON.stringify(importedNotes));\n        if(!confirm("백업으로 기기 기록 전체를 교체할까요?"))return;\n        FloveSync.backupCurrent("before-json-import");\n        notes = importedNotes;')
        adapter='{editing:()=>editingId!==null,refresh:()=>{notes=FloveSync.readArray('+repr(key)+');renderNotes();}}'
    elif name=='eng.html':
        save="FloveSync.saveLocal('english_exam_logs_v14',JSON.stringify(examDataList));FloveSync.markSaved();"
        t=t.replace("localStorage.setItem('english_exam_logs_v14', JSON.stringify(examDataList));",save)
        a=t.index('function saveExamRecord()');b=t.index('function resetForm()',a)
        part=t[a:b].replace("        alert('모의고사 기록이 수정되었습니다!');",'').replace("        alert('모의고사 및 암기 단어 기록이 저장되었습니다!');",'').replace(save,save+"\n      alert('기기에 저장되었습니다. 서버 저장은 상단 상태를 확인하세요.');",1);t=t[:a]+part+t[b:]
        adapter="{editing:()=>editingExamId!==null||isAutoPlaying||(!document.getElementById('tab-vocab').classList.contains('hidden')&&['vocab-sub-card','vocab-sub-quiz','vocab-sub-auto'].some(id=>!document.getElementById(id).classList.contains('hidden'))),refresh:()=>{examDataList=FloveSync.readArray('english_exam_logs_v14');renderHistory();renderAnalytics();renderIntegratedVocab();}}"
    elif name=='sang.html':
        old='function saveNotes(){syncCategoryOrder();localStorage.setItem(NOTES_KEY,JSON.stringify(notes));localStorage.setItem(LAYOUT_KEY,JSON.stringify({manualOrder:true,categoryOrder}));}'
        if old not in t:raise RuntimeError('sang save missing')
        t=t.replace(old,'function saveNotes(){syncCategoryOrder();FloveSync.saveBatch({[NOTES_KEY]:JSON.stringify(notes),[LAYOUT_KEY]:JSON.stringify({manualOrder:true,categoryOrder})});FloveSync.markSaved();}')
        adapter="{editing:()=>editingId!==null,refresh:()=>{notes=FloveSync.readArray(NOTES_KEY);const raw=localStorage.getItem(LAYOUT_KEY);storedLayout=raw===null?{}:JSON.parse(raw);categoryOrder=Array.isArray(storedLayout.categoryOrder)?storedLayout.categoryOrder:[];updateFilterOptions();renderNotes();}}"
    elif name=='plan.html':
        old='function resetAllData() { if (confirm("정말로 모든 데이터를 초기화하시겠습니까?")) { localStorage.clear(); location.reload(); } }'
        if old not in t:raise RuntimeError('plan reset missing')
        t=t.replace(old,'function resetAllData(){FloveSync.resetPlan();}')
        t=t.replace("function toggleTask(taskId) { localStorage.setItem(taskId, document.getElementById(taskId).checked ? 'true' : 'false'); selectDate(selectedDateStr); }","function toggleTask(taskId){FloveSync.saveLocal(taskId,document.getElementById(taskId).checked?'true':'false');selectDate(selectedDateStr);FloveSync.markSaved();}")
        adapter="{editing:()=>false,refresh:()=>{loadData();renderDateList();selectDate(selectedDateStr);restoreCheckStates();updateStats();updateTree();const preset=localStorage.getItem('flove-active-preset')||'clover';if(preset==='custom'){applyThemeStyles(localStorage.getItem('flove-custom-hex')||'#22c55e','#f8fafc',false,'none');}else{const t=themePresets[preset];if(t)applyThemeStyles(t.hex,t.bg,t.isDark,t.pattern);}}}"
    elif name=='index.html':adapter='{editing:()=>false,refresh:()=>updateCountsFromStorage()}'
    else:adapter='{editing:()=>false}'
    pos=t.rfind('</script>')
    if pos<0:raise RuntimeError('final script missing')
    return t[:pos]+'\n// Flove V2 screen adapter\nFloveSync.register('+adapter+');\n'+t[pos:]
def main():
    changed={}
    for name,expected in EXPECTED.items():
        raw=Path(name).read_bytes();actual=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        if actual!=expected:raise RuntimeError(name+': source changed; nothing overwritten')
        changed[name]=patch(name,raw.decode('utf-8-sig'))
    with tempfile.TemporaryDirectory() as td:
        for name,text in {**changed,'sync-v2.js':Path('sync-v2.js').read_text(encoding='utf-8')}.items():
            js=text if name.endswith('.js') else '\n'.join(re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',text,re.I));p=Path(td)/(name+'.js');p.write_text(js,encoding='utf-8');subprocess.run(['node','--check',str(p)],check=True)
    for name,text in changed.items():Path(name).write_text(text,encoding='utf-8')
    print('Applied Flove V2 to eight HTML files; syntax checks passed.')
if __name__=='__main__':main()
