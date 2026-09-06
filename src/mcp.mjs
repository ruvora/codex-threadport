import {parse,need} from './strict.mjs';
import {Service,tools} from './service.mjs';
export async function serve(root,input=process.stdin,output=process.stdout){
 const service=new Service(root);let initialized=false,pending=Buffer.alloc(0);
 const send=async value=>{if(!output.write(JSON.stringify(value)+'\n'))await new Promise(r=>output.once('drain',r));};
 async function handle(line){let request;
  try{request=parse(line,65536);need(request&&request.jsonrpc==='2.0'&&typeof request.method==='string','INVALID_REQUEST');need(request.id===undefined||typeof request.id==='string'||Number.isSafeInteger(request.id),'INVALID_REQUEST');}
  catch{await send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid bounded JSON-RPC request'}});return;}
  if(request.id===undefined)return;
  let result;
  try{
   if(request.method==='initialize'){
    const versions=['2024-11-05','2025-03-26','2025-06-18'];const v=request.params?.protocolVersion;need(versions.includes(v),'UNSUPPORTED_VERSION');initialized=true;result={protocolVersion:v,capabilities:{tools:{listChanged:false}},serverInfo:{name:'ruvora-threadport',version:'0.1.0'},instructions:'Only local inspection and blocked previews. G0 and G3 NOT VERIFIED.'};
   }else{need(initialized,'NOT_INITIALIZED');
    if(request.method==='ping')result={};
    else if(request.method==='tools/list')result={tools};
    else if(request.method==='tools/call'){
     try{const value=service.call(request.params?.name,request.params?.arguments??{});result={content:[{type:'text',text:JSON.stringify(value)}],isError:false};}
     catch(e){result={content:[{type:'text',text:JSON.stringify({error:e.code??'IO_FAILURE'})}],isError:true};}
    }else{await send({jsonrpc:'2.0',id:request.id,error:{code:-32601,message:'Method not found'}});return;}
   }
   await send({jsonrpc:'2.0',id:request.id,result});
  }catch(e){await send({jsonrpc:'2.0',id:request.id,error:{code:-32602,message:e.code??'Invalid request'}});}
 }
 for await(const chunk of input){pending=Buffer.concat([pending,chunk]);let end;
  while((end=pending.indexOf(10))!==-1){const line=pending.subarray(0,end);pending=pending.subarray(end+1);if(line.length>65536){await send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Request limit exceeded'}});return;}if(line.length)await handle(line);}
  if(pending.length>65536){await send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Request limit exceeded'}});return;}
 }
 if(pending.length)await send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Incomplete newline-delimited request'}});
}
