// Offline fixture harness. Deliberately returns NOT VERIFIED for native G0/G3.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildFixturePackage,inspectPackage} from '../src/package.mjs';
import {readZip} from '../src/zip.mjs';
import {sha} from '../src/strict.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'threadport-g0-'));
try{
 const source=fs.readFileSync(new URL('../fixtures/conversation.json',import.meta.url));fs.writeFileSync(path.join(root,'source.json'),source);
 const bytes=buildFixturePackage(source,'first');fs.writeFileSync(path.join(root,'package.zip'),bytes);fs.unlinkSync(path.join(root,'source.json'));
 const argv=[fileURLToPath(new URL('../src/cli.mjs',import.meta.url)),'--root',root,'inspect-package','package.zip'];
 const run=()=>spawnSync(process.execPath,argv,{encoding:'utf8',timeout:10000});
 const first=run(),restart=run();const files=readZip(bytes);const privateAbsent=!bytes.includes('PRIVATE_AFTER_BOUNDARY')&&[...files.values()].every(b=>!b.includes('PRIVATE_AFTER_BOUNDARY'));
 const checks={freshProcessInspection:first.status===0,restartedInspection:restart.status===0,sourceFileRemoved:!fs.existsSync(path.join(root,'source.json')),privateMarkerAbsent:privateAbsent,packageDigest:sha(bytes),historyDigest:inspectPackage(bytes).historyDigest};
 console.log(JSON.stringify({evidenceClass:'synthetic_only',checks,childCommands:[{argv:[process.execPath,...argv],exitCode:first.status,stdout:first.stdout,stderr:first.stderr},{argv:[process.execPath,...argv],exitCode:restart.status,stdout:restart.stdout,stderr:restart.stderr}],G0:'NOT VERIFIED',G3:'NOT VERIFIED',missing:['Native history adapter','Sender filesystem isolation attestation','Native restart/resume with preserved tool history','Actual distinct PCs/accounts and app discovery']},null,2));
 process.exitCode=Object.entries(checks).filter(([,v])=>typeof v==='boolean').every(([,v])=>v)?3:1;
}finally{fs.rmSync(root,{recursive:true,force:true});}
