const palettes = {
  morelos: ["Morelos","Mexico","#d51761","#e1649e","#f9dbdb"],
  chiapas: ["Chiapas","Mexico","#1b8e96","#d59625","#e1ede5"],
  zacatecas: ["Zacatecas","Mexico","#7b50a2","#b2673d","#f2e4db"],
  sonora: ["Sonora","Mexico","#8c4a2f","#dcba89","#efe2d4"],
  south_amazon: ["Southern Amazon","Brazil","#619f4d","#b9a4d7","#e9eed8"],
  sahel: ["Sahel","West Africa","#a97508","#cd8f2c","#f3e8cf"]
};
const fields = {
  rain:["Monthly rainfall","mm","wetter","drier","Annual rainfall","mm"],
  temp:["Monthly air temperature","°C","warmer","cooler","Annual mean temperature","°C"],
  soil:["Moisture in the top 10 cm of soil","kg/m²","wetter","drier","Annual mean soil moisture","kg/m²"]
};
const el = id => document.getElementById(id);
const fmt = n => n.toLocaleString("en-US",{maximumFractionDigits:1});
const months = Array.from({length:12},(_,i)=>new Date(2000,i,1).toLocaleString("en-US",{month:"long"}));
const query = new URLSearchParams(location.search);
let region = Object.hasOwn(palettes,query.get("region")) ? query.get("region") : "morelos";
let key = Object.hasOwn(fields,query.get("variable")) ? query.get("variable") : "rain";
let timer = null;
const slider = el("time");
for (const [id,[name]] of Object.entries(palettes)) el("region").add(new Option(name,id));
el("region").value = region;
document.querySelector('input[value="'+key+'"]').checked = true;

