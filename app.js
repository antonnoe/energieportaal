/**
 * app.js — EnergiePortaal v2.1
 * [i] info panels + [ai] interactive helpers per field
 */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.from(document.querySelectorAll(s))};
var num=function(v,d){var n=parseFloat(String(v).replace(',','.'));return Number.isFinite(n)?n:(d||0)};
var eur=function(x){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x||0)};
var fmt0=function(x){return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(x||0)};
var fmt1=function(x){return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(x||0)};

/* ═══ FIELD INFO DATABASE [i] ═══ */
var INFO={
zone:{text:'<strong>Klimaatzone</strong> — Frankrijk kent 6 klimaatzones, van de warme Middellandse Zeekust tot koude berggebieden. De zone bepaalt het aantal <em>graaddagen</em>: hoe meer graaddagen, hoe meer u stookt. Kies bij twijfel de koudere optie.',source:'Météo France klimaatnormalen · Infofrankrijk.com/klussen/verwarming'},
setpoint:{text:'<strong>Binnentemperatuur</strong> — De temperatuur die u prettig vindt. In Frankrijk is 19°C de officiële ADEME-aanbeveling. Elke graad hoger kost circa 7% meer energie. De meeste Nederlanders kiezen 20–21°C.',source:'ADEME, Guide Chauffage 2024'},
awaySetpoint:{text:'<strong>Vorstbescherming</strong> — Minimaal 7°C om bevriezing van leidingen te voorkomen. Vakantiehuis dat maandenlang leegstaat: 10–12°C.'},
presentDays:{text:'<strong>Aanwezigheidsdagen</strong> — Hoeveel dagen per jaar u het huis bewoont en verwarmt.<br><br>🏠 Permanent: 330–350 dagen<br>🏡 Halftijds: 150–200 dagen<br>🌴 Vakantie: 30–120 dagen'},
volume:{text:'<strong>Verwarmd volume</strong> — Alle verwarmde ruimtes samen. Onverwarmde zolders, garages en kelders telt u niet mee.<br><br><strong>Berekening:</strong> vloeroppervlak × plafondhoogte per kamer, alles optellen.<br>Voorbeeld: woonkamer 35m²×2,7m + 2 slaapkamers 12m²×2,5m + keuken 15m²×2,5m = 192 m³.',source:'Infofrankrijk.com, "De isolatie van het Franse huis"'},
ventType:{text:'<strong>Type ventilatie</strong><br><br>🪟 <strong>Natuurlijk:</strong> Via ramen, kieren, roosters. Meeste oude Franse huizen.<br>🔄 <strong>Mechanisch (VMC):</strong> Ventilator zuigt lucht af. Standaard in nieuwere woningen.<br>♻️ <strong>Met warmteterugwinning (VMC double flux):</strong> Bespaart 15–25% op verwarmingskosten.',source:'Infofrankrijk.com (Aat de Kwaasteniet)'},
ach:{text:'<strong>Luchtwisseling per uur</strong> — Hoe vaak per uur alle lucht ververst wordt.<br><br>🏚️ Oud en tochtig: 1,0–2,0<br>🏠 Gemiddeld met kieren: 0,5–0,8<br>🏗️ Goed afgedicht: 0,3–0,5<br><br>Bij twijfel: kies 0,6.'},
hrvEta:{text:'<strong>Rendement warmteterugwinning</strong> — Staat op het typeplaatje van uw VMC double flux. Goede systemen: 80–90%.'},
wallA:{text:'<strong>Muuroppervlakte</strong> — Alle buitenmuren samen, <em>exclusief</em> ramen en deuren.<br><br>Voorbeeld: huis 10×8m, hoogte 2,7m → omtrek 36m × 2,7 = 97 m². Min 15 m² ramen = 82 m².'},
wallU:{text:'<strong>Isolatiewaarde muren (U-waarde)</strong> — Hoe lager, hoe beter.<br><br>🧱 Dikke stenen muur (>50cm), ongeïsoleerd: U ≈ 1,5–2,5<br>🧱 + 4–5cm isolatie: U ≈ 0,6–0,8<br>🧱 Goed geïsoleerd (10–15cm): U ≈ 0,25–0,40<br><br>R-waarde = 1/U-waarde. R=2,5 → U=0,40.',source:'Infofrankrijk.com, "De isolatie van het Franse huis" (Rob van der Meulen)'},
roofA:{text:'<strong>Dakoppervlakte</strong> — Onbewoonde zolder: oppervlakte plafond eronder. Bewoonde zolder: oppervlakte schuine dak zelf.'},
roofU:{text:'<strong>Isolatiewaarde dak</strong> — Het dak is vaak de grootste bron van warmteverlies (tot 30%).<br><br>🏚️ Ongeïsoleerd (pannen+latten): U ≈ 2,5–3,5<br>📦 Laag stro of 5–10cm: U ≈ 0,5–0,8<br>✅ 20cm minerale wol: U ≈ 0,20–0,25<br>⭐ 30cm+: U ≈ 0,12–0,15',source:'Infofrankrijk.com, "Zolders zijn niet meer wat ze waren"'},
floorA:{text:'<strong>Vloeroppervlakte</strong> — Alleen de vloer direct op de grond of boven kruipruimte/kelder.'},
floorU:{text:'<strong>Isolatiewaarde vloer</strong><br><br>🟤 Tomettes op zand/aarde: U ≈ 2,0–2,5<br>🔲 Beton op kruipruimte: U ≈ 1,0–1,5<br>📦 Licht geïsoleerd: U ≈ 0,5–0,8<br>✅ Goed geïsoleerd: U ≈ 0,25–0,35'},
winA:{text:'<strong>Glasoppervlakte</strong> — Alle ramen en glasdeuren samen. Breedte × hoogte per raam, optellen.'},
winU:{text:'<strong>Type beglazing</strong><br><br>🪟 Enkel glas: U ≈ 5,0–5,8 (zeer slecht!)<br>🪟 Oud dubbel (vóór 2000): U ≈ 2,5–3,0<br>🪟 Modern HR: U ≈ 1,2–1,6<br>🪟 Triple HR++: U ≈ 0,8–1,0<br><br>Tip: houd een aansteker bij het raam. Twee spiegelingen = dubbel glas.',source:'Infofrankrijk.com, "De isolatie van het Franse huis"'},
mainType:{text:'<strong>Hoofdverwarming</strong><br><br>🔥 <strong>Gasketel:</strong> Aardgas in steden, propaan platteland. Rendement 85–107%.<br>🛢️ <strong>Stookolie:</strong> Veel platteland. Rendement 80–95%.<br>🌡️ <strong>Warmtepomp:</strong> SCOP 2,5–4,0 (levert 3× zoveel warmte als stroom kost).<br>⚡ <strong>Elektrisch:</strong> Rendement 100% maar duurste brandstof.<br>🪵 <strong>Houtkachel:</strong> Goedkoopst maar verwarmt vaak maar één ruimte.',source:'Infofrankrijk.com, "De keuze van het verwarmingssysteem"'},
mainScop:{text:'<strong>Seizoensrendement (SCOP)</strong> — SCOP 3,2 = voor elke €1 stroom krijgt u €3,20 warmte.<br><br>🌡️ Lucht/lucht (airco): 2,5–3,5<br>🌡️ Lucht/water: 3,0–4,0<br>🌡️ Bodem/water: 3,5–5,0<br><br>Staat op het energielabel.',source:'Infofrankrijk.com'},
mainEta:{text:'<strong>Rendement ketel/kachel</strong><br><br>🔥 HR-condensatie: 0,95–1,07<br>🔥 Gewone ketel: 0,85–0,92<br>🪵 Moderne kachel: 0,50–0,70<br>🪵 Met vergassing: 0,70–0,80<br>🏠 Open haard: 0,10–0,15 (!)<br><br>Bij twijfel: 0,85 (ketel), 0,55 (kachel).',source:'Infofrankrijk.com'},
auxType:{text:'<strong>Bijverwarming</strong> — Veel huizen combineren systemen. Bijv. houtkachel in de woonkamer + elektrisch in slaapkamers, of een airco die in het tussenseizoen meedraait.'},
persons:{text:'<strong>Aantal personen</strong> — Beïnvloedt warmwater- en apparatenverbruik.'},
showersPerPerson:{text:'<strong>Douches per dag</strong> — Gemiddeld 0,7–1 per persoon. Een bad ≈ 2 douches (120 liter).'},
litersPer:{text:'<strong>Liters per douche</strong> — Standaard: 40–60 L. Regendouche: 80–100 L.'},
dhwType:{text:'<strong>Warmwatersysteem</strong><br><br>⚡ <strong>Elektrische boiler:</strong> Meest voorkomend in FR. Tip: stel in op heures creuses.<br>🔥 <strong>Gasgeiser/ketel:</strong> Vaak gekoppeld aan CV.<br>🌡️ <strong>WP-boiler:</strong> Zuinig (SCOP 2–3).<br>☀️ <strong>Zonneboiler:</strong> Gratis warmte, bijverwarming voor bewolkte dagen.'},
pvKwp:{text:'<strong>Zonnepanelen vermogen (kWp)</strong> — 1 kWp ≈ 2–3 panelen. Opbrengst: Zuid-FR ±1.400 kWh/j, Noord-FR ±1.100 kWh/j. Staat op uw contract. Geen panelen? Laat op 0.',source:'Infofrankrijk.com, "Handboek Zonnepanelen"'},
pvSelfUse:{text:'<strong>Eigenverbruik</strong> — Zonder batterij: 30–50%. Met batterij: 50–70%. Met thuiswerk: 50–60%.'},
evKmWeek:{text:'<strong>EV kilometers/week</strong> — 200 km/week ≈ 1.900 kWh/jaar aan thuisladen. Geen EV? Laat op 0.'},
seer:{text:'<strong>SEER (koelrendement)</strong> — SEER 4 = voor €1 stroom krijgt u €4 koeling. Staat op energielabel airco.'},
price_elec:{text:'<strong>Elektriciteitsprijs</strong> — Kijk op uw factuur bij "prix du kWh TTC".<br><br>Gemiddeld FR 2025/2026:<br>Heures pleines: €0,25–0,27/kWh<br>Heures creuses: €0,18–0,20/kWh'}
};

