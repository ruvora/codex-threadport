import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
import {need,PortError,canonical,digest,sha,parse,validate,obj,str,literal,enumOf,uint,hash,nullable,arr} from './strict.mjs';
import {rootPath,ensurePrivate,publish,readBounded,syncDir} from './fs.mjs';
import {inspectPackage,POLICY} from './package.mjs';
export const LOCAL='threadport.fixture-operation/0.1.0';
const uuid=str(36,'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
export const receiptSchema=obj({schemaVersion:literal(LOCAL),approvalId:uuid,planDigest:hash,planId:uuid,revision:literal(1),action:enumOf('fixture_export','fixture_import'),target:literal('fixture-local'),rootBinding:hash,approvedAt:uint,expiresAt:uint,authTag:hash});
const previewSchema=obj({schemaVersion:literal('threadport.inspection/0.1.0'),valid:literal(true),packageDigest:hash,historyDigest:hash,recordCount:uint,fidelity:literal('exact_stored_history'),evidenceClass:literal('synthetic_only'),identityStatus:literal('unverified_claim'),nativeExecutable:literal(false),gates:obj({G0:literal('unverified'),G3:literal('unverified')}),blockers:arr(str(),8),warnings:arr(str(),8)});
export const planSchema=obj({schemaVersion:literal(LOCAL),planId:uuid,revision:literal(1),kind:enumOf('fixture_export','fixture_import'),target:literal('fixture-local'),rootBinding:hash,policyVersion:literal(POLICY),adapterVersion:literal('synthetic-v1/1.0.0'),packageDigest:hash,historyDigest:hash,preview:previewSchema,expiresAt:uint,expectedEffects:arr(enumOf('write_fixture_zip','write_fixture_session'),1),nativeExecutable:literal(false),planDigest:hash});
export const operationSchema=obj({schemaVersion:literal(LOCAL),operationId:uuid,planId:uuid,planDigest:hash,kind:enumOf('fixture_export','fixture_import'),state:enumOf('creating','attention','completed'),packageDigest:hash,historyDigest:hash,nativeThreadRef:literal(null),evidenceClass:literal('synthetic_only'),generation:uint,createdFile:nullable(str(256)),error:nullable(literal('IMPORT_RECONCILIATION_REQUIRED'))});
export class Journal {
 constructor(root){
  this.root=rootPath(root);const identity=fs.statSync(this.root);this.binding=digest({path:this.root,dev:identity.dev,ino:identity.ino});this.dir=path.join(this.root,'.threadport');ensurePrivate(this.dir);
  for(const name of ['plans','outputs','sessions','reports'])ensurePrivate(path.join(this.dir,name));
  const dbpath=path.join(this.dir,'journal.sqlite');
  for(const suffix of ['','-wal','-shm']){const p=dbpath+suffix;if(fs.lstatSync(p,{throwIfNoEntry:false})){const s=fs.lstatSync(p);need(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&(s.mode&0o077)===0,'UNSAFE_PATH');}}
  const mask=process.umask(0o077);try{this.db=new DatabaseSync(dbpath);this.db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;');
   const v=this.db.prepare('PRAGMA user_version').get().user_version;need(v===0||v===1,'UNSUPPORTED_VERSION');
   this.db.exec(`CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,digest TEXT NOT NULL,body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,plan_digest TEXT NOT NULL,body TEXT NOT NULL,used_by TEXT);
    CREATE TABLE IF NOT EXISTS operations(id TEXT PRIMARY KEY,key TEXT UNIQUE NOT NULL,plan_digest TEXT NOT NULL,body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL); PRAGMA user_version=1;`);
   this.db.prepare('INSERT OR IGNORE INTO metadata VALUES (?,?)').run('local-secret',randomBytes(32).toString('hex'));
   this.secret=Buffer.from(this.db.prepare('SELECT value FROM metadata WHERE key=?').get('local-secret').value,'hex');syncDir(this.dir);
  }catch(e){this.db?.close();throw e;}finally{process.umask(mask);}
 }
 close(){this.db.close();}
 assertRoot(){
  let identity;try{identity=fs.lstatSync(this.root);}catch{throw new PortError('PLAN_STALE');}
  need(identity.isDirectory()&&!identity.isSymbolicLink()&&digest({path:this.root,dev:identity.dev,ino:identity.ino})===this.binding,'PLAN_STALE');
 }
 tx(fn){this.assertRoot();this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 saveReport(report){this.assertRoot();need(fs.readdirSync(path.join(this.dir,'reports')).length<128,'PACKAGE_LIMIT');const id=randomUUID();publish(path.join(this.dir,'reports'),id+'.json',canonical(report));return {reportId:id,report};}
 prepare(kind,bytes,target='fixture-local',now=Date.now()){
  this.assertRoot();
  need(this.db.prepare('SELECT count(*) AS n FROM plans').get().n<32,'PACKAGE_LIMIT');
  need(kind==='fixture_export'||kind==='fixture_import','GATE_UNVERIFIED');need(target==='fixture-local','ENVIRONMENT_MISMATCH');
  const report=inspectPackage(bytes),id=randomUUID();
  const plan={schemaVersion:LOCAL,planId:id,revision:1,kind,target,rootBinding:this.binding,policyVersion:POLICY,adapterVersion:'synthetic-v1/1.0.0',packageDigest:sha(bytes),historyDigest:report.historyDigest,preview:report,expiresAt:now+1800000,expectedEffects:[kind==='fixture_export'?'write_fixture_zip':'write_fixture_session'],nativeExecutable:false};
  plan.planDigest=digest(plan);validate(planSchema,plan);publish(path.join(this.dir,'plans'),id+'.zip',bytes);
  this.db.prepare('INSERT INTO plans VALUES (?,?,?)').run(id,plan.planDigest,canonical(plan));return plan;
 }
 plan(id){this.assertRoot();need(/^[0-9a-f-]{36}$/.test(id),'INVALID_ARGUMENT');const row=this.db.prepare('SELECT body,digest FROM plans WHERE id=?').get(id);need(row,'PLAN_STALE');const p=parse(row.body);validate(planSchema,p);const {planDigest,...body}=p;need(planDigest===row.digest&&digest(body)===planDigest&&p.schemaVersion===LOCAL&&p.rootBinding===this.binding&&p.policyVersion===POLICY,'PLAN_STALE');return p;}
 // Trusted local caller only. Not exposed over MCP; CLI requires a real TTY and exact digest.
 approve(id,expectedDigest,now=Date.now()){
  const p=this.plan(id);need(p.planDigest===expectedDigest&&p.expiresAt>now,'PLAN_STALE');
  const receipt={schemaVersion:LOCAL,approvalId:randomUUID(),planDigest:p.planDigest,planId:id,revision:p.revision,action:p.kind,target:p.target,rootBinding:p.rootBinding,approvedAt:now,expiresAt:Math.min(p.expiresAt,now+1800000)};
  receipt.authTag=createHmac('sha256',this.secret).update(canonical(receipt)).digest('hex');
  this.db.prepare('INSERT INTO approvals VALUES (?,?,?,NULL)').run(receipt.approvalId,p.planDigest,canonical(receipt));return receipt;
 }
 verify(receipt,p,now){
  need(receipt&&typeof receipt==='object'&&typeof receipt.authTag==='string','APPROVAL_INVALID');
  try{validate(receiptSchema,receipt);}catch{throw new PortError('APPROVAL_INVALID');}const row=this.db.prepare('SELECT body,used_by FROM approvals WHERE id=?').get(receipt.approvalId);need(row&&row.body===canonical(receipt),'APPROVAL_INVALID');
  const {authTag,...body}=receipt;const expected=createHmac('sha256',this.secret).update(canonical(body)).digest();const provided=Buffer.from(authTag,'hex');
  need(provided.length===32&&timingSafeEqual(provided,expected)&&body.planDigest===p.planDigest&&body.action===p.kind&&body.target===p.target&&body.rootBinding===p.rootBinding&&body.revision===p.revision&&body.expiresAt>now&&p.expiresAt>now,'APPROVAL_INVALID');return row;
 }
 update(op){validate(operationSchema,op);this.db.prepare('UPDATE operations SET body=? WHERE id=?').run(canonical(op),op.operationId);return op;}
 get(id){const r=this.db.prepare('SELECT body FROM operations WHERE id=?').get(id);need(r,'OPERATION_NOT_FOUND');return validate(operationSchema,parse(r.body));}
 apply(id,receipt,key,{now=Date.now(),fault=null}={}){
  need(/^[A-Za-z0-9_-]{16,128}$/.test(key),'INVALID_ARGUMENT');const p=this.plan(id);
  let fresh=false;let op=this.tx(()=>{const prior=this.db.prepare('SELECT body,plan_digest FROM operations WHERE key=?').get(key);
   if(prior){need(prior.plan_digest===p.planDigest,'IDEMPOTENCY_CONFLICT');return validate(operationSchema,parse(prior.body));}
   const approval=this.verify(receipt,p,now);need(!approval.used_by,'APPROVAL_INVALID');
   const bytes=readBounded(this.root,`.threadport/plans/${id}.zip`,8*1024*1024,true);need(sha(bytes)===p.packageDigest,'PLAN_STALE');inspectPackage(bytes);
   fresh=true;const o={schemaVersion:LOCAL,operationId:randomUUID(),planId:id,planDigest:p.planDigest,kind:p.kind,state:'creating',packageDigest:p.packageDigest,historyDigest:p.historyDigest,nativeThreadRef:null,evidenceClass:'synthetic_only',generation:1,createdFile:null,error:null};
   this.db.prepare('INSERT INTO operations VALUES (?,?,?,?)').run(o.operationId,key,p.planDigest,canonical(o));this.db.prepare('UPDATE approvals SET used_by=? WHERE id=?').run(o.operationId,receipt.approvalId);return o;});
  if(op.state!=='creating')return op;
  if(!fresh)return this.reconcile(op.operationId);
  // A durable intent may already have been sent. Never blindly repeat after restart.
  const dest=this.destination(op);if(fs.existsSync(dest)||fault==='before_write')return this.reconcile(op.operationId);
  if(fault==='after_intent')throw new PortError('SIMULATED_CRASH');
  const bytes=readBounded(this.root,`.threadport/plans/${id}.zip`,8*1024*1024,true);need(sha(bytes)===p.packageDigest,'PLAN_STALE');
  const output=op.kind==='fixture_export'?bytes:Buffer.from(canonical({schemaVersion:'threadport.fixture-session/1.0.0',operationId:op.operationId,packageDigest:p.packageDigest,historyDigest:p.historyDigest,nativeThreadRef:null,executionStarted:false}));
  publish(path.dirname(dest),path.basename(dest),output);
  if(fault==='after_write')throw new PortError('SIMULATED_CRASH');return this.reconcile(op.operationId);
 }
 destination(op){return path.join(this.dir,op.kind==='fixture_export'?'outputs':'sessions',op.operationId+(op.kind==='fixture_export'?'.zip':'.json'));}
 reconcile(id){
  return this.tx(()=>{const op=this.get(id),plan=this.plan(op.planId);
   // Recovery verifies the original target and plan, but does not demand a new execution approval.
   need(op.planDigest===plan.planDigest&&op.kind===plan.kind&&op.packageDigest===plan.packageDigest&&op.historyDigest===plan.historyDigest,'PLAN_STALE');
   if(op.state==='completed')return op;const dest=this.destination(op);
   try{const bytes=readBounded(this.root,path.relative(this.root,dest),8*1024*1024,true);
    if(op.kind==='fixture_export'){need(sha(bytes)===op.packageDigest,'DIGEST_MISMATCH');inspectPackage(bytes);}else{const expected={schemaVersion:'threadport.fixture-session/1.0.0',operationId:op.operationId,packageDigest:op.packageDigest,historyDigest:op.historyDigest,nativeThreadRef:null,executionStarted:false};need(canonical(parse(bytes))===canonical(expected),'DIGEST_MISMATCH');}
    op.state='completed';op.createdFile=path.relative(this.root,dest);op.error=null;
   }catch{op.state='attention';op.error='IMPORT_RECONCILIATION_REQUIRED';}
   op.generation++;return this.update(op);
  });
 }
}
