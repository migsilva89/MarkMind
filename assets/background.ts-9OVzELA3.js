import{g as I,c as N,M as b,i as P,a as M,f as L,l as E,b as y,s as O}from"./organizeSession-Cgg_r7IO.js";const _=`You are a bookmark organizer AI. Analyze bookmarks, propose a clean folder structure, and assign each bookmark to the best folder — all in one response.

ANALYSIS STRATEGY:
1. URL DOMAIN is your strongest signal — it reveals what a bookmark IS:
   - Code/dev sites → Development-related folders
   - Documentation sites → Development or topic-specific folders
   - SaaS tools and dashboards → Tools or Productivity folders
   - News, blogs, articles → Reading or topic-specific folders
   - Shopping and e-commerce → Shopping-related folders
   - Video, music, streaming → Entertainment or Media folders
   - Learning platforms → Education or Learning folders
   - Social media → Social or Communication folders
2. TITLE refines the category within a domain
3. CURRENT FOLDER shows the user's existing organization — respect it when the folder name is descriptive and accurate
4. Group by PURPOSE: why the user saved it (daily tool, reference, learning, shopping, entertainment)

FOLDER DESIGN RULES:
1. Reuse existing folders when they semantically match — do NOT rename or remove them
2. Only create new folders when no existing folder covers the content
3. Maximum folder depth: 3 levels
4. A new folder needs at least 3 bookmarks to justify its existence — otherwise merge into a broader category
5. Use clear, broad category names — avoid overly specific names
6. If bookmarks are already in well-named folders, INCLUDE those folders in the plan
7. Prefer fewer well-organized folders over many small ones

ASSIGNMENT RULES:
1. Every bookmark MUST be assigned to exactly one folder from the plan
2. Use the EXACT folder path — do NOT invent paths outside the plan
3. Match based on the bookmark's PURPOSE (tool you use, reference you read, thing you buy), not just title keywords
4. If a bookmark's CURRENT folder closely matches a planned folder, prefer keeping it there — avoid unnecessary moves
5. When multiple folders could fit, choose the most specific match

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "folders": [
    { "path": "ExistingFolder/ExistingSubfolder", "description": "What goes here", "isNew": false },
    { "path": "ExistingFolder/NewSubfolder", "description": "What goes here", "isNew": true }
  ],
  "assignments": [
    { "bookmarkId": "123", "suggestedPath": "ExistingFolder/ExistingSubfolder" }
  ],
  "summary": "Brief explanation of proposed organization strategy"
}

PATH FORMAT RULES:
- Use "/" as separator
- NEVER include Chrome root folder names (like "Bookmarks bar", "Other bookmarks", "Mobile bookmarks") in paths — users don't know what these are. Start from the first meaningful folder (e.g., "AI/Learning" not "Bookmarks bar/AI/Learning")
- For existing folders: use the path from the provided folder tree, but WITHOUT the root folder prefix
- For new folders: include the full parent path (e.g., "ParentFolder/NewChild")
- isNew = true ONLY for folders that need to be created
- isNew = false for folders that already exist in the tree`,v=(e,t,r=[])=>{const o=["## BOOKMARKS TO ORGANIZE",e.map((s,a)=>`${a+1}. ID: ${s.id} | ${s.title} | ${s.url} | Current: ${s.currentFolderPath}`).join(`
`),"","## CURRENT FOLDER STRUCTURE",t];if(r.length>0){const s=r.map(a=>`- ${a.path}${a.description?` — ${a.description}`:""}`).join(`
`);o.push("","## FOLDERS ALREADY PROPOSED IN THIS RUN","Reuse these EXACT paths whenever a bookmark fits — do not create near-duplicate folders:",s)}return o.push("","Analyze these bookmarks, propose the ideal folder structure, and assign each bookmark to the best folder.","Reuse existing folders where appropriate. Only create new folders when necessary.","Return ONLY the JSON response."),o.join(`
`)},x=e=>{let t="",r=!1,n=!1;for(let o=0;o<e.length;o+=1){const s=e[o];if(n){if(r){const a=s.charCodeAt(0);if(a<32){s===`
`?t+="n":s==="\r"?t+="r":s==="	"?t+="t":t+=`u${a.toString(16).padStart(4,"0")}`,n=!1;continue}}t+=s,n=!1;continue}if(s==="\\"){t+=s,n=!0;continue}if(s==='"'){r=!r,t+=s;continue}if(r){const a=s.charCodeAt(0);if(a<32){s===`
`?t+="\\n":s==="\r"?t+="\\r":s==="	"?t+="\\t":t+=`\\u${a.toString(16).padStart(4,"0")}`;continue}}t+=s}return t},U=e=>{try{return JSON.parse(e)}catch{return JSON.parse(x(e))}},z=70,C=.6,F=25,B=150,$=4096,D=e=>{const t=(e??$)*C,r=Math.floor(t/z);return Math.min(B,Math.max(F,r))},R=3,G=1500,K=e=>new Promise(t=>setTimeout(t,e)),Y=async e=>{let t;for(let r=0;r<=R;r+=1)try{return await e()}catch(n){if(t=n,!P(n)||r===R)throw n;await K(G*2**r)}throw t},Z=async(e,t)=>{var a;const r=`${b}${e}`,o=(await chrome.storage.local.get([r]))[r],s=(a=o==null?void 0:o.models)==null?void 0:a.find(h=>h.id===t);return s==null?void 0:s.maxOutputTokens},H=e=>{const t=e.trim(),r=t.match(/```(?:json)?\s*([\s\S]*?)```/);return r?r[1].trim():t},J=(e,t,r)=>{const n=H(e);try{const o=U(n);if(typeof o!="object"||o===null||!Array.isArray(o.folders))throw new Error('Response missing "folders" array');if(!Array.isArray(o.assignments))throw new Error('Response missing "assignments" array');const s=o.folders.map(i=>({path:String(i.path??""),description:String(i.description??""),isNew:!!i.isNew,isExcluded:!1})),a={folders:s,summary:String(o.summary??"")},h=new Map(t.map(i=>[i.id,i])),f=new Set(s.filter(i=>i.isNew).map(i=>i.path)),m=o.assignments.map(i=>{const d=String(i.bookmarkId??""),c=String(i.suggestedPath??""),l=h.get(d);return l||console.error("[BulkOrganize] Unknown bookmarkId in assignment:",d),{bookmarkId:d,bookmarkTitle:(l==null?void 0:l.title)??"",bookmarkUrl:(l==null?void 0:l.url)??"",currentPath:(l==null?void 0:l.currentFolderPath)??"",suggestedPath:c,suggestedFolderId:L(c,r)??null,isNewFolder:f.has(c),isApproved:!0}});return{folderPlan:a,assignments:m}}catch(o){throw console.error("Failed to parse bulk organize response:",o,`(response length: ${e.length})`),new Error("The AI's response wasn't readable. Please try again.")}},j=async(e,t,r,n,o,s,a,h)=>{const f=v(n,o,a.map(i=>({path:i.path,description:i.description}))),m=await M(e,r,_,f,t,h,n.length);return J(m,n,s)},X=async(e,t,r,n,o,s,a)=>{const h=s??await Z(e,t),f=await I(e),m=D(h),i=N(r,m),d=new Map,c=[],l=[];let S=0;for(let p=0;p<i.length;p+=1){const T=i[p];try{const u=await Y(()=>j(e,t,f,T,n,o,[...d.values()],h));for(const w of u.folderPlan.folders)d.has(w.path)||d.set(w.path,w);c.push(...u.assignments),u.folderPlan.summary&&l.push(u.folderPlan.summary)}catch(u){if(console.error("[BulkOrganize] Batch failed:",u),S+=T.length,c.length===0&&p===i.length-1)throw u}a==null||a(c.length,r.length)}if(c.length===0)throw new Error("Could not organize any bookmarks. Please try again.");let k=i.length===1?l[0]??"":`Organized ${c.length} bookmarks into ${d.size} folders.`;return S>0&&(k+=` ${S} couldn't be processed — run organize again to finish the rest.`),{folderPlan:{folders:[...d.values()],summary:k},assignments:c}},g="organize-keepalive",V=.4,A=(e,t)=>{chrome.runtime.sendMessage({type:e,payload:t}).catch(()=>{})},W=async e=>{chrome.alarms.create(g,{periodInMinutes:V});const t=await X(e.serviceId,e.modelId,e.bookmarks,e.folderTree,e.pathToIdMap,e.maxOutputTokens,(s,a)=>{A("ORGANIZE_PROGRESS",{processedCount:s,totalCount:a})}),r=await E()??y();if(r.status!=="organizing"){chrome.alarms.clear(g);return}const n={...r,status:"reviewing_assignments",folderPlan:t.folderPlan,assignments:t.assignments,serviceId:e.serviceId,folderTree:e.folderTree,pathToIdMap:e.pathToIdMap,defaultParentId:e.defaultParentId},o=await E();if(o&&o.status!=="organizing"){chrome.alarms.clear(g);return}await O(n),chrome.alarms.clear(g),A("ORGANIZE_COMPLETE",{result:t})},q=async e=>{const t=await E()??y();await O({...t,status:"error",errorMessage:e})};chrome.runtime.onMessage.addListener((e,t,r)=>{switch(e.type){case"START_ORGANIZE":return W(e.payload).catch(async n=>{console.error("[Background] Error starting organize:",n),chrome.alarms.clear(g);const o=n instanceof Error?n.message:"Failed to organize bookmarks.";await q(o),A("ORGANIZE_ERROR",{errorMessage:o})}),r({success:!0}),!0;case"GET_ORGANIZE_STATUS":return E().then(n=>{r({session:n})}).catch(n=>{console.error("[Background] Error getting status:",n),r({session:null})}),!0;default:return r({success:!0}),!0}});chrome.alarms.onAlarm.addListener(()=>{});