/* ═══ AI HELPER DEFINITIONS [ai] ═══ */
var AI={
volume:{title:'Volume-assistent',desc:'Vul de afmetingen per kamer in. Ik reken het voor u uit.',type:'volume'},
wallU:{title:'Muur-assistent',desc:'Beschrijf uw buitenmuren.',type:'select',opts:[
['2.0','Dikke stenen muur (>40cm), ongeïsoleerd'],['1.5','Parpaing (betonblokken), ongeïsoleerd'],
['0.8','Stenen muur + dunne isolatie (4-5cm)'],['0.5','Parpaing + 8-10cm isolatie'],
['0.35','Goed geïsoleerd (10-15cm)'],['0.25','Zeer goed (15cm+ met dampscherm)']]},
roofU:{title:'Dak-assistent',desc:'Beschrijf uw daksituatie.',type:'select',opts:[
['3.0','Ongeïsoleerd (pannen+latten, geen isolatie)'],['1.5','Laag stro of oud materiaal (<5cm)'],
['0.5','Deels geïsoleerd (10cm glaswol)'],['0.25','Goed geïsoleerd (20cm)'],['0.15','Zeer goed (30cm+ of sandwichpanelen)']]},
floorU:{title:'Vloer-assistent',desc:'Beschrijf uw vloer.',type:'select',opts:[
['2.2','Tomettes/tegels direct op zand/aarde'],['1.5','Beton op aarde, zonder isolatie'],
['1.2','Houten vloer boven kruipruimte'],['0.8','Vloer met dunne isolatie (3-5cm)'],['0.35','Goed geïsoleerd (8-12cm)']]},
winU:{title:'Raam-assistent',desc:'Welk type beglazing hebt u?',type:'select',opts:[
['5.5','Enkel glas (één laag, koud bij aanraking)'],['2.8','Oud dubbel glas (vóór 2000)'],
['1.6','Modern dubbel glas (HR)'],['1.1','Modern HR+ glas'],['0.9','Triple glas (HR++)']]},
mainScop:{title:'SCOP-assistent',desc:'Welk type warmtepomp?',type:'select',opts:[
['2.8','Lucht/lucht (split airco, ouder)'],['3.5','Lucht/lucht (inverter, modern)'],
['3.0','Lucht/water (standaard)'],['3.8','Lucht/water (inverter, premium)'],['4.2','Bodem/water (geothermisch)']]}
};

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded',function(){
  buildSelects();buildPresets();buildAppliances();buildPriceInputs();bindToggles();
  injectInfoButtons();injectAIHelpers();
});

