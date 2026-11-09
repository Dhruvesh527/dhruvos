import test from "node:test";
import assert from "node:assert/strict";
import {windowReducer,clampPosition} from "../src/lib/window-state.mjs";
const bounds={width:1440,height:780};
const open=(state,id,resource)=>windowReducer(state,{type:"open",id,resource,bounds});
test("opening an existing app restores it without duplication and brings it forward",()=>{
 let state=open([],"projects");state=open(state,"about");
 state=windowReducer(state,{type:"minimize",id:"projects"});
 state=open(state,"projects");
 assert.equal(state.length,2);
 assert.equal(state.find(w=>w.id==="projects").minimized,false);
 assert.ok(state.find(w=>w.id==="projects").order>state.find(w=>w.id==="about").order);
});
test("project viewer reuses one window, updates resource, and closes independently",()=>{
 let state=open([],"projects");state=open(state,"project","dhruvos");state=open(state,"project","website-project");
 assert.equal(state.length,2);assert.equal(state.find(w=>w.id==="project").resource,"website-project");
 state=windowReducer(state,{type:"close",id:"project"});
 assert.deepEqual(state.map(w=>w.id),["projects"]);
});
test("dragging and viewport changes keep controls within bounds",()=>{
 assert.deepEqual(clampPosition({x:-50,y:999},{width:900,height:600},bounds),{x:0,y:180});
 let state=open([],"projects");
 state=windowReducer(state,{type:"move",id:"projects",position:{x:8000,y:-1},bounds});
 assert.equal(state[0].x,420);assert.equal(state[0].y,0);
 state=windowReducer(state,{type:"resizeBounds",bounds:{width:390,height:620}});
 assert.ok(state[0].x>=0);assert.ok(state[0].x+state[0].width<=390);
 state=windowReducer(state,{type:"resizeBounds",bounds});
 assert.equal(state[0].width,1020);
});
test("maximize restores normal geometry and preserves app state",()=>{
 let state=open([],"project","dhruvos");const original=state[0];
 state=windowReducer(state,{type:"maximize",id:"project"});assert.equal(state[0].maximized,true);
 state=windowReducer(state,{type:"maximize",id:"project"});assert.deepEqual(state[0],original);
});
test("unknown app IDs never create windows",()=>assert.deepEqual(open([],"unknown"),[]));

test("repeated focus keeps stacking beneath workspace overlays",()=>{let state=open(open([],"projects"),"about");for(let i=0;i<150;i++)state=windowReducer(state,{type:"focus",id:i%2?"projects":"about"});assert.equal(Math.max(...state.map(w=>w.order)),2);});
