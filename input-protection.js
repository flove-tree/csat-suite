/* Opt-in input protection. Pages must register explicit capture/restore/save hooks. */
(() => {
'use strict';
if (window.FloveInputProtection) return;
const PREFIX='__flove_input_draft_v1:',VERSION=1,instances=new Set();
const copy=value=>JSON.parse(JSON.stringify(value));
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
function initializationAction({localValue=null,hasLegacy=false,serverStatus='loading',serverValue=null,hasUnsaved=false}={}) {
    if (localValue!==null || hasLegacy) return 'preserve-local';
    if (serverStatus!=='ready') return 'wait-without-write';
    if (hasUnsaved) return 'defer-without-write';
    return serverValue===null?'ready-empty-without-seeds':'pull-server';
}
function create(options) {
    if (!options || !/^[a-z0-9_-]+$/i.test(options.page||'') || !options.root || typeof options.capture!=='function') throw Error('Input protection requires page, root and capture.');
    const page=options.page,root=options.root;
    const token=window.crypto&&typeof window.crypto.randomUUID==='function'?window.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    const pagePrefix=PREFIX+page+':',draftKey=pagePrefix+token;
    let baseline=JSON.stringify(options.capture()),context=copy(options.context?options.context():null),timer=null,disposed=false,listening=false;
    if (baseline===undefined) throw Error('Capture must return JSON data.');
    const warn=(code,error)=>{try{if (options.onWarning) options.onWarning(code,error);else console.warn('[Flove Input Protection]',code,error||'');}catch(_) {}};
    const storage=()=>options.storage||window.localStorage;
    function hasUnsavedChanges() {
        if (disposed) return false;
        try{return JSON.stringify(options.capture())!==baseline;}catch(error){warn('capture-failed',error);return true;}
    }
    function beforeUnload(event) {
        if (!hasUnsavedChanges()) return;
        persist();
        event.preventDefault();
        event.returnValue=true;
    }
    function updateProtection() {
        const changed=hasUnsavedChanges();
        if (changed&&!listening) {window.addEventListener('beforeunload',beforeUnload);listening=true;}
        if (!changed&&listening) {window.removeEventListener('beforeunload',beforeUnload);listening=false;}
        return changed;
    }
    function readDraft(key) {
        if (typeof key!=='string'||!key.startsWith(pagePrefix)) return null;
        const raw=storage().getItem(key);
        if (raw===null) return null;
        const draft=JSON.parse(raw);
        if (!draft||draft.version!==VERSION||draft.page!==page||draft.key!==key||typeof draft.createdAt!=='string'||!own(draft,'state')||!own(draft,'context')) return null;
        return draft;
    }
    function persist() {
        if (disposed) return false;
        try {
            if (!hasUnsavedChanges()) {storage().removeItem(draftKey);return true;}
            const draft={version:VERSION,page,key:draftKey,createdAt:new Date().toISOString(),state:copy(options.capture()),context:copy(context)};
            storage().setItem(draftKey,JSON.stringify(draft));
            return true;
        } catch(error) {warn('draft-save-failed',error);return false;}
    }
    function check() {
        if (disposed) return false;
        const changed=updateProtection();
        clearTimeout(timer);
        timer=setTimeout(()=>{timer=null;persist();},300);
        return changed;
    }
    function track(event) {if (root.contains(event.target)) check();}
    function afterClick(event) {if (root.contains(event.target)) Promise.resolve().then(()=>{if(!disposed)check();});}
    function onVisibility() {if (document.hidden) persist();}
    function onPageHide() {persist();}
    function acceptCurrent() {
        if (disposed) return false;
        const next=JSON.stringify(options.capture());
        if (next===undefined) throw Error('Capture must return JSON data.');
        const nextContext=copy(options.context?options.context():null);
        clearTimeout(timer);timer=null;
        baseline=next;context=nextContext;
        updateProtection();
        try {storage().removeItem(draftKey);}catch(error){warn('draft-clear-failed',error);}
    }
    function confirmDiscard(message='저장하지 않은 입력이 있어요. 이 내용을 버리고 계속할까요?') {
        if (!hasUnsavedChanges()) return true;
        persist();
        return window.confirm(message);
    }
    function listDrafts() {
        const result=[];
        try {
            const store=storage();
            for(let i=0;i<store.length;i++) {
                const key=store.key(i);
                if(!key||!key.startsWith(pagePrefix))continue;
                try {const draft=readDraft(key);if(draft)result.push(draft);}catch(error){warn('draft-read-failed',error);}
            }
        } catch(error) {warn('draft-list-failed',error);}
        return result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    }
    function restoreDraft(key) {
        if (disposed) return {ok:false,reason:'disposed'};
        if (hasUnsavedChanges()) return {ok:false,reason:'current-input-not-saved'};
        if (typeof options.restore!=='function'||typeof options.validateDraft!=='function') return {ok:false,reason:'restore-not-configured'};
        let draft,before,beforeContext;
        try {
            draft=readDraft(key);
            if (!draft) return {ok:false,reason:'invalid-draft'};
            if (options.validateDraft(copy(draft))!==true) return {ok:false,reason:'draft-not-compatible'};
            before=copy(options.capture());beforeContext=copy(options.context?options.context():null);
        } catch(error) {warn('draft-read-failed',error);return {ok:false,reason:'draft-read-failed'};}
        try {options.restore(copy(draft.state),copy(draft.context));}
        catch(error) {
            try {options.restore(before,beforeContext);}catch(rollbackError){warn('draft-rollback-failed',rollbackError);}
            check();warn('draft-restore-failed',error);
            return {ok:false,reason:'draft-restore-failed'};
        }
        check();
        return {ok:true};
    }
    function dispose() {
        if(disposed)return;
        persist();clearTimeout(timer);timer=null;
        document.removeEventListener('input',track,true);
        document.removeEventListener('change',track,true);
        document.removeEventListener('click',afterClick,true);
        document.removeEventListener('visibilitychange',onVisibility);
        window.removeEventListener('pagehide',onPageHide);
        window.removeEventListener('beforeunload',beforeUnload);
        disposed=true;listening=false;instances.delete(api);
    }
    const api={page,draftKey,hasUnsavedChanges,check,persist,acceptCurrent,confirmDiscard,listDrafts,restoreDraft,dispose};
    document.addEventListener('input',track,true);
    document.addEventListener('change',track,true);
    document.addEventListener('click',afterClick,true);
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pagehide',onPageHide);
    instances.add(api);
    return api;
}
window.FloveInputProtection={version:VERSION,create,initializationAction,hasUnsavedChanges:()=>[...instances].some(instance=>instance.hasUnsavedChanges())};
})();