/* ═══ INJECT [i] BUTTONS ═══ */
function injectInfoButtons(){
  Object.keys(INFO).forEach(function(fid){
    var inp=document.getElementById(fid); if(!inp)return;
    var field=inp.closest('.field'); if(!field)return;
    var lbl=field.querySelector('label'); if(!lbl)return;
    var hdr=document.createElement('div'); hdr.className='field-header';
    lbl.parentNode.insertBefore(hdr,lbl); hdr.appendChild(lbl);
    var btn=document.createElement('button'); btn.type='button'; btn.className='btn-info'; btn.textContent='i'; btn.title='Meer uitleg';
    hdr.appendChild(btn);
    var panel=document.createElement('div'); panel.className='info-panel';
    panel.innerHTML=INFO[fid].text+(INFO[fid].source?'<div class="info-source">Bron: '+INFO[fid].source+'</div>':'');
    var help=field.querySelector('.help');
    if(help)help.parentNode.insertBefore(panel,help.nextSibling); else field.appendChild(panel);
    btn.addEventListener('click',function(){
      var open=panel.classList.contains('open');
      $$('.info-panel.open').forEach(function(p){p.classList.remove('open')});
      $$('.btn-info.active').forEach(function(b){b.classList.remove('active')});
      if(!open){panel.classList.add('open');btn.classList.add('active')}
    });
  });
}