function drawChart(values, index, name, unit) {
  const start = index-index%12;
  const year = 2000+start/12;
  const valid = values.filter(Number.isFinite);
  const bottom = key==="temp" ? Math.floor(Math.min(...valid)) : 0;
  const top = Math.max(bottom+1,Math.ceil(Math.max(...valid)));
  const width = Math.max(250, Math.round(el("chart").getBoundingClientRect().width));
  const height = width < 600 ? 238 : 310;
  const left = 44, right = width-18, floor = height-34;
  el("chart").setAttribute("viewBox", "0 0 "+width+" "+height);
  el("chart").style.setProperty("--chart-aspect", width+"/"+height);
  const horizontalScale = (floor-12)*420/(190*(right-left));
  if(key==="soil") el("effect").removeAttribute("transform");
  else el("effect").setAttribute("transform", "translate(208 0) scale("+horizontalScale+" 1) translate(-208 0)");
  for(const [attr,v] of Object.entries({x:left,y:12,width:right-left,height:floor-12})) el("scene").setAttribute(attr,v);
  const x = month => left+month*(right-left)/11;
  const y = value => floor-(value-bottom)/(top-bottom)*(floor-25);
  let svg = "";
  for (let j=0;j<4;j++) {
    const value=bottom+(top-bottom)*j/3;
    svg+='<path d="M'+left+' '+y(value)+'H'+right+'" stroke="#ded7be"/><text x="38" y="'+(y(value)+4)+'" text-anchor="end">'+fmt(value)+'</text>';
  }
  let line="", previous=false;
  values.slice(start,start+12).forEach((v,m)=>{
    if(Number.isFinite(v)) line+=(previous?"L":"M")+x(m)+" "+y(v);
    previous=Number.isFinite(v);
    if(width>580 || (width<420 ? m%3===0||m===11 : m%2===0||m===11)) svg+='<text x="'+x(m)+'" y="'+(height-9)+'" text-anchor="middle">'+months[m].slice(0,3)+'</text>';
  });
  svg+='<path d="'+line+'" fill="none" stroke="#fffbef" stroke-width="7" stroke-linejoin="round"/>';
  svg+='<path d="'+line+'" fill="none" stroke="var(--main)" stroke-width="3.5" stroke-linejoin="round"/>';
  const marker=x(index%12);
  svg+='<path d="M'+marker+' 18V'+floor+'" stroke="#4b5f5a" stroke-dasharray="3 4"/>';
  if(Number.isFinite(values[index])) svg+='<circle cx="'+marker+'" cy="'+y(values[index])+'" r="6" fill="var(--accent)" stroke="#1f3a36" stroke-width="2"/>';
  el("plot").innerHTML=svg;
  el("chart").setAttribute("aria-label",name+" in "+year+", "+unit+". Selected: "+slider.getAttribute("aria-valuetext"));
}
function illustrate(level, value) {
  let art="";
  if(Number.isFinite(value)) {
    if(key==="rain") {
      art='<path fill="#617876" d="M172 40q-10-14 6-20 7-15 21-10 12-13 25-1 18-1 21 13 12 2 12 13z"/>';
      for(let n=0;n<30;n++) art+='<path class="drop" d="M'+(178+n*29%72)+' '+(42+n*13%45)+'l-3 8" stroke="#2a5f8f" stroke-width="2"/>';
    } else if(key==="temp") {
      art='<circle cx="204" cy="44" r="'+(8+level*16)+'" fill="#edb451"/>';
      for(let n=0;n<6;n++) art+='<path class="heat" d="M'+(178+11*n)+' 88q-4-6 0-11t0-10" stroke="#956638" fill="none"/>';
    } else if(key==="soil") {
      art='<path d="M0 155q100-7 210 0t210 0v35H0z" fill="#835939"/>';
      art+='<path class="cracks" d="m36 157 9 7-6 6 14 7m-9-14 13-3m197-3 9 6-4 9 10 10m-5-19 13 2m70-7 6 7-4 11" fill="none" stroke="#493a2a" stroke-width="1.5"/>';
      for(let n=0;n<33;n++) art+='<ellipse class="water" cx="'+(15+n*71%395)+'" cy="'+(163+n*7%20)+'" rx="4" ry="2" fill="#aed5c6"/>';
    }
  }
  const layer=el("effect");
  if(layer.dataset.variable!==key || !layer.children.length || !Number.isFinite(value)) {
    layer.innerHTML=art;
    layer.dataset.variable=key;
  }
  const marks=layer.querySelectorAll(".drop,.heat,.water");
  const count=value===0 && key==="rain" ? 0 : Math.max(1,Math.round(level*marks.length));
  marks.forEach((mark,i)=>{mark.style.visibility=i<count?"visible":"hidden";});
  if(key==="temp" && Number.isFinite(value)) layer.querySelector("circle").setAttribute("r",8+level*16);
  if(key==="soil" && Number.isFinite(value)) layer.querySelector(".cracks").style.opacity=1-level;
  marks.forEach((mark,i)=>mark.style.animationDelay=(-i*.19)+"s");
  el("scene").style.setProperty("--speed",(1.5-level)+"s");
}
function render() {
  const index=Number(slider.value), month=index%12, year=2000+Math.floor(index/12);
  const record=observations[region][key], values=record.values, v=values[index];
  const [name,unit,above,below,annual,annualUnit]=fields[key];
  const [title,place,main,accent,soft]=palettes[region];
  for(const [token,val] of Object.entries({main,accent,soft})) document.body.style.setProperty("--"+token,val);
  document.title=title+" climate record · Atlalli";
  document.querySelector("h1").textContent=title;
  el("land").setAttribute("href",region+".svg");
  el("place").textContent=place;
  el("date").textContent=months[month]+" "+year;
  el("value").textContent=Number.isFinite(v)?fmt(v)+" "+unit:"Observation unavailable";
  slider.setAttribute("aria-valuetext",el("date").textContent+", "+el("value").textContent);
  const peers=values.filter((n,i)=>i%12===month && Number.isFinite(n));
  const mean=peers.reduce((sum,n)=>sum+n,0)/peers.length;
  const diff=v-mean;
  el("relative").textContent=!Number.isFinite(v)?"Missing observation":Math.abs(diff)<.05?"Near the monthly average":(diff>0?above:below).replace(/^./,c=>c.toUpperCase())+" than the "+months[month]+" average";
  el("comparison").textContent="Across the record, "+months[month]+" averaged "+fmt(mean)+" "+unit+" in "+title+".";
  el("headline").textContent=name+" · "+year;
  el("unit").textContent="Monthly observations in "+unit;
  const valid=values.filter(Number.isFinite);
  const min=Math.min(...valid), max=Math.max(...valid);
  illustrate((v-min)/(max-min||1),v);
  drawChart(values,index,name,unit);
  const t=record.trend, slope=Number(t.sen_slope_decade);
  const conclusion=t.classification==="unresolved"?"The statistical test could not resolve this trend.":t.classification==="significant"?"The trend meets the significance threshold after adjustment for multiple comparisons.":"The evidence is inconclusive after adjustment for multiple comparisons.";
  el("trend").textContent=annual+" shows an estimated "+(slope>=0?"increase":"decrease")+" of "+fmt(Math.abs(slope))+" "+annualUnit+" per decade. "+conclusion;
  el("method").textContent=(key==="rain"?"Monthly rainfall is estimated from the mean daily rate multiplied by the days in that month. ":"Monthly values are area averages. ")+"The long-term estimate uses Sen’s slope over "+t.n_years+" complete years. Test: "+t.method+". Adjusted q: "+(t.q_value?Number(t.q_value).toPrecision(2):"unavailable")+".";
  el("source").textContent=record.source+" · "+record.doi;
  el("source").href="https://doi.org/"+record.doi;
}
function stop() {
  clearInterval(timer); timer=null;
  document.body.classList.remove("playing");
  el("play").textContent="Play timeline";
}
el("play").onclick=()=>{
  if(timer!==null){stop();return;}
  if(slider.value===slider.max) slider.value=0;
  document.body.classList.add("playing");el("play").textContent="Pause";render();
  timer=setInterval(()=>{slider.stepUp();render();if(slider.value===slider.max)stop();},900);
};
slider.oninput=()=>{stop();render();};
const chart=el("chart");
function scrub(event) {
  const pt=new DOMPoint(event.clientX,event.clientY).matrixTransform(chart.getScreenCTM().inverse());
  const month=Math.max(0,Math.min(11,Math.round((pt.x-44)*11/(chart.viewBox.baseVal.width-62))));
  slider.value=Number(slider.value)-Number(slider.value)%12+month;
  stop();render();
}
chart.onpointerdown=event=>{
  if(event.button!==0 || !event.isPrimary)return;
  chart.setPointerCapture(event.pointerId);
  scrub(event);
};
chart.onpointermove=event=>{if(chart.hasPointerCapture(event.pointerId))scrub(event);};
new ResizeObserver(()=>drawChart(observations[region][key].values,Number(slider.value),fields[key][0],fields[key][1])).observe(chart.parentElement);
function changeSelection() {
  stop();region=el("region").value;key=document.querySelector("input:checked").value;
  history.replaceState(null,"","?region="+region+"&variable="+key);render();
}
el("region").onchange=changeSelection;
document.querySelector("fieldset").onchange=changeSelection;
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
render();
