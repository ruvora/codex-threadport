import { inflateRawSync } from 'node:zlib';
import { need,PortError } from './strict.mjs';
export const LIMITS=Object.freeze({compressed:8*1024*1024,expanded:16*1024*1024,entry:8*1024*1024,entries:6,ratio:100});
export function safeName(name){need(typeof name==='string'&&name.length<=128&&/^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(name)&&!name.startsWith('/')&&!name.split('/').some(x=>!x||x==='.'||x==='..'),'UNSAFE_PATH');return name;}
export function crc32(b){let crc=0xffffffff;for(const x of b){crc^=x;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
// No extraction. Reject unknown ZIP features and header ambiguity before decompression.
export function readZip(b){
 need(Buffer.isBuffer(b)&&b.length>=22&&b.length<=LIMITS.compressed,'PACKAGE_LIMIT');
 const end=b.length-22;need(b.readUInt32LE(end)===0x06054b50,'INVALID_ZIP');
 need(b.readUInt16LE(end+4)===0&&b.readUInt16LE(end+6)===0&&b.readUInt16LE(end+20)===0,'INVALID_ZIP');
 const count=b.readUInt16LE(end+10),size=b.readUInt32LE(end+12),offset=b.readUInt32LE(end+16);
 need(count===b.readUInt16LE(end+8)&&count>0&&count<=LIMITS.entries,'PACKAGE_LIMIT');need(offset+size===end,'INVALID_ZIP');
 const result=new Map(),names=new Set();let p=offset,local=0,total=0,compressed=0;
 function range(start,len){need(start>=0&&start+len<=b.length,'INVALID_ZIP');}
 for(let i=0;i<count;i++){
  range(p,46);need(b.readUInt32LE(p)===0x02014b50,'INVALID_ZIP');
  const flags=b.readUInt16LE(p+8),method=b.readUInt16LE(p+10),crc=b.readUInt32LE(p+16),cs=b.readUInt32LE(p+20),us=b.readUInt32LE(p+24),nl=b.readUInt16LE(p+28),extra=b.readUInt16LE(p+30),comment=b.readUInt16LE(p+32),attrs=b.readUInt32LE(p+38),loc=b.readUInt32LE(p+42);
  need(b.readUInt16LE(p+4)===0x314&&b.readUInt16LE(p+6)===20&&b.readUInt16LE(p+12)===0&&b.readUInt16LE(p+14)===33&&b.readUInt16LE(p+36)===0&&flags===0&&(method===0||method===8)&&extra===0&&comment===0&&b.readUInt16LE(p+34)===0,'INVALID_ZIP');
  need(attrs===((0o100600<<16)>>>0),'UNSAFE_PATH');range(p+46,nl);
  const rawName=b.subarray(p+46,p+46+nl);need(rawName.every(v=>v<128),'UNSAFE_PATH');const name=safeName(rawName.toString());
  need(!names.has(name.toLowerCase()),'DUPLICATE_ENTRY');names.add(name.toLowerCase());
  need(us<=LIMITS.entry&&cs<=LIMITS.compressed&&(cs?us/cs<=LIMITS.ratio:us===0),'PACKAGE_LIMIT');
  total+=us;compressed+=cs;need(total<=LIMITS.expanded,'PACKAGE_LIMIT');need(loc===local,'INVALID_ZIP');range(loc,30);
  need(b.readUInt32LE(loc)===0x04034b50&&b.readUInt16LE(loc+4)===b.readUInt16LE(p+6)&&b.readUInt16LE(loc+6)===flags&&b.readUInt16LE(loc+8)===method,'INVALID_ZIP');
  need(b.readUInt32LE(loc+10)===b.readUInt32LE(p+12)&&b.readUInt32LE(loc+14)===crc&&b.readUInt32LE(loc+18)===cs&&b.readUInt32LE(loc+22)===us&&b.readUInt16LE(loc+26)===nl&&b.readUInt16LE(loc+28)===0,'INVALID_ZIP');
  range(loc+30,nl+cs);need(b.subarray(loc+30,loc+30+nl).equals(rawName),'INVALID_ZIP');
  local=loc+30+nl+cs;need(local<=offset,'INVALID_ZIP');const data=b.subarray(loc+30+nl,local);let output;
  if(method===0){need(cs===us,'INVALID_ZIP');output=Buffer.from(data);}else{try{const out=inflateRawSync(data,{maxOutputLength:Math.max(1,us),info:true});need(out.engine.bytesWritten===cs,'INVALID_ZIP');output=out.buffer;}catch(e){if(e instanceof PortError)throw e;throw new PortError('INVALID_ZIP');}}
  need(output.length===us&&crc32(output)===crc,'DIGEST_MISMATCH');result.set(name,output);p+=46+nl;
 }
 need(p===end&&local===offset&&(compressed?total/compressed<=LIMITS.ratio:total===0),'INVALID_ZIP');return result;
}
// Deterministic STORE encoder used by synthetic fixture materialization only.
export function writeZip(files){
 let offset=0;const locals=[],centrals=[];
 for(const [name,value] of [...files].sort(([a],[b])=>a.localeCompare(b))){safeName(name);const bytes=Buffer.from(value),n=Buffer.from(name),crc=crc32(bytes);const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt16LE(33,12);l.writeUInt32LE(crc,14);l.writeUInt32LE(bytes.length,18);l.writeUInt32LE(bytes.length,22);l.writeUInt16LE(n.length,26);locals.push(l,n,bytes);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(0x314,4);c.writeUInt16LE(20,6);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(bytes.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE((0o100600<<16)>>>0,38);c.writeUInt32LE(offset,42);centrals.push(c,n);offset+=l.length+n.length+bytes.length;
 }
 const center=Buffer.concat(centrals),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50);e.writeUInt16LE(files.size,8);e.writeUInt16LE(files.size,10);e.writeUInt32LE(center.length,12);e.writeUInt32LE(offset,16);return Buffer.concat([...locals,center,e]);
}
