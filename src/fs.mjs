import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {need,PortError} from './strict.mjs';
export function rootPath(root){const r=path.resolve(root);need(fs.lstatSync(r).isDirectory()&&!fs.lstatSync(r).isSymbolicLink(),'UNSAFE_PATH');return fs.realpathSync(r);}
export function confined(root,relative,{internal=false}={}){
 need(typeof relative==='string'&&relative.length>0&&relative.length<=256&&!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.includes('\0'),'UNSAFE_PATH');
 const parts=relative.split('/');need(parts.every(x=>x&&x!=='.'&&x!=='..'&&(internal||!x.startsWith('.'))),'UNSAFE_PATH');
 let p=root;for(const [i,x]of parts.entries()){p=path.join(p,x);if(fs.existsSync(p)||fs.lstatSync(p,{throwIfNoEntry:false})){const s=fs.lstatSync(p);need(!s.isSymbolicLink()&&(i===parts.length-1||s.isDirectory()),'UNSAFE_PATH');}}
 return p;
}
export function readBounded(root,relative,max=8*1024*1024,internal=false){
 const p=confined(root,relative,{internal});
 // Reject special files before open; NONBLOCK also prevents a raced-in FIFO from hanging.
 const selected=fs.lstatSync(p);need(selected.isFile()&&selected.nlink===1,'UNSAFE_PATH');
 let fd;try{fd=fs.openSync(p,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);const before=fs.fstatSync(fd);need(before.dev===selected.dev&&before.ino===selected.ino,'PLAN_STALE');need(before.isFile()&&before.nlink===1,'UNSAFE_PATH');need(before.size<=max,'PACKAGE_LIMIT');const b=Buffer.alloc(before.size+1);let n=0;while(n<b.length){const count=fs.readSync(fd,b,n,b.length-n,null);if(!count)break;n+=count;}const after=fs.fstatSync(fd);need(n===before.size&&before.size===after.size&&before.mtimeMs===after.mtimeMs&&before.ino===after.ino,'PLAN_STALE');return b.subarray(0,n);}finally{if(fd!==undefined)fs.closeSync(fd);}
}
export function syncDir(dir){const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export function ensurePrivate(dir){if(!fs.existsSync(dir))fs.mkdirSync(dir,{mode:0o700});const s=fs.lstatSync(dir);need(s.isDirectory()&&!s.isSymbolicLink()&&(s.mode&0o077)===0,'UNSAFE_PATH');}
// Atomic no-replace publication: linking an fsynced temp file never replaces another file.
export function publish(dir,name,bytes){
 need(/^[a-zA-Z0-9_-]+\.(json|zip|bin)$/.test(name),'UNSAFE_PATH');ensurePrivate(dir);
 const temp=path.join(dir,`${randomUUID()}.bin`),target=path.join(dir,name);let fd;
 try{fd=fs.openSync(temp,'wx',0o600);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.linkSync(temp,target);fs.unlinkSync(temp);syncDir(dir);return target;}catch(e){if(e.code==='EEXIST')throw new PortError('IDEMPOTENCY_CONFLICT');throw e;}finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
