import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {Journal} from '../src/journal.mjs';
import {buildFixturePackage} from '../src/package.mjs';
import {canonical} from '../src/strict.mjs';
const code=c=>e=>e.code===c;
function setup(t){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'threadport-continuation-'));
 t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'work');fs.mkdirSync(root,{mode:0o700});return {base,root};
}
function prepared(root){
 const j=new Journal(root),p=j.prepare('fixture_export',buildFixturePackage(fs.readFileSync(new URL('../fixtures/conversation.json',import.meta.url)),'first'));
 return {j,p,a:j.approve(p.planId,p.planDigest)};
}
function replaceRoot(base,root){
 fs.renameSync(root,path.join(base,'old'));fs.mkdirSync(root,{mode:0o700});
 fs.cpSync(path.join(base,'old','.threadport'),path.join(root,'.threadport'),{recursive:true});
 for(const dir of ['','/plans','/outputs','/sessions','/reports'])fs.chmodSync(path.join(root,'.threadport'+dir),0o700);
}
test('continuation: FIFO inspection rejects without waiting for a writer',t=>{
 const {root}=setup(t),fifo=path.join(root,'input.json');
 const made=spawnSync('mkfifo',[fifo],{encoding:'utf8'});assert.equal(made.status,0,made.stderr);
 const script=`import {readBounded} from ${JSON.stringify(new URL('../src/fs.mjs',import.meta.url).href)};try{readBounded(process.argv[1],'input.json');process.exit(2);}catch(e){console.log(e.code);process.exit(e.code==='UNSAFE_PATH'?0:1);}`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script,root],{encoding:'utf8',timeout:1500});
 assert.equal(child.error,undefined,'reader must not block on FIFO open');assert.equal(child.status,0,child.stderr);assert.equal(child.stdout.trim(),'UNSAFE_PATH');
});
test('continuation: an open journal rechecks target identity before approval',t=>{
 const {base,root}=setup(t),{j,p}=prepared(root);
 try{replaceRoot(base,root);assert.throws(()=>j.approve(p.planId,p.planDigest),code('PLAN_STALE'));}finally{j.close();}
});
test('continuation: reconciliation rejects copied state under a replaced target',t=>{
 const {base,root}=setup(t),{j,p,a}=prepared(root);
 try{assert.throws(()=>j.apply(p.planId,a,'continuation_key_1234',{fault:'after_write'}),code('SIMULATED_CRASH'));}finally{j.close();}
 replaceRoot(base,root);const reopened=new Journal(root);
 try{const id=reopened.db.prepare('SELECT id FROM operations').get().id;assert.throws(()=>reopened.reconcile(id),code('PLAN_STALE'));assert.equal(reopened.get(id).state,'creating');}finally{reopened.close();}
});
test('continuation: reconciliation validates operation against its immutable plan',t=>{
 const {root}=setup(t),{j,p,a}=prepared(root);
 try{assert.throws(()=>j.apply(p.planId,a,'continuation_key_1234',{fault:'after_write'}),code('SIMULATED_CRASH'));
  const op=JSON.parse(j.db.prepare('SELECT body FROM operations').get().body);op.planDigest='0'.repeat(64);
  j.db.prepare('UPDATE operations SET body=? WHERE id=?').run(canonical(op),op.operationId);
  assert.throws(()=>j.reconcile(op.operationId),code('PLAN_STALE'));assert.equal(j.get(op.operationId).state,'creating');
 }finally{j.close();}
});
