export function createBootSequence({onPhase,onReady,prepare=()=>Promise.resolve(),schedule=setTimeout,clear=clearTimeout}){
  let token=0;
  let timers=new Set();
  let running=false;
  function cancel(){
    token++;
    for(const timer of timers)clear(timer);
    timers.clear();
    running=false;
  }
  function after(ms,callback){
    const timer=schedule(()=>{timers.delete(timer);callback();},ms);
    timers.add(timer);
  }
  function finish(current){
    if(current!==token)return;
    cancel();
    onReady();
  }
  function start({reduced=false,mobile=false}={}){
    if(running)return;
    cancel();
    const current=token;
    running=true;
    if(reduced){finish(current);return;}
    if(mobile){onPhase("entering");after(220,()=>finish(current));return;}
    onPhase("revealing");
    after(650,()=>{if(current===token)onPhase("booting");});
    after(2050,()=>{
      const deadline=new Promise(resolve=>after(2500,resolve));
      const ready=Promise.resolve().then(prepare).catch(()=>undefined);
      void Promise.race([ready,deadline]).then(()=>{
        if(current!==token)return;
        onPhase("desktop");
        after(300,()=>{if(current===token)onPhase("entering");});
        after(1150,()=>finish(current));
      });
    });
  }
  function skip(){cancel();onReady();}
  return {start,cancel,skip};
}
