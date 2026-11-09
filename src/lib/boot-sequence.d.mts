export type BootPhase="revealing"|"booting"|"desktop"|"entering";
export function createBootSequence(options:{
  onPhase:(phase:BootPhase)=>void;
  onReady:()=>void;
  prepare?:()=>Promise<unknown>;
  schedule?:typeof setTimeout;
  clear?:typeof clearTimeout;
}):{start:(options?:{reduced?:boolean;mobile?:boolean})=>void;cancel:()=>void;skip:()=>void};