/* ═══ INJECT [ai] HELPERS ═══ */
function injectAIHelpers(){
  Object.keys(AI).forEach(function(fid){
    var inp=document.getElementById(fid); if(!inp)return;
    var field=inp.closest('.field'); if(!field)return;
    var hdr=field.querySelector('.field-header'); if(!hdr)return;
    var h=AI[fid];
    var btn=document.createElement('button'); btn.type='button'; btn.className='btn-ai'; btn.textContent='ai'; btn.title=h.title;
    hdr.appendChild(btn);
    var panel=document.createElement('div'); panel.className='ai-panel';
    var pid='aip_'+fid;
    var html='<h4>\u{1F916} '+h.title+'</h4><p>'+h.desc+'</p>';
    if(h.type==='volume'){
      html+='<div id="'+pid+'_rooms"></div>'+
        '<button type="button" class="btn-secondary" style="font-size:.82em;padding:6px 12px;margin:6px 0" id="'+pid+'_add">+ Kamer toevoegen</button>'+
        '<div class="ai-result" id="'+pid+'_res" style="display:none"></div>';
    } else if(h.type==='select'){
      html+='<select id="'+pid+'_sel"><option value="">— Kies —</option>';
      h.opts.forEach(function(o){html+='<option value="'+o[0]+'">'+o[1]+'</option>'});
      html+='</select><div class="ai-result" id="'+pid+'_res" style="display:none"></div>';
    }
    panel.innerHTML=html;
    field.appendChild(panel);
    btn.addEventListener('click',function(){
      var open=panel.classList.contains('open');
      $$('.ai-panel.open').forEach(function(p){p.classList.remove('open')});
      if(!open)panel.classList.add('open');
    });
    // Bind events after panel is in DOM
    setTimeout(function(){
      if(h.type==='volume'){
        var addBtn=document.getElementById(pid+'_add');
        var rc=0;
        if(addBtn)addBtn.addEventListener('click',function(){
          rc++;
          var container=document.getElementById(pid+'_rooms');
          var row=document.createElement('div');
          row.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
          row.innerHTML='<input type="text" placeholder="Kamer '+rc+'" style="flex:2;padding:6px 8px;border:1px solid #b0c4de;border-radius:4px;font-size:.85em">'+
            '<input type="number" placeholder="m\u00B2" class="'+pid+'_a" style="flex:1;padding:6px;border:1px solid #b0c4de;border-radius:4px;font-size:.85em">'+
            '<input type="number" placeholder="hoogte" value="2.5" class="'+pid+'_h" style="flex:1;padding:6px;border:1px solid #b0c4de;border-radius:4px;font-size:.85em">';
          container.appendChild(row);
          // Bind recalc
          row.querySelectorAll('input[type="number"]').forEach(function(inp2){
            inp2.addEventListener('input',function(){calcVol(pid,fid)});
          });
        });
      } else if(h.type==='select'){
        var sel=document.getElementById(pid+'_sel');
        if(sel)sel.addEventListener('change',function(){
          var res=document.getElementById(pid+'_res');
          if(!sel.value||!res)return;
          var label=sel.options[sel.selectedIndex].text;
          res.style.display='block';
          res.innerHTML='<strong>Geschatte waarde: '+sel.value+'</strong><br>'+
            '<span style="font-size:.85em;color:#555">'+label+'</span><br>'+
            '<button type="button" class="ai-apply-btn" id="'+pid+'_apply">Overnemen \u2192</button>';
          document.getElementById(pid+'_apply').addEventListener('click',function(){
            document.getElementById(fid).value=sel.value;
            this.textContent='\u2713 Ingevuld!'; this.disabled=true;
          });
        });
      }
    },50);
  });
}

