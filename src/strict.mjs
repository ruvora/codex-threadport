import { createHash } from 'node:crypto';
export class PortError extends Error { constructor(code, message=code) { super(message); this.code=code; } }
export function need(value,code='UNSUPPORTED_HISTORY') { if(!value) throw new PortError(code); }
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const canonical = value => {
 if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
 if(value && typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
};
export const digest = value => sha(canonical(value));
// Small bounded JSON parser: duplicate keys must be rejected before JSON.parse can erase them.
export function parse(bytes, max=4*1024*1024) {
 need(Buffer.byteLength(bytes)<=max,'PACKAGE_LIMIT');
 let s;try{s=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Buffer.from(bytes));}catch{throw new PortError('INVALID_JSON');}
 let i=0,nodes=0;
 const ws=()=>{while(/[\t\r\n ]/.test(s[i]??'X'))i++;};
 function string(){const start=i++;while(i<s.length){const c=s[i++];if(c==='"'){let v;try{v=JSON.parse(s.slice(start,i));}catch{throw new PortError('INVALID_JSON');}need(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(v),'INVALID_JSON');return v;}if(c==='\\')i++;}throw new PortError('INVALID_JSON');}
 function value(depth){need(depth<=32&&++nodes<=200000,'PACKAGE_LIMIT');ws();const c=s[i];
  if(c==='"')return string();
  if(c==='{'||c==='['){i++;const obj=c==='{'?Object.create(null):[];const end=c==='{'?'}':']';ws();if(s[i]===end){i++;return obj;}while(true){if(c==='{'){ws();need(s[i]==='"','INVALID_JSON');const k=string();need(!Object.hasOwn(obj,k),'DUPLICATE_KEY');ws();need(s[i++]===':','INVALID_JSON');obj[k]=value(depth+1);}else obj.push(value(depth+1));ws();if(s[i]===end){i++;return obj;}need(s[i++]===',','INVALID_JSON');}}
  for(const [word,v]of [['true',true],['false',false],['null',null]])if(s.startsWith(word,i)){i+=word.length;return v;}
  const m=s.slice(i).match(/^-?(?:0|[1-9][0-9]*)/);need(m,'INVALID_JSON');i+=m[0].length;const v=Number(m[0]);need(Number.isSafeInteger(v)&&!Object.is(v,-0),'INVALID_JSON');return v;
 }
 const result=value(0);ws();need(i===s.length,'INVALID_JSON');return result;
}
export const str=(max=4096,pattern)=>({type:'string',maxLength:max,...(pattern?{pattern}: {})});
export const literal=v=>({const:v});
export const enumOf=(...v)=>({enum:v});
export const arr=(items,maxItems=100000)=>({type:'array',items,maxItems});
export const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const uint={type:'integer',minimum:0,maximum:Number.MAX_SAFE_INTEGER};
export const alias=str(64,'^[a-z][a-z0-9_-]{0,63}$');
export const hash=str(64,'^[0-9a-f]{64}$');
export const nullable=s=>({anyOf:[s,literal(null)]});
export function validate(s,v,depth=0){
 need(depth<=32,'PACKAGE_LIMIT');
 if(s.anyOf){need(s.anyOf.some(x=>{try{validate(x,v,depth+1);return true;}catch{return false;}}));return v;}
 if(Object.hasOwn(s,'const'))need(v===s.const);
 if(s.enum)need(s.enum.includes(v));
 if(s.type==='object'){need(v!==null&&typeof v==='object'&&!Array.isArray(v));need(Object.keys(v).length===s.required.length&&s.required.every(k=>Object.hasOwn(v,k)));for(const k of s.required)validate(s.properties[k],v[k],depth+1);}
 if(s.type==='array'){need(Array.isArray(v));need(v.length<=s.maxItems,'PACKAGE_LIMIT');for(const x of v)validate(s.items,x,depth+1);}
 if(s.type==='string'){need(typeof v==='string');need(Buffer.byteLength(v)<=s.maxLength,'PACKAGE_LIMIT');if(s.pattern)need(new RegExp(s.pattern).test(v));}
 if(s.type==='integer')need(Number.isSafeInteger(v)&&v>=s.minimum&&v<=s.maximum);
 if(s.type==='boolean')need(typeof v==='boolean');
 return v;
}
export const equal=(a,b)=>canonical(a)===canonical(b);
