/* Ethics adapter. Load after input-protection.js and all ethics engines. */
(() => {
'use strict';
if ((window.FLOVE_SYNC_CONFIG||{}).page!=='sang') return;
function boot() {
    if (window.FloveEthicsInput || !window.FloveInputProtection) return;
    const $=id=>document.getElementById(id);
    const previousCancel=cancelEdit,previousStart=startEdit,previousSave=saveNotes,previousDelete=deleteNote;
    let suppress=0,submitPhase=false,submitSaved=false,submitSequence=0;
    const quiet=fn=>{suppress++;try{return fn();}finally{suppress--;}};
    const context=()=>({editingId,note:editingId===null?null:JSON.stringify(notes.find(n=>String(n.id)===String(editingId))||null)});
    function capture() {
        const state={thinker:$('thinker').value,reasonTag:$('reasonTag').value,source:$('sourceInput').value,original:originalInput.value,memo:$('memo').value,recordType:$('recordType').value,unit:$('unitSelect')?.value||'',pairs:[...pairContainer.children].map(row=>({wrong:row.querySelector('.wrong-input').value,correct:row.querySelector('.correct-input').value,action:row.querySelector('.action-select').value,target:row.querySelector('.target-select').value}))};
        if (editingId===null&&!state.thinker&&!state.reasonTag&&!state.source&&!state.original&&!state.memo&&state.pairs.every(p=>!p.wrong&&!p.correct)) {state.unit='';state.recordType='correction';}
        return state;
    }
    function compatible(draft) {
        const s=draft.state,c=draft.context;
        if(!s||typeof s!=='object'||!c||typeof c!=='object')return false;
        if(!['thinker','reasonTag','source','original','memo','recordType','unit'].every(k=>typeof s[k]==='string'))return false;
        if(!['correction','confused'].includes(s.recordType)||!Array.isArray(s.pairs)||s.pairs.length<1||s.pairs.length>500)return false;
        if(!s.pairs.every(p=>p&&['wrong','correct','action','target'].every(k=>typeof p[k]==='string')&&['replace','mark'].includes(p.action)&&(p.target===''||p.target==='all'||/^\d+:\d+$/.test(p.target))))return false;
        if(typeof ETHICS_UNITS!=='undefined'&&s.unit!==''&&s.unit!==ETHICS_UNASSIGNED&&!ETHICS_UNITS.includes(s.unit))return false;
        if(c.editingId===null)return c.note===null;
        if(typeof c.editingId!=='number'&&typeof c.editingId!=='string')return false;
        const note=notes.find(n=>String(n.id)===String(c.editingId));
        return !!note&&typeof c.note==='string'&&JSON.stringify(note)===c.note;
    }
    function restore(state,savedContext) {
        quiet(()=>{
            if(savedContext.editingId===null)previousCancel();
            else {const note=notes.find(n=>String(n.id)===String(savedContext.editingId));if(!note)throw Error('수정할 선지가 없어 초안을 복원하지 않았습니다.');previousStart(note);}
            $('thinker').value=state.thinker;$('reasonTag').value=state.reasonTag;$('sourceInput').value=state.source;
            originalInput.value=state.original;$('memo').value=state.memo;$('recordType').value=state.recordType;
            if($('unitSelect'))$('unitSelect').value=state.unit;
            pairContainer.replaceChildren();
            for(const pair of state.pairs){addPair(pair);const row=pairContainer.lastElementChild;updateTargetOptions(row,pair.target);row.querySelector('.target-select').value=pair.target;updatePairPreview(row);}
            updateRecordType();
        });
    }
    const panel=document.createElement('section');panel.id='ethics-draft-panel';panel.hidden=true;
    panel.style.cssText='margin:0 0 12px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:10px;background:#f8fafc;font-size:.8rem;';
    const title=document.createElement('p');title.textContent='저장 전 입력 복구 · 복원해도 노트에 자동 저장되지 않습니다.';
    const tools=document.createElement('div');tools.style.cssText='display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;';
    const choices=document.createElement('select');choices.setAttribute('aria-label','복원할 생윤 입력 초안');choices.style.cssText='flex:1;min-width:160px;font-size:.8rem;';
    const recover=document.createElement('button');recover.type='button';recover.textContent='초안 복원';recover.className='btn-action';
    const refreshButton=document.createElement('button');refreshButton.type='button';refreshButton.textContent='초안 조회';refreshButton.className='btn-action';
    const message=document.createElement('p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');message.style.cssText='margin-top:6px;color:#64748b;';
    tools.append(choices,recover,refreshButton);panel.append(title,tools,message);noteForm.before(panel);
    const style=document.createElement('style');style.textContent='@media print{#ethics-draft-panel{display:none!important}}';document.head.appendChild(style);
    const guard=window.FloveInputProtection.create({page:'sang',root:noteForm,capture,context,restore,validateDraft:compatible,onWarning:(code)=>{panel.hidden=false;message.textContent='임시 초안 처리에 문제가 있습니다. 입력은 유지되지만 복구가 보장되지 않으니 직접 저장하거나 복사해 주세요. ('+code+')';}});
    function refreshDrafts() {
        choices.replaceChildren();
        const drafts=guard.listDrafts().filter(d=>d.key!==guard.draftKey);
        for(const draft of drafts){const option=document.createElement('option');option.value=draft.key;option.textContent=draft.createdAt.replace('T',' ').slice(0,19)+' · '+(draft.state?.thinker||'작성 중인 선지')+(compatible(draft)?'':' · 확인 필요');choices.appendChild(option);}
        recover.disabled=!drafts.length;
        if(drafts.length)panel.hidden=false;
        return drafts;
    }
    recover.addEventListener('click',()=>{
        if(guard.hasUnsavedChanges()){message.textContent='현재 입력을 먼저 저장하거나 수정 취소한 뒤 복원해 주세요.';return;}
        if(!choices.value)return;
        if(!confirm('선택한 초안을 입력창에 복원할까요? 확정된 노트는 변경하지 않습니다.'))return;
        const result=guard.restoreDraft(choices.value);
        message.textContent=result.ok?'초안을 복원했습니다. 내용을 확인한 뒤 저장 버튼을 눌러 주세요.':'초안을 복원하지 않았습니다. 원래 선지가 변경되었거나 초안 형식이 맞지 않을 수 있습니다. ('+result.reason+')';
    });
    refreshButton.addEventListener('click',refreshDrafts);
    noteForm.addEventListener('submit',()=>{
        const sequence=++submitSequence;submitPhase=true;submitSaved=false;
        setTimeout(()=>{if(sequence===submitSequence){submitPhase=false;submitSaved=false;}},0);
    },true);
    saveNotes=function(...args){const result=previousSave.apply(this,args);if(submitPhase)submitSaved=true;return result;};
    cancelEdit=function(...args){
        if(!suppress&&!submitSaved&&!guard.confirmDiscard())return false;
        const result=previousCancel.apply(this,args);guard.acceptCurrent();return result;
    };
    startEdit=function(...args){
        if(!suppress&&!guard.confirmDiscard('저장하지 않은 입력을 버리고 선택한 선지를 수정할까요?'))return false;
        const result=previousStart.apply(this,args);guard.acceptCurrent();return result;
    };
    deleteNote=function(id){
        if(String(editingId)===String(id)&&!guard.confirmDiscard('이 선지의 저장하지 않은 수정을 버리고 삭제를 진행할까요?'))return false;
        return quiet(()=>previousDelete.call(this,id));
    };
    loadJSON=function(event){
        const file=event.target.files[0];if(!file)return;
        const reader=new FileReader();
        reader.onload=e=>{
            let oldNotes,oldOrder;
            try{
                const parsed=parseBackup(JSON.parse(e.target.result));
                if(guard.hasUnsavedChanges())guard.persist();
                if(!confirm('백업의 '+parsed.notes.length+'개 선지로 현재 노트 전체를 교체할까요?'+(guard.hasUnsavedChanges()?' 저장하지 않은 입력도 초기화됩니다.':'')))return;
                FloveSync.backupCurrent('before-json-import');
                oldNotes=notes;oldOrder=[...categoryOrder];notes=parsed.notes;categoryOrder=parsed.categoryOrder;
                try{saveNotes();}catch(error){notes=oldNotes;categoryOrder=oldOrder;throw error;}
                quiet(()=>cancelEdit());updateFilterOptions();renderNotes();guard.acceptCurrent();refreshDrafts();
                alert('노트와 정렬 순서를 불러왔습니다.');
            }catch(error){alert('불러오기 실패: '+error.message);}
            finally{event.target.value='';}
        };
        reader.onerror=()=>{event.target.value='';alert('백업 파일을 읽지 못했습니다. 현재 입력과 노트는 유지합니다.');};
        reader.readAsText(file);
    };
    FloveSync.register({editing:()=>editingId!==null||guard.hasUnsavedChanges(),refresh:()=>{
        notes=FloveSync.readArray(NOTES_KEY);const raw=localStorage.getItem(LAYOUT_KEY);storedLayout=raw===null?{}:JSON.parse(raw);
        categoryOrder=Array.isArray(storedLayout.groupOrder)?storedLayout.groupOrder:[];updateFilterOptions();renderNotes();
    }});
    window.FloveEthicsInput={guard,capture,context,compatible,refreshDrafts};
    refreshDrafts();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