function calcVol(pid,fid){
  var areas=$$('.'+pid+'_a');
  var heights=$$('.'+pid+'_h');
  var total=0;
  for(var i=0;i<areas.length;i++){
    total+=num(areas[i].value)*num(heights[i]?heights[i].value:2.5,2.5);
  }
  var res=document.getElementById(pid+'_res');
  if(res&&total>0){
    res.style.display='block';
    res.innerHTML='<strong>Berekend volume: '+Math.round(total)+' m\u00B3</strong><br>'+
      '<button type="button" class="ai-apply-btn" id="'+pid+'_apply">Overnemen \u2192</button>';
    document.getElementById(pid+'_apply').addEventListener('click',function(){
      document.getElementById(fid).value=Math.round(total);
      this.textContent='\u2713 Ingevuld!'; this.disabled=true;
    });
  }
}

/* ═══ BUILD SELECTS ═══ */
function buildSelects(){
  fill('#mainType',HEAT_MAIN_DEF,'hp');
  fill('#auxType',HEAT_AUX_DEF,'none');
  fill('#dhwType',DHW_TYPES_DEF,'elec');
  fill('#poolHeatType',POOL_HEAT_DEF,'hp');
}
function fill(sel,defs,def){
  var el=$(sel);if(!el)return;
  el.innerHTML=defs.map(function(d){return'<option value="'+d.key+'">'+d.label.replace(/\s*\(SCOP\)/i,'').replace(/\s*\(η\)/i,'').replace(/ketel η/i,'ketel').replace(/‑/g,'-')+'</option>'}).join('');
  el.value=def;
}

/* ═══ PRESETS ═══ */
function buildPresets(){
  var P={
    wall:{'Dikke stenen muur, ongeïsoleerd':2.0,'Licht geïsoleerd (~5cm)':0.8,'Goed (~10cm)':0.4,'Zeer goed (15cm+)':0.25},
    roof:{'Ongeïsoleerd dak':3.0,'Beetje isolatie (~10cm)':0.5,'Goed (~20cm)':0.25,'Zeer goed (30cm+)':0.15},
    floor:{'Op zand/aarde':2.2,'Kruipruimte':1.2,'Licht geïsoleerd':0.8,'Goed geïsoleerd':0.3},
    win:{'Enkel glas':5.5,'Oud dubbel':2.8,'Modern dubbel':1.6,'Triple HR++':1.0}
  };
  Object.keys(P).forEach(function(k){
    var c=$('#'+k+'Presets'), tid=k==='win'?'winU':k+'U';
    if(!c)return;
    c.innerHTML=Object.keys(P[k]).map(function(l){return'<button type="button" class="preset-btn" data-t="'+tid+'" data-v="'+P[k][l]+'">'+l+'</button>'}).join('');
    c.querySelectorAll('.preset-btn').forEach(function(b){
      b.addEventListener('click',function(){
        document.getElementById(b.dataset.t).value=b.dataset.v;
        c.querySelectorAll('.preset-btn').forEach(function(x){x.classList.remove('active')});
        b.classList.add('active');
      });
    });
  });
}

/* ═══ APPLIANCES ═══ */
function buildAppliances(){
  var c=$('#appliances');if(!c)return;
  c.innerHTML=DEFAULT_APPLIANCES.map(function(a,i){
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--primary-light);border-radius:6px;margin-bottom:6px">'+
      '<label style="display:flex;align-items:center;gap:8px;font-size:.9em;cursor:pointer">'+
      '<input type="checkbox" id="appl_on_'+i+'" '+(a.on?'checked':'')+' style="accent-color:var(--primary);width:16px;height:16px"> '+a.label+'</label>'+
      '<div style="display:flex;align-items:center;gap:4px"><input type="number" id="appl_kwh_'+i+'" value="'+a.kwh+'" style="width:70px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;text-align:right;font-size:.85em"> <span style="font-size:.78em;color:var(--text-light)">kWh/j</span></div></div>';
  }).join('');
}

