// Prueba de humo: ejecuta principal.js con un navegador simulado
const fs=require('fs'),vm=require('vm'),dir=process.argv[2]
const el=()=>({value:'',textContent:'',innerHTML:'',disabled:false,width:0,height:0,getContext:()=>ctx})
const calls={arc:0,stroke:0,fill:0}
const ctx=new Proxy({},{get:(t,k)=>{if(k in calls)return()=>calls[k]++;return()=>{}},set:()=>true})
const ids={}
const vals={'#hormigas':1000,'#carga':1000,'#workers':0}
const doc={querySelector:s=>{ids[s]=ids[s]||el();if(vals[s]!==undefined&&!ids[s].value)ids[s].value=vals[s];return ids[s]}}
let raf=[]
class Worker{constructor(f){this.cola=[];const sb={importScripts:()=>vm.runInContext(fs.readFileSync(dir+'/js/hormigas.js','utf8'),sb2),postMessage:d=>setImmediate(()=>this.onmessage({data:d}))}
 var sb2=vm.createContext(sb);sb.onmessage=null;this.sb=sb2;vm.runInContext(fs.readFileSync(dir+'/js/trabajador.js','utf8'),sb2)}
 postMessage(d){setImmediate(()=>vm.runInContext('onmessage',this.sb)({data:structuredClone(d)}))}
 terminate(){}}
const g={document:doc,Worker,performance,requestAnimationFrame:f=>{raf.push(f)},setTimeout,Math,Float32Array,Number,console,structuredClone}
const c=vm.createContext(g)
vm.runInContext(fs.readFileSync(dir+'/js/hormigas.js','utf8'),c)
vm.runInContext(fs.readFileSync(dir+'/js/principal.js','utf8'),c)
async function frames(n){for(let i=0;i<n;i++){const f=raf.shift();if(f)f();await new Promise(r=>setTimeout(r,2))}}
(async()=>{
 await frames(5);console.log('sin workers: fotogramas dibujados OK, fill/stroke:',calls.fill,calls.stroke)
 ids['#workers'].value=4; ids['#workers'].oninput(); await frames(30)
 console.log('con 4 workers: modo =',ids['#modo'].textContent)
 const antes=calls.fill; await frames(30); console.log('fotogramas con workers (fill extra):',calls.fill-antes)
 ids['#hormigas'].value=99999; ids['#hormigas'].oninput(); console.log('valor 99999 se limita a',ids['#textoHormigas'].textContent)
 ids['#carga'].value='abc'; ids['#carga'].oninput(); console.log("carga 'abc' ->",ids['#textoCarga'].textContent)
 process.exit(0)
})().catch(e=>{console.error('FALLO',e);process.exit(1)})
