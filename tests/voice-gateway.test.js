const assert=require('node:assert/strict');
const Voice=require('../backend/voice-gateway');

(()=>{
 const context=Voice.sanitizeContext({
  surface:'train',liveWorkout:{active:true,date:'2026-10-02',name:'Heavy day',position:'Exercise 1 of 3',currentExercise:{name:'Competition Squat',index:0,count:3,set:{index:1,count:4,reps:4,weightKg:183.7,displayWeight:405,displayUnit:'lb',rpe:8.5,target:'405 × 4 @ 8',previous:'395 × 4 @ 7.5'}},exercises:[{name:'Competition Squat',completedSets:1,totalSets:4}]},
  restTimer:{active:true,paused:false,remainingSeconds:121},capabilities:{programmingMutation:true}
 });
 assert.equal(context.surface,'train');
 assert.equal(context.liveWorkout.currentExercise.set.weightKg,183.7);
 assert.equal(context.liveWorkout.currentExercise.set.displayWeight,405);
 assert.equal(context.liveWorkout.currentExercise.set.displayUnit,'lb');
 assert.equal(context.capabilities.programmingMutation,false);
 assert.equal(context.capabilities.historyMutation,false);
 assert.equal(context.capabilities.restTimerActions,true);

 const tools=Voice.tools(),names=tools.map(tool=>tool.name);
 assert.deepEqual(names.sort(),['add_30_seconds_rest','ask_loadnote_coach','get_live_workout_context','get_rest_timer','pause_rest_timer','resume_rest_timer','start_rest_timer','stop_rest_timer'].sort());
 assert.equal(names.some(name=>/log|complete|program|prescription|history|adapt/i.test(name)&&name!=='ask_loadnote_coach'),false,'voice must not expose training-data mutation tools');
 const start=tools.find(tool=>tool.name==='start_rest_timer');
 assert.equal(start.parameters.properties.seconds.minimum,15);
 assert.equal(start.parameters.properties.seconds.maximum,900);

 const config=Voice.sessionConfig({context,model:'gpt-realtime-2.1',voice:'marin',transcriptionModel:'gpt-4o-mini-transcribe'});
 assert.equal(config.session.type,'realtime');
 assert.equal(config.session.model,'gpt-realtime-2.1');
 assert.deepEqual(config.session.output_modalities,['audio']);
 assert.equal(config.session.audio.output.voice,'marin');
 assert.equal(config.session.audio.input.transcription.model,'gpt-4o-mini-transcribe');
 assert.equal(config.session.audio.input.turn_detection.interrupt_response,true);
 assert.match(config.session.instructions,/cannot log\/complete\/edit sets/i);
 assert.match(config.session.instructions,/Decisions and the existing logger are authoritative/i);
 assert.doesNotMatch(config.session.instructions,/secret|api key/i);

 const a=Voice.safetyIdentifier('acct_123'),b=Voice.safetyIdentifier('acct_123'),c=Voice.safetyIdentifier('acct_456');
 assert.equal(a,b);assert.notEqual(a,c);assert.match(a,/^ln_[a-f0-9]{32}$/);
 assert.deepEqual(Voice.parseClientSecret({value:'ek_test',expires_at:12345}),{value:'ek_test',expiresAt:12345});
 assert.throws(()=>Voice.parseClientSecret({}),/client secret/i);
 console.log('v2.80 realtime voice session policy, safe tools, context and secret parsing passed');
})();
