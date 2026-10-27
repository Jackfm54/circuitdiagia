import { test } from "node:test";
import assert from "node:assert/strict";
import endpoint from "../api/[action]";
function output(){return {statusCode:0,body:'',setHeader(){},end(value?:string){this.body=value??'';},write(){return true;}};}
test('OpenAI endpoints reject non-POST requests',async()=>{const res=output();await endpoint({method:'GET',headers:{},query:{action:'analyze-circuit'},body:{}},res);assert.equal(res.statusCode,405);});
test('OpenAI endpoints reject unauthenticated callers',async()=>{const prior={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY,openai:process.env.OPENAI_API_KEY};try{process.env.SUPABASE_URL='https://unconfigured.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='public-test-value';process.env.OPENAI_API_KEY='not-a-real-key';const res=output();await endpoint({method:'POST',headers:{},query:{action:'analyze-circuit'},body:{}},res);assert.equal(res.statusCode,401);}finally{for(const [name,value] of Object.entries({SUPABASE_URL:prior.url,SUPABASE_PUBLISHABLE_KEY:prior.key,OPENAI_API_KEY:prior.openai})){if(value===undefined)delete process.env[name];else process.env[name]=value;}}});
