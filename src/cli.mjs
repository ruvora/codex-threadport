#!/usr/bin/env node
import {Service,gates} from './service.mjs';
import {serve} from './mcp.mjs';
import {Journal} from './journal.mjs';
import {buildFixturePackage} from './package.mjs';
import {readBounded,rootPath} from './fs.mjs';
import {need,parse} from './strict.mjs';
import {createInterface} from 'node:readline/promises';
const args=process.argv.slice(2);let root=process.cwd();const ri=args.indexOf('--root');if(ri!==-1){root=args[ri+1];args.splice(ri,2);}
const [command,...rest]=args;
const help=`RUVORA ThreadPort 0.1.0 (native G0/G3 NOT VERIFIED)
Usage: node src/cli.mjs [--root INPUT_DIRECTORY] COMMAND
  capabilities
  inspect-source SOURCE.json BOUNDARY_ID
  preview-source SOURCE.json BOUNDARY_ID
  inspect-package PACKAGE.zip
  preview-import PACKAGE.zip
  operation OPERATION_ID
  export PLAN_ID | import PLAN_ID    (always blocked)
  mcp                               (newline JSON-RPC on stdio)
  fixture-plan SOURCE.json BOUNDARY_ID fixture_export|fixture_import
  fixture-approve PLAN_ID            (local TTY and exact plan digest required)
  fixture-apply PLAN_ID APPROVAL_ID IDEMPOTENCY_KEY
  fixture-reconcile OPERATION_ID
Paths are relative to root. No hidden inputs, symlinks, network, live Codex stores or models.
Fixture commands write only .threadport under root. Approvals cannot be issued through MCP.`;
try{
 if(!command||command==='help'||command==='--help'){console.log(help);}
 else if(command==='mcp'){need(rest.length===0,'INVALID_ARGUMENT');await serve(root);}
 else if(command.startsWith('fixture-')){
  const counts={'fixture-plan':3,'fixture-approve':1,'fixture-apply':3,'fixture-reconcile':1};need(counts[command]===rest.length,'INVALID_ARGUMENT');
  const j=new Journal(root);try{let result;
   if(command==='fixture-plan')result=j.prepare(rest[2],buildFixturePackage(readBounded(rootPath(root),rest[0]),rest[1]));
   if(command==='fixture-approve'){
    need(process.stdin.isTTY&&process.stdout.isTTY,'LOCAL_APPROVAL_REQUIRED');const plan=j.plan(rest[0]);console.log(JSON.stringify(plan,null,2));const rl=createInterface({input:process.stdin,output:process.stdout});let response;try{response=await rl.question('Approve only these synthetic effects by typing the full planDigest: ');}finally{rl.close();}need(response===plan.planDigest,'APPROVAL_INVALID');result=j.approve(plan.planId,response);
   }
   if(command==='fixture-apply'){const row=j.db.prepare('SELECT body FROM approvals WHERE id=?').get(rest[1]);need(row,'APPROVAL_INVALID');result=j.apply(rest[0],parse(row.body),rest[2]);}
   if(command==='fixture-reconcile')result=j.reconcile(rest[0]);console.log(JSON.stringify(result,null,2));
  }finally{j.close();}
 }else{
  const service=new Service(root);let name,input;
  const table={capabilities:['port_get_capabilities',[]],'inspect-source':['port_inspect_export',['sourcePath','boundaryTurnId']],'preview-source':['port_prepare_export',['sourcePath','boundaryTurnId']],'inspect-package':['port_inspect_package',['localPath']],'preview-import':['port_prepare_import',['localPath']],operation:['port_get_operation',['operationId']],export:['port_create_export',['planId']],import:['port_apply_import',['planId']]};
  need(table[command]&&rest.length===table[command][1].length,'INVALID_ARGUMENT');[name]=table[command];input=Object.fromEntries(table[command][1].map((k,i)=>[k,rest[i]]));console.log(JSON.stringify(service.call(name,input),null,2));
 }
}catch(e){console.error(JSON.stringify({ok:false,error:e.code??'IO_FAILURE',nativeExecutable:false}));process.exitCode=e.code==='GATE_UNVERIFIED'?3:1;}
