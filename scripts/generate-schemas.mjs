import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {schemas} from '../src/package.mjs';
import {sourceSchema} from '../src/history.mjs';
import {planSchema,receiptSchema,operationSchema} from '../src/journal.mjs';
import {tools} from '../src/service.mjs';
const dir=fileURLToPath(new URL('../schemas/',import.meta.url));fs.mkdirSync(dir,{recursive:true});
for(const [name,schema] of Object.entries({...schemas,source:sourceSchema,fixture_plan:planSchema,fixture_approval:receiptSchema,fixture_operation:operationSchema,...Object.fromEntries(tools.map(t=>[t.name,t.inputSchema]))})){
 fs.writeFileSync(dir+name+'.schema.json',JSON.stringify({$schema:'https://json-schema.org/draft/2020-12/schema',$id:`urn:ruvora:threadport:0.1.0:${name}`,title:name,...schema},null,2)+'\n');
}
console.log('Generated closed schemas from runtime validators. Native capability remains unavailable.');
