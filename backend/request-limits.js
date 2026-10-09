'use strict';
function createRequestLimits({env={},now=Date.now}={}){
 function integer(key,fallback,max){const raw=env[key];if(raw==null||raw==='')return fallback;const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>max)throw Error('Invalid '+key);return n;}
 const minute=integer('LOADNOTE_AI_REQUESTS_PER_MINUTE',6,1000),daily=integer('LOADNOTE_AI_REQUESTS_PER_DAY',100,100000),concurrency=integer('LOADNOTE_AI_MAX_CONCURRENT',4,100),globalDaily=integer('LOADNOTE_AI_GLOBAL_REQUESTS_PER_DAY',1000,1000000);
 const buckets=new Map();let active=0,day=-1,total=0;
 function acquire(key){
  const time=now(),minuteId=Math.floor(time/60000),dayId=Math.floor(time/86400000);
  if(day!==dayId){day=dayId;total=0;}
  for(const [id,b]of buckets)if(b.day!==dayId)buckets.delete(id);
  let b=buckets.get(key);if(!b){if(buckets.size>=10000)return {ok:false,retryAfter:60};b={day:dayId,minute:minuteId,count:0,total:0};}
  if(b.minute!==minuteId){b.minute=minuteId;b.count=0;}
  if(b.total>=daily||total>=globalDaily)return {ok:false,retryAfter:Math.ceil(((dayId+1)*86400000-time)/1000)};
  if(active>=concurrency||b.count>=minute)return {ok:false,retryAfter:Math.max(1,Math.ceil(((minuteId+1)*60000-time)/1000))};
  b.count++;b.total++;total++;buckets.set(key,b);active++;let released=false;
  return {ok:true,release(){if(!released){released=true;active--;}}};
 }
 return {acquire};
}
module.exports={createRequestLimits};