/* ═══ PRICES ═══ */
function buildPriceInputs(){
  var c=$('#prices');if(!c)return;
  var L={elec:'Elektriciteit',gas:'Aardgas',fioul:'Stookolie',pellet:'Houtpellets',wood:'Stookhout',propaan:'Propaan',petroleum:'Petroleum'};
  c.innerHTML=Object.keys(L).map(function(k){
    return'<div class="field"><label>'+L[k]+' <span class="unit">('+ENERGY_UNITS[k]+')</span></label>'+
      '<input type="number" id="price_'+k+'" value="'+PRICE_DEFAULTS_USER[k]+'" step="0.01"></div>';
  }).join('');
}

/* ═══ TOGGLES ═══ */
function bindToggles(){
  on('ventType','change',function(v){tog('hrvWrap',v==='hrv')});
  on('mainType','change',function(v){tog('mainScopWrap',v==='hp');tog('mainEtaWrap','gas fioul pellet wood'.split(' ').indexOf(v)>=0)});
  on('auxType','change',function(v){tog('auxDetailsWrap',v!=='none');tog('auxScopWrap',v==='inverter');tog('auxEtaWrap','pellet wood petroleum'.split(' ').indexOf(v)>=0)});
  on('auxSharePreset','change',function(v){tog('auxShareCustomWrap',v==='custom')});
  on('dhwType','change',function(v){tog('dhwScopWrap',v==='hp');tog('dhwEtaWrap',v==='gas')});
  on('pvKwp','input',function(v){var h=num(v)>0;tog('pvSelfWrap',h);tog('pvExportWrap',h)});
  on('pvExportMode','change',function(v){tog('pvExportTariffWrap',v==='custom')});
  var ac=$('#acOn');if(ac)ac.addEventListener('change',function(){tog('seerWrap',ac.checked)});
  var ph=$('#poolHas');if(ph)ph.addEventListener('change',function(){tog('poolInputs',ph.checked)});
  on('poolHeatType','change',function(v){tog('poolScopWrap',v==='hp')});
}
function on(id,ev,fn){var e=document.getElementById(id);if(e)e.addEventListener(ev,function(){fn(e.value)})}
function tog(id,show){var e=document.getElementById(id);if(e){if(show)e.classList.add('visible');else e.classList.remove('visible')}}

/* ═══ GATHER STATE ═══ */
function gatherState(){
  var pr={};Object.keys(PRICE_DEFAULTS_USER).forEach(function(k){var e=document.getElementById('price_'+k);pr[k]=e?num(e.value,PRICE_DEFAULTS_USER[k]):PRICE_DEFAULTS_USER[k]});
  var ap=DEFAULT_APPLIANCES.map(function(a,i){return{key:a.key,label:a.label,scales:a.scales,on:document.getElementById('appl_on_'+i)?document.getElementById('appl_on_'+i).checked:a.on,kwh:document.getElementById('appl_kwh_'+i)?num(document.getElementById('appl_kwh_'+i).value,a.kwh):a.kwh}});
  return{zone:v('zone','paris'),setpoint:num(v('setpoint'),20),volume:num(v('volume'),250),ach:num(v('ach'),0.5),ventType:v('ventType','natural'),hrvEta:num(v('hrvEta'),0.75),
    wallA:num(v('wallA'),120),wallU:num(v('wallU'),0.5),roofA:num(v('roofA'),100),roofU:num(v('roofU'),0.25),floorA:num(v('floorA'),100),floorU:num(v('floorU'),0.35),winA:num(v('winA'),20),winU:num(v('winU'),1.6),
    presentDays:Math.min(365,Math.max(0,num(v('presentDays'),260))),awaySetpoint:num(v('awaySetpoint'),12),
    mainType:v('mainType','hp'),mainScop:num(v('mainScop'),3.2),mainEta:num(v('mainEta'),0.9),
    auxType:v('auxType','none'),auxSharePreset:v('auxSharePreset','25'),auxShareCustom:num(v('auxShareCustom'),25),auxScop:num(v('auxScop'),3.2),auxEta:num(v('auxEta'),0.85),
    persons:num(v('persons'),2),showersPerPerson:num(v('showersPerPerson'),1),litersPer:num(v('litersPer'),55),
    dhwType:v('dhwType','elec'),dhwScop:num(v('dhwScop'),2.5),dhwEta:num(v('dhwEta'),0.9),
    pvKwp:num(v('pvKwp'),0),pvSelfUse:num(v('pvSelfUse'),60),pvExportMode:v('pvExportMode','nvt'),pvExportTariff:num(v('pvExportTariff'),0.04),
    acOn:$('#acOn')?$('#acOn').checked:false,seer:num(v('seer'),4.0),appls:ap,
    evKmWeek:num(v('evKmWeek'),0),evKwh100:num(v('evKwh100'),18),evLoss:num(v('evLoss'),10),
    poolHas:$('#poolHas')?$('#poolHas').checked:false,poolVol:num(v('poolVol'),30),poolTargetT:num(v('poolTargetT'),27),
    poolSeason:num(v('poolSeason'),5),poolHeatType:v('poolHeatType','hp'),poolHpScop:num(v('poolHpScop'),4),
    poolPumpW:num(v('poolPumpW'),450),poolPumpH:num(v('poolPumpH'),8),poolCover:v('poolCover','true'),poolWind:1,userPrices:pr};
}
function v(id,d){var e=document.getElementById(id);return e?e.value:(d||'')}

