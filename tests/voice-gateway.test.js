const assert=require('node:assert/strict');
const Voice=require('../backend/voice-gateway');

(()=>{
 const context=Voice.sanitizeContext({
  surface:'train',liveWorkout:{active:true,date:'2026-10-02',name:'Heavy day',position:'Exercise 1 of 3',currentExercise:{name:'Competition Squat',index:0,count:3,set:{index:1,count:4,reps:4,weightKg:183.7,displayWeight:405,displayUnit:'lb',rpe:8.5,target:'405 × 4 @ 8',previous:'395 × 4 @ 7.5'}},exercises:[{name:'Competition Squat',completedSets:1,totalSets:4}]},
  restTimer:{active:true,paused:false,remainingSeconds:121},capabilities:{programmingMutation:true,historyMutation:true,proactiveCueControls:false}
 });
 assert.equal(context.version,3);
 assert.equal(context.surface,'train');
 assert.equal(context.liveWorkout.currentExercise.set.weightKg,183.7);
 assert.equal(context.liveWorkout.currentExercise.set.displayWeight,405);
 assert.equal(context.liveWorkout.currentExercise.set.displayUnit,'lb');
 assert.equal(context.capabilities.workoutDraftMutation,true);
 assert.equal(context.capabilities.programmingMutation,false);
 assert.equal(context.capabilities.historyMutation,false);
 assert.equal(context.capabilities.workoutHistoryMutation,false);
 assert.equal(context.capabilities.undoVoiceEntry,true);
 assert.equal(context.capabilities.restTimerActions,true);
 assert.equal(context.capabilities.proactiveCueControls,true);

 const tools=Voice.tools(),names=tools.map(tool=>tool.name);
 for(const name of ['log_current_set','update_current_set','correct_last_voice_entry','undo_last_voice_entry','get_live_workout_context','get_rest_timer','start_rest_timer','pause_rest_timer','resume_rest_timer','add_30_seconds_rest','stop_rest_timer','get_proactive_coaching_state','set_proactive_coaching_mode','pause_proactive_coaching','resume_proactive_coaching','ask_loadnote_coach'])assert(names.includes(name),'missing '+name);
 assert.equal(names.some(name=>/delete|history|program|prescription|adapt|training_max/i.test(name)),false,'voice must not expose destructive/history/program mutation tools');
 const log=tools.find(tool=>tool.name==='log_current_set');
 assert.deepEqual(log.parameters.properties.weightUnit.enum,['kg','lb']);
 assert.equal(log.parameters.properties.reps.minimum,1);
 assert.equal(log.parameters.properties.rpe.multipleOf,0.5);
 const correction=tools.find(tool=>tool.name==='correct_last_voice_entry');
 assert.equal(correction.parameters.properties.completed.type,'boolean');
 const start=tools.find(tool=>tool.name==='start_rest_timer');
 assert.equal(start.parameters.properties.seconds.minimum,15);
 assert.equal(start.parameters.properties.seconds.maximum,900);
 const cueMode=tools.find(tool=>tool.name==='set_proactive_coaching_mode');
 assert.deepEqual(cueMode.parameters.properties.mode.enum,['quiet','normal','proactive']);

 const config=Voice.sessionConfig({context,model:'gpt-realtime-2.1',voice:'marin',transcriptionModel:'gpt-4o-mini-transcribe'});
 assert.equal(config.session.type,'realtime');
 assert.equal(config.session.model,'gpt-realtime-2.1');
 assert.deepEqual(config.session.output_modalities,['audio']);
 assert.equal(config.session.audio.output.voice,'marin');
 assert.equal(config.session.audio.input.transcription.model,'gpt-4o-mini-transcribe');
 assert.equal(config.session.audio.input.turn_detection.interrupt_response,true);
 assert.match(config.session.instructions,/active unsaved workout draft/i);
 assert.match(config.session.instructions,/never copy target RPE into actual RPE/i);
 assert.match(config.session.instructions,/Never infer a unit from the size of the number/i);
 assert.match(config.session.instructions,/never edit previously saved workout history/i);
 assert.match(config.session.instructions,/Decisions remains authoritative/i);
 assert.match(config.session.instructions,/stop coaching.*pause_proactive_coaching/i);
 assert.match(config.session.instructions,/deterministic Loadnote events/i);
 assert.doesNotMatch(config.session.instructions,/secret|api key/i);

 const a=Voice.safetyIdentifier('acct_123'),b=Voice.safetyIdentifier('acct_123'),c=Voice.safetyIdentifier('acct_456');
 assert.equal(a,b);assert.notEqual(a,c);assert.match(a,/^ln_[a-f0-9]{32}$/);
 assert.deepEqual(Voice.parseClientSecret({value:'synthetic_short_lived_token',expires_at:12345}),{value:'synthetic_short_lived_token',expiresAt:12345});
 assert.throws(()=>Voice.parseClientSecret({}),/client secret/i);
 console.log('v2.82 realtime voice policy adds bounded proactive cue controls without widening training-data authority');
})();
