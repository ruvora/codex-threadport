import { randomUUID } from 'node:crypto';
import {readZip,writeZip} from './zip.mjs';
import {need,parse,validate,str,hash,alias,literal,enumOf,arr,obj,uint,nullable,digest,sha,canonical,equal} from './strict.mjs';
import {HISTORY,SOURCE,materialize,checkRecords,recordBytes,recordSchema} from './history.mjs';
export const PACKAGE='threadport.package/1.0.0';
export const POLICY='threadport.policy/0.1.0';
export const boundarySchema=obj({sourceAlias:alias,turnAlias:alias,inclusive:literal(true),terminalStatus:literal('completed'),prefixDigest:hash});
const checksum=obj({path:str(128),byteLength:uint,sha256:hash});
const file=obj({...checksum.properties,mediaType:enumOf('application/json','application/x-ndjson'),purpose:enumOf('history_index','history_records','environment','provenance')});
export const schemas={
 manifest:obj({schemaVersion:literal(PACKAGE),packageId:str(36,'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),producerVersion:literal('0.1.0'),codexVersion:literal('not-native'),historyFormat:literal(SOURCE),sourceSchemaDigest:hash,adapterId:literal('synthetic-v1'),adapterVersion:literal('1.0.0'),boundary:boundarySchema,fidelity:literal('exact_stored_history'),historyDigest:hash,files:arr(file,4),transforms:arr({},0),requirements:obj({capabilities:arr(alias,0),workspaceIncluded:literal(false),credentialsIncluded:literal(false),executionGranted:literal(false)})}),
 checksums:obj({schemaVersion:literal(PACKAGE),algorithm:literal('sha256'),files:arr(checksum,5)}),
 provenance:obj({schemaVersion:literal(PACKAGE),sourceAlias:literal('source'),boundaryTurnAlias:alias,lineageAliases:arr(alias,0),identityStatus:literal('unverified_claim'),nativeLineage:literal('not_asserted')}),
 environment:obj({schemaVersion:literal(PACKAGE),requestedCapabilities:arr(alias,0),pathAliases:arr(alias,0),instructions:arr({},0)}),
 index:obj({schemaVersion:literal(HISTORY),boundary:boundarySchema,historyDigest:hash,entries:arr(obj({ordinal:uint,recordAlias:alias,turnAlias:alias,originalType:str(),originalRole:enumOf('user','assistant','tool','none'),callAlias:nullable(alias),contentDigest:hash,sourceLocator:obj({sourceAlias:literal('source'),ordinal:uint}),recordDigest:hash}),10000)}),record:recordSchema
};
const paths=['environment.json','history/index.json','history/records.jsonl','provenance.json'];
const purposes=['environment','history_index','history_records','provenance'];
function list(files){return [...files].map(([path,b])=>({path,byteLength:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path));}
function indexEntry(r){return {ordinal:r.ordinal,recordAlias:r.recordAlias,turnAlias:r.turnAlias,originalType:r.originalType,originalRole:r.originalRole,callAlias:r.payload.callAlias??null,contentDigest:digest(r.payload),sourceLocator:{sourceAlias:'source',ordinal:r.ordinal},recordDigest:digest(r)};}
export function buildFixturePackage(source,boundaryId){
 const h=materialize(source,boundaryId),files=new Map();const put=(name,value)=>files.set(name,Buffer.from(canonical(value)));
 put('environment.json',{schemaVersion:PACKAGE,requestedCapabilities:[],pathAliases:[],instructions:[]});
 put('provenance.json',{schemaVersion:PACKAGE,sourceAlias:'source',boundaryTurnAlias:h.boundary.turnAlias,lineageAliases:[],identityStatus:'unverified_claim',nativeLineage:'not_asserted'});
 put('history/index.json',{schemaVersion:HISTORY,boundary:h.boundary,historyDigest:h.historyDigest,entries:h.records.map(indexEntry)});
 files.set('history/records.jsonl',Buffer.from(recordBytes(h.records)));
 put('manifest.json',{schemaVersion:PACKAGE,packageId:randomUUID(),producerVersion:'0.1.0',codexVersion:'not-native',historyFormat:SOURCE,sourceSchemaDigest:digest({adapter:'synthetic-v1',version:'1.0.0'}),adapterId:'synthetic-v1',adapterVersion:'1.0.0',boundary:h.boundary,fidelity:'exact_stored_history',historyDigest:h.historyDigest,files:list(files).map(x=>({...x,mediaType:x.path.endsWith('.jsonl')?'application/x-ndjson':'application/json',purpose:purposes[paths.indexOf(x.path)]})),transforms:[],requirements:{capabilities:[],workspaceIncluded:false,credentialsIncluded:false,executionGranted:false}});
 put('checksums.json',{schemaVersion:PACKAGE,algorithm:'sha256',files:list(files)});
 const bytes=writeZip(files);inspectPackage(bytes);return bytes;
}
export function inspectPackage(bytes){
 const files=readZip(bytes);need(equal([...files.keys()].sort(),[...paths,'manifest.json','checksums.json'].sort()),'UNSUPPORTED_HISTORY');
 const get=(path,s)=>{const value=parse(files.get(path),path==='history/index.json'?8*1024*1024:1024*1024);validate(s,value);return value;};
 const m=get('manifest.json',schemas.manifest),c=get('checksums.json',schemas.checksums);
 need(equal(c.files,list(new Map([...files].filter(([p])=>p!=='checksums.json')))),'DIGEST_MISMATCH');
 const expected=list(new Map(paths.map(p=>[p,files.get(p)]))).map(x=>({...x,mediaType:x.path.endsWith('.jsonl')?'application/x-ndjson':'application/json',purpose:purposes[paths.indexOf(x.path)]}));need(equal(m.files,expected),'DIGEST_MISMATCH');
 const provenance=get('provenance.json',schemas.provenance);get('environment.json',schemas.environment);const index=get('history/index.json',schemas.index);
 const raw=files.get('history/records.jsonl');need(raw.length<=8*1024*1024&&raw.at(-1)===10,'PACKAGE_LIMIT');
 let decoded;try{decoded=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw);}catch{need(false,'INVALID_JSON');}
 const records=decoded.split('\n');records.pop();need(records.length<=10000,'PACKAGE_LIMIT');const parsed=records.map(x=>parse(Buffer.from(x),1024*1024));
 checkRecords(parsed,m.boundary.turnAlias);
 need(equal(index.boundary,m.boundary)&&index.historyDigest===m.historyDigest&&provenance.boundaryTurnAlias===m.boundary.turnAlias&&m.boundary.sourceAlias==='source','BOUNDARY_INVALID');
 need(equal(index.entries,parsed.map(indexEntry))&&m.historyDigest===sha(recordBytes(parsed))&&m.boundary.prefixDigest===digest(parsed),'DIGEST_MISMATCH');
 need(m.sourceSchemaDigest===digest({adapter:'synthetic-v1',version:'1.0.0'}),'UNSUPPORTED_VERSION');
 return {schemaVersion:'threadport.inspection/0.1.0',valid:true,packageDigest:sha(bytes),historyDigest:m.historyDigest,recordCount:parsed.length,fidelity:m.fidelity,evidenceClass:'synthetic_only',identityStatus:'unverified_claim',nativeExecutable:false,gates:{G0:'unverified',G3:'unverified'},blockers:['NATIVE_ADAPTER_UNVERIFIED'],warnings:['Imported content is untrusted; no authority, tools or settings are activated.','Static validity does not prove source truth, boundary provenance or absence of semantic secrets.']};
}