/* ═══ CONFIRMS ═══ */
window.buildConfirm=function(sec){
  var el=document.getElementById('confirm-'+sec);if(!el)return;
  var ZL={med:'Middellandse Zee',ouest:'Zuid-West',paris:'Noord/Parijs',centre:'Centraal',est:'Oost',mont:'Bergen'};
  var VL={natural:'Natuurlijk',mech:'Mechanisch',hrv:'Met warmteterugwinning'};
  var h='';
  switch(sec){
    case'2':h=c('Klimaatzone',ZL[v('zone')]||v('zone'))+c('Binnentemperatuur',v('setpoint')+' °C')+c('Bij afwezigheid',v('awaySetpoint')+' °C')+c('Aanwezigheid',v('presentDays')+' d/j');break;
    case'3':h=c('Volume',v('volume')+' m³')+c('Ventilatie',VL[v('ventType')]||v('ventType'))+c('Luchtwisseling',v('ach')+'/uur');if(v('ventType')==='hrv')h+=c('WTW',v('hrvEta'));break;
    case'4':h=c('Muren',v('wallA')+' m² · U='+v('wallU'))+c('Dak',v('roofA')+' m² · U='+v('roofU'))+c('Vloer',v('floorA')+' m² · U='+v('floorU'))+c('Ramen',v('winA')+' m² · U='+v('winU'));break;
    case'5':var ml=HEAT_MAIN_DEF.find(function(x){return x.key===v('mainType')});h=c('Hoofd',ml?ml.label:v('mainType'));
      if(v('mainType')==='hp')h+=c('SCOP',v('mainScop'));if('gas fioul pellet wood'.split(' ').indexOf(v('mainType'))>=0)h+=c('Rendement',v('mainEta'));
      var al=HEAT_AUX_DEF.find(function(x){return x.key===v('auxType')});h+=c('Bij',al?al.label:'Geen');
      if(v('auxType')!=='none')h+=c('Aandeel',(v('auxSharePreset')==='custom'?v('auxShareCustom'):v('auxSharePreset'))+'%');break;
    case'6':h=c('Personen',v('persons'))+c('Douches',v('showersPerPerson')+'/dag')+c('Liter/douche',v('litersPer')+' L');
      var dl=DHW_TYPES_DEF.find(function(x){return x.key===v('dhwType')});h+=c('Warmwater',dl?dl.label:v('dhwType'));break;
    case'7':h=c('PV',num(v('pvKwp'))>0?v('pvKwp')+' kWp':'Geen')+c('EV',num(v('evKmWeek'))>0?v('evKmWeek')+' km/wk':'Geen')+
      c('Airco',$('#acOn')&&$('#acOn').checked?'Ja':'Nee')+c('Zwembad',$('#poolHas')&&$('#poolHas').checked?'Ja':'Nee');break;
  }
  el.innerHTML=h;
};
function c(l,val){return'<div class="confirm-card"><div class="label">'+l+'</div><div class="value">'+val+'</div></div>'}

