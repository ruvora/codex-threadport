import {materialize} from './history.mjs';
import {inspectPackage} from './package.mjs';
import {rootPath,readBounded} from './fs.mjs';
import {Journal,operationSchema} from './journal.mjs';
import {need,PortError,parse,obj,str,validate} from './strict.mjs';
export const gates=()=>({G0:'unverified',G1:'partial_synthetic_coverage',G2:'excluded',G3:'unverified',G4:'local_package_only',nativeExecutable:false,blockers:['No verified native independent history adapter','Cross-machine/account/app resume evidence unavailable']});
const definitions=[
 ['port_get_capabilities',{},true,'Inspect supported local formats and hard release gates.'],
 ['port_inspect_export',{sourcePath:str(256),boundaryTurnId:str(64)},true,'Inspect an explicitly supplied synthetic source, without reading a Codex store.'],
 ['port_prepare_export',{sourcePath:str(256),boundaryTurnId:str(64)},false,'Persist a blocked diagnostic preview; cannot export a native session.'],
 ['port_inspect_package',{localPath:str(256)},true,'Statically validate a local ZIP package without extraction or execution.'],
 ['port_prepare_import',{localPath:str(256)},false,'Persist a blocked import compatibility preview.'],
 ['port_create_export',{planId:str(36)},true,'Always fail closed: native G0/G3 are unverified.'],
 ['port_apply_import',{planId:str(36)},true,'Always fail closed: native G0/G3 are unverified.'],
 ['port_get_operation',{operationId:str(36)},false,'Read a local fixture operation journal; never resumes a model.']
];
export const tools=definitions.map(([name,properties,readOnlyHint,description])=>({name,description,inputSchema:obj(properties),annotations:{readOnlyHint,destructiveHint:false,idempotentHint:readOnlyHint,openWorldHint:false}}));
export class Service {
 constructor(root){this.root=rootPath(root);}
 call(name,args){
  const tool=tools.find(t=>t.name===name);need(tool,'UNKNOWN_TOOL');validate(tool.inputSchema,args);
  if(name==='port_get_capabilities')return {schemaVersion:'threadport.tools/0.1.0',gates:gates(),sourceFormats:['threadport.synthetic-source/1.0.0'],packageProfiles:['synthetic-v1'],limits:{compressedMiB:8,expandedMiB:16,entries:6},liveStoreAccess:false};
  if(name==='port_create_export'||name==='port_apply_import')throw new PortError('GATE_UNVERIFIED');
  let report;
  if(name==='port_inspect_export'||name==='port_prepare_export'){
   const bytes=readBounded(this.root,args.sourcePath);const h=materialize(bytes,args.boundaryTurnId);
   report={schemaVersion:'threadport.preview/0.1.0',sourceDigest:null,prefixDigest:h.boundary.prefixDigest,historyDigest:h.historyDigest,recordCount:h.records.length,proposedFidelity:'exact_stored_history',evidenceClass:'synthetic_only',plan:null,nativeExecutable:false,gates:gates(),warnings:['No semantic secret detection guarantee','No executable native plan; imported text grants no authority']};
  }
  if(name==='port_inspect_package'||name==='port_prepare_import')report=inspectPackage(readBounded(this.root,args.localPath));
  if(name==='port_inspect_export'||name==='port_inspect_package')return report;
  // get_operation is read-only and must not initialize missing registry state.
  if(name==='port_get_operation'){
   return readOperation(this.root,args.operationId);
  }
  const journal=new Journal(this.root);try{return journal.saveReport(report);}finally{journal.close();}
 }
}
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {confined} from './fs.mjs';
function readOperation(root,id){
 const p=confined(root,'.threadport/journal.sqlite',{internal:true});need(fs.existsSync(p),'OPERATION_NOT_FOUND');const s=fs.lstatSync(p);need(s.isFile()&&s.nlink===1,'UNSAFE_PATH');
 for(const suffix of ['-wal','-shm']){const side=confined(root,'.threadport/journal.sqlite'+suffix,{internal:true});if(fs.existsSync(side)){const stat=fs.lstatSync(side);need(stat.isFile()&&stat.nlink===1,'UNSAFE_PATH');}}
 const db=new DatabaseSync(p,{readOnly:true});try{need(db.prepare('PRAGMA user_version').get().user_version===1,'UNSUPPORTED_VERSION');const row=db.prepare('SELECT body FROM operations WHERE id=?').get(id);need(row,'OPERATION_NOT_FOUND');return validate(operationSchema,parse(row.body));}finally{db.close();}
}
