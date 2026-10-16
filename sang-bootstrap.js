/* Ethics cold-start guard: no placeholder records before the first server read. */
(() => {
'use strict';
if ((window.FLOVE_SYNC_CONFIG||{}).page!=='sang'||window.__floveEthicsBootstrapGuard) return;
if (document.readyState!=='loading') {
    console.warn('[Flove Ethics Bootstrap] Load this guard before DOMContentLoaded.');
    return;
}
const recordKeys=['liv_ethic_notes_v11','liv_ethic_notes_v10','liv_ethic_notes_v9'];
let hadStoredRecords;
try {hadStoredRecords=recordKeys.some(key=>localStorage.getItem(key)!==null);}
catch(error) {console.warn('[Flove Ethics Bootstrap] Cannot inspect existing records.',error);return;}
window.__floveEthicsBootstrapGuard=true;
document.addEventListener('DOMContentLoaded',()=>{
    if (hadStoredRecords||typeof saveNotes!=='function'||typeof notes==='undefined'||!Array.isArray(notes)) return;
    const previousSave=saveNotes;
    let bootDispatch=true;
    const guardedSave=function(...args){
        if (bootDispatch&&notes.length===0) return;
        return previousSave.apply(this,args);
    };
    saveNotes=guardedSave;
    setTimeout(()=>{
        bootDispatch=false;
        if (saveNotes===guardedSave) saveNotes=previousSave;
    },0);
},{capture:true,once:true});
})();