/* ═══ COMPUTE & RENDER ═══ */
window.computeAndRender=function(){
  var s=gatherState(),r=computeResults(s);
  var te=$('#totalCost');if(te)te.textContent=eur(r.totalCost);
  var me=$('#perMonth');if(me)me.textContent=eur(r.perMonth)+' per maand';
  var bd=$('#costBreakdown');
  if(bd){
    var rows=[{l:'Verwarming',v:r.costs.verwarming},{l:'Warm water',v:r.costs.tapwater},{l:'Koeling',v:r.costs.koeling},{l:'Apparaten',v:r.costs.apparaten},{l:'EV',v:r.costs.ev},{l:'Zwembad',v:r.costs.zwembad},{l:'PV besparing',v:r.costs.pvWaarde},{l:'PV teruglevering',v:r.costs.pvExportOpbrengst}].filter(function(x){return Math.abs(x.v)>1});
    bd.innerHTML=rows.map(function(x){return'<div class="result-row"><span class="label">'+x.l+'</span><span class="val">'+eur(x.v)+'</span></div>'}).join('')+
      '<div class="result-row total"><span class="label">Totaal/jaar</span><span class="val">'+eur(r.totalCost)+'</span></div>';
  }
  var eb=$('#energyBalance');
  if(eb)eb.innerHTML=rw('Warmtevraag',fmt0(r.heatDemand)+' kWh')+rw('Verwarming hoofd',fmt0(r.verbruik.heatMain)+' kWh')+rw('Verwarming bij',fmt0(r.verbruik.heatAux)+' kWh')+rw('Warm water',fmt0(r.verbruik.tapwater)+' kWh')+rw('Bruto elektra',fmt0(r.verbruik.brutoElec)+' kWh')+rw('PV eigen','-'+fmt0(r.verbruik.pvEigen)+' kWh')+rw('Netto van net',fmt0(r.verbruik.nettoElec)+' kWh');
  var bars=$('#costBars');
  if(bars){
    var it=[{l:'Verwarming',v:Math.max(0,r.costs.verwarming)},{l:'Warm water',v:Math.max(0,r.costs.tapwater)},{l:'Apparaten',v:Math.max(0,r.costs.apparaten)},{l:'Koeling',v:Math.max(0,r.costs.koeling)},{l:'EV',v:Math.max(0,r.costs.ev)},{l:'Zwembad',v:Math.max(0,r.costs.zwembad)}].filter(function(x){return x.v>1});
    var mx=Math.max.apply(null,it.map(function(x){return x.v}));
    bars.innerHTML=it.map(function(x){return'<div class="bar-row"><span class="bar-label">'+x.l+'</span><div class="bar-track"><div class="bar-fill" style="width:'+(mx>0?x.v/mx*100:0)+'%"></div></div><span class="bar-value">'+eur(x.v)+'</span></div>'}).join('');
  }
  var gs=$('#grondslagen');
  if(gs){
    var z=ZONES.find(function(x){return x.id===s.zone})||ZONES[2];
    gs.innerHTML='<p><strong>Transmissie:</strong> H = \u03A3(U\u00D7A) = '+fmt1(r.debug.UA)+' W/K</p>'+
      '<p><strong>Ventilatie:</strong> 0,34 \u00D7 '+s.ach+' \u00D7 '+s.volume+' = '+fmt1(r.debug.Hvent)+' W/K'+(s.ventType==='hrv'?' \u2192 na WTW: '+fmt1(r.debug.HventEff)+' W/K':'')+'</p>'+
      '<p><strong>Totaal:</strong> H = '+fmt1(r.debug.H)+' W/K</p>'+
      '<p><strong>Zone:</strong> '+z.name+' \u00B7 '+z.hdd+' graaddagen</p>'+
      '<p><strong>Warmtevraag:</strong> '+fmt0(r.heatDemand)+' kWh/j</p>'+
      '<p style="margin-top:10px;font-size:.85em;color:var(--text-light)">Bron: Infofrankrijk.com (Rob van der Meulen)</p>';
  }
};
function rw(l,val){return'<div class="result-row"><span class="label">'+l+'</span><span class="val">'+val+'</span></div>'}

})();
