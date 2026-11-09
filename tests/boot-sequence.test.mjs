import test from "node:test";
import assert from "node:assert/strict";
import {createBootSequence} from "../src/lib/boot-sequence.mjs";
function harness(prepare=()=>Promise.resolve()){
 let now=0,id=0;const tasks=new Map(),phases=[];
 const sequence=createBootSequence({onPhase:p=>phases.push(p),onReady:()=>phases.push("ready"),prepare,
   schedule:(fn,delay)=>{const key=++id;tasks.set(key,{at:now+delay,fn});return key;},clear:key=>tasks.delete(key)});
 async function advance(ms){
   const target=now+ms;
   for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at).find(([,t])=>t.at<=target);if(!next)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();for(let i=0;i<6;i++)await Promise.resolve();}
   now=target;for(let i=0;i<6;i++)await Promise.resolve();
 }
 return {sequence,phases,advance,tasks};
}
test("desktop sequence reveals content before camera enters and completes",async()=>{
 const h=harness();h.sequence.start();await h.advance(2050);
 assert.deepEqual(h.phases,["revealing","booting","desktop"]);
 await h.advance(300);assert.equal(h.phases.at(-1),"entering");
 await h.advance(850);assert.equal(h.phases.at(-1),"ready");assert.equal(h.tasks.size,0);
});
test("skip cancels pending phases even when assets finish later",async()=>{
 let resolve;const pending=new Promise(r=>resolve=r);const h=harness(()=>pending);
 h.sequence.start();await h.advance(2050);h.sequence.skip();resolve();await h.advance(10000);
 assert.deepEqual(h.phases,["revealing","booting","ready"]);assert.equal(h.tasks.size,0);
});
test("repeated power presses cannot duplicate a running sequence",async()=>{
 const h=harness();h.sequence.start();h.sequence.start();await h.advance(3200);
 assert.equal(h.phases.filter(p=>p==="revealing").length,1);
 assert.equal(h.phases.filter(p=>p==="ready").length,1);
});
test("reduced motion bypasses camera and loading",()=>{const h=harness();h.sequence.start({reduced:true});assert.deepEqual(h.phases,["ready"]);assert.equal(h.tasks.size,0);});
test("phones receive a brief transition without a miniature laptop",async()=>{const h=harness();h.sequence.start({mobile:true});await h.advance(220);assert.deepEqual(h.phases,["entering","ready"]);});
test("unresponsive assets cannot trap visitors indefinitely",async()=>{const h=harness(()=>new Promise(()=>{}));h.sequence.start();await h.advance(5700);assert.equal(h.phases.at(-1),"ready");assert.equal(h.tasks.size,0);});
test("disposing cancels all work without reporting completion",async()=>{const h=harness();h.sequence.start();h.sequence.cancel();await h.advance(10000);assert.deepEqual(h.phases,["revealing"]);});
