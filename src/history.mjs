import {need,parse,validate,str,alias,literal,enumOf,arr,obj,nullable,uint,digest,canonical,sha} from './strict.mjs';
export const SOURCE='threadport.synthetic-source/1.0.0';
export const HISTORY='threadport.history/1.0.0';
export const payloads={
 message:obj({role:enumOf('user','assistant'),channel:enumOf('analysis','commentary','final','none'),text:str(1024*1024)}),
 tool_call:obj({callAlias:alias,namespace:nullable(alias),name:str(),argumentsText:str(1024*1024)}),
 tool_result:obj({callAlias:alias,outputText:str(1024*1024),status:enumOf('completed','failed'),exitCode:nullable({...uint,minimum:-2147483648,maximum:2147483647})}),
 turn_end:obj({status:literal('completed')})
};
export const itemSchema=obj({id:alias,kind:enumOf('message','tool_call','tool_result'),payload:{anyOf:Object.values(payloads).slice(0,3)}});
export const sourceSchema=obj({schemaVersion:literal(SOURCE),turns:arr(obj({id:alias,status:enumOf('completed','in_progress','interrupted'),items:arr(itemSchema,10000)}),1000)});
export const recordSchema={anyOf:Object.entries(payloads).map(([kind,payload])=>obj({schemaVersion:literal(HISTORY),ordinal:uint,recordAlias:alias,turnAlias:alias,originalType:literal(kind),originalRole:enumOf('user','assistant','tool','none'),authority:literal('historical_data'),kind:literal(kind),payload}))};
export const recordBytes=records=>records.map(r=>canonical(r)+'\n').join('');
export function checkRecords(records,boundary){
 need(records.length>0&&records.length<=10000,'PACKAGE_LIMIT');
 const ids=new Set(),turns=new Set(),calls=new Map();let turn=null,ended=true;
 for(const [i,r]of records.entries()){
  validate(recordSchema,r);need(r.ordinal===i&&!ids.has(r.recordAlias));ids.add(r.recordAlias);
  if(r.turnAlias!==turn){need(ended&&!turns.has(r.turnAlias),'BOUNDARY_INVALID');turn=r.turnAlias;turns.add(turn);ended=false;}else need(!ended,'BOUNDARY_INVALID');
  const expected=r.kind==='message'?r.payload.role:r.kind==='tool_call'?'assistant':r.kind==='tool_result'?'tool':'none';need(r.originalRole===expected);
  if(r.kind==='tool_call'){need(!calls.has(r.payload.callAlias),'TOOL_PAIR_INVALID');calls.set(r.payload.callAlias,{turn,done:false});}
  if(r.kind==='tool_result'){const call=calls.get(r.payload.callAlias);need(call&&call.turn===turn&&!call.done,'TOOL_PAIR_INVALID');call.done=true;}
  if(r.kind==='turn_end'){need([...calls.values()].every(x=>x.done),'TOOL_PAIR_INVALID');ended=true;}
 }
 need(ended&&turn===boundary,'BOUNDARY_INVALID');return records;
}
export function materialize(input,boundaryId){
 const source=Buffer.isBuffer(input)||typeof input==='string'?parse(input,8*1024*1024):input;
 need(source?.schemaVersion===SOURCE,'UNSUPPORTED_VERSION');validate(sourceSchema,source);
 const seen=new Set(),items=new Set();for(const t of source.turns){need(!seen.has(t.id),'BOUNDARY_INVALID');seen.add(t.id);for(const it of t.items){need(!items.has(it.id));items.add(it.id);validate(payloads[it.kind],it.payload);}}
 const n=source.turns.findIndex(t=>t.id===boundaryId);need(n>=0,'BOUNDARY_INVALID');
 const prefix=source.turns.slice(0,n+1);need(prefix.every(t=>t.status==='completed'),'BOUNDARY_INVALID');
 // Do not preserve source IDs/metadata: aliases derive only from included ordinal positions.
 const records=[],callAliases=new Map();
 for(const [ti,t]of prefix.entries()){
  const turnAlias=`t${ti}`;
  for(const item of t.items){const payload=structuredClone(item.payload);
   if(item.kind==='tool_call'){need(!callAliases.has(payload.callAlias),'TOOL_PAIR_INVALID');callAliases.set(payload.callAlias,`c${callAliases.size}`);payload.callAlias=callAliases.get(payload.callAlias);}
   if(item.kind==='tool_result'){need(callAliases.has(payload.callAlias),'TOOL_PAIR_INVALID');payload.callAlias=callAliases.get(payload.callAlias);}
   records.push({schemaVersion:HISTORY,ordinal:records.length,recordAlias:`r${records.length}`,turnAlias,originalType:item.kind,originalRole:item.kind==='message'?payload.role:item.kind==='tool_call'?'assistant':'tool',authority:'historical_data',kind:item.kind,payload});
  }
  records.push({schemaVersion:HISTORY,ordinal:records.length,recordAlias:`r${records.length}`,turnAlias,originalType:'turn_end',originalRole:'none',authority:'historical_data',kind:'turn_end',payload:{status:'completed'}});
 }
 checkRecords(records,`t${n}`);
 return {records,boundary:{sourceAlias:'source',turnAlias:`t${n}`,inclusive:true,terminalStatus:'completed',prefixDigest:digest(records)},historyDigest:sha(recordBytes(records)),evidenceClass:'synthetic_only'};
}
