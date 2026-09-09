/* A local-calendar week: saved sessions only, with recovery given equal space. */
function homeActivityWeek(workouts, restDays, now = new Date()) {
  const key = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const current = key(now), monday = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  monday.setDate(monday.getDate() - (monday.getDay()+6)%7);
  const days = Array.from({length:7}, (_,i) => {
    const date = new Date(monday); date.setDate(date.getDate()+i);
    const iso = key(date), future = iso > current;
    const count = future ? 0 : workouts.filter(w => w.date === iso).length;
    return {date:iso,day:date.toLocaleDateString(undefined,{weekday:'short'}),number:date.getDate(),count,
      rest:restDays.includes(iso),today:iso===current,future};
  });
  return {days,total:days.reduce((sum,d)=>sum+d.count,0)};
}
function renderHomeActivity() {
  const strip = document.getElementById('home-week-days');
  if (!strip) return;
  const week = homeActivityWeek(data.workouts || [], data.restDays || []);
  document.getElementById('home-week-summary').textContent = week.total
    ? `${week.total} session${week.total===1?'':'s'} logged this week. Every session adds up.`
    : 'A fresh week of possibilities. Training and recovery both belong here.';
  strip.replaceChildren();
  for (const day of week.days) {
    const button = document.createElement('button');button.type='button';
    button.className='home-week-day'+(day.count?' trained':day.rest?' recovery':'')+(day.today?' is-today':'');
    const status=day.count?`${day.count} session${day.count===1?'':'s'}`:day.rest?'Rest':day.future?'Upcoming':'No session';
    button.setAttribute('aria-label',`${day.date}: ${status}`);
    if(day.today)button.setAttribute('aria-current','date');
    for(const [cls,value] of [['week-label',day.day],['week-number',day.number],['week-mark',day.count?'✓':day.rest?'—':'·']]) {
      const span=document.createElement('span');span.className=cls;span.textContent=String(value);button.appendChild(span);
    }
    button.addEventListener('click',()=>{calCursor=new Date(day.date+'T12:00:00');showTab('calendar');selectCalDay(day.date);});
    strip.appendChild(button);
  }
}
if(typeof module==='object' && module.exports)module.exports={homeActivityWeek};
