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
presentDaysWinter:{text:'<strong>Aanwezigheidsdagen per seizoen</strong> — Verdeel uw aanwezigheid over winter (oktober–april, 212 dagen) en zomer (mei–september, 153 dagen).<br><br>Dit is belangrijk omdat verwarming vooral in de winter speelt. Een vakantiehuis dat alleen in de zomer wordt gebruikt kost veel minder dan een winterverblijf.<br><br>🏠 Permanent: ~200 winter + ~145 zomer<br>🏡 Halftijds: ~120 winter + ~80 zomer<br>🌴 Zomervakantie: ~30 winter + ~90 zomer<br>❄️ Winterverblijf: ~90 winter + ~30 zomer'},
woonoppervlak:{text:'<strong>Woonoppervlak (surface habitable)</strong> — De bewoonbare vloeroppervlakte van uw woning in m², gemeten binnen de muren. Dit is de wettelijke <em>surface habitable</em> zoals gebruikt op de DPE: alle verwarmde leefruimtes (woon- en slaapkamers, keuken, badkamer, gang), <em>exclusief</em> muren, trappen, kelders, garages, zolders lager dan 1,80&nbsp;m en balkons/terrassen.<br><br>Dit oppervlak is de noemer van de DPE-indicatie: de energie wordt uitgedrukt in kWh per m² per jaar. Staat vaak op uw koop-/huurakte of eerdere DPE.',source:'Code de la construction art. R.156-1 (surface habitable) · Méthode 3CL-DPE 2021'},
volume:{text:'<strong>Verwarmd volume</strong> \u2014 Wordt automatisch berekend als woonoppervlak \u00D7 gemiddelde plafondhoogte. Alleen zelf aanpassen als u het werkelijke volume kent, bijvoorbeeld bij een vide, hoge nok of onverwarmde ruimtes binnen het woonoppervlak. Onverwarmde zolders, garages en kelders tellen niet mee.'},
ceilingH:{text:'<strong>Gemiddelde plafondhoogte</strong> \u2014 Moderne woningen: 2,5 m. Oude Franse huizen (ma\u00E7onnerie, herenhuizen): vaak 2,7\u20133,0 m. Bij verschillende hoogtes per verdieping: neem het gemiddelde. De tool rekent hiermee uw verwarmd volume uit.'},
ventType:{text:'<strong>Type ventilatie</strong><br><br>🪟 <strong>Natuurlijk:</strong> Via ramen, kieren, roosters. Meeste oude Franse huizen.<br>🔄 <strong>Mechanisch (VMC):</strong> Ventilator zuigt lucht af. Standaard in nieuwere woningen.<br>♻️ <strong>Met warmteterugwinning (VMC double flux):</strong> Bespaart 15–25% op verwarmingskosten.',source:'Infofrankrijk.com'},
ach:{text:'<strong>Luchtwisseling per uur</strong> — Hoe vaak per uur alle lucht ververst wordt.<br><br>🏚️ Oud en tochtig: 1,0–2,0<br>🏠 Gemiddeld met kieren: 0,5–0,8<br>🏗️ Goed afgedicht: 0,3–0,5<br><br>Bij twijfel: kies 0,6.'},
hrvEta:{text:'<strong>Rendement warmteterugwinning</strong> — Staat op het typeplaatje van uw VMC double flux. Goede systemen: 80–90%.'},
wallA:{text:'<strong>Muuroppervlakte</strong> — Alle buitenmuren samen, <em>exclusief</em> ramen en deuren.<br><br>Voorbeeld: huis 10×8m, hoogte 2,7m → omtrek 36m × 2,7 = 97 m². Min 15 m² ramen = 82 m².'},
wallU:{text:'<strong>Isolatiewaarde muren (U-waarde)</strong> — Hoe lager, hoe beter.<br><br>🧱 Dikke stenen muur (>50cm), ongeïsoleerd: U ≈ 1,5–2,5<br>🧱 + 4–5cm isolatie: U ≈ 0,6–0,8<br>🧱 Goed geïsoleerd (10–15cm): U ≈ 0,25–0,40<br><br>R-waarde = 1/U-waarde. R=2,5 → U=0,40.',source:'Infofrankrijk.com · Méthode 3CL-DPE 2021'},
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
['3.0','Lucht/water (standaard)'],['3.8','Lucht/water (inverter, premium)'],['4.2','Bodem/water (geothermisch)']]},
pvKwp:{title:'Zonnepanelen-assistent',desc:'Vul het aantal panelen, de leeftijd en oriëntatie in. Ik bereken het vermogen.',type:'pv'},
pvSelfUse:{title:'Eigenverbruik-assistent',desc:'Ik schat uw eigenverbruikpercentage op basis van uw situatie.',type:'selfuse'}
};

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded',function(){
  buildSelects();buildPresets();buildAppliances();buildPriceInputs();bindToggles();bindValueSync();bindAreaVolumeLink();
  injectInfoButtons();injectAIHelpers();bindPresence();
});

/* ═══ PRESENCE SEASON PRESETS ═══ */
function bindPresence(){
  var btns=$$('.presence-preset');
  var wIn=document.getElementById('presentDaysWinter');
  var sIn=document.getElementById('presentDaysSummer');
  var sum=document.getElementById('presenceSummary');
  function updateSummary(){
    var w=num(wIn?wIn.value:155),s=num(sIn?sIn.value:105);
    if(sum)sum.textContent='Totaal: '+(w+s)+' dagen/jaar aanwezig ('+w+' winter + '+s+' zomer)';
  }
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      btns.forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
      var dw=parseInt(b.dataset.w),ds=parseInt(b.dataset.s);
      if(dw>0||ds>0){
        if(wIn)wIn.value=dw;
        if(sIn)sIn.value=ds;
      }
      updateSummary();
    });
  });
  if(wIn)wIn.addEventListener('input',function(){
    btns.forEach(function(x){x.classList.remove('active')});
    btns[btns.length-1].classList.add('active');
    updateSummary();
  });
  if(sIn)sIn.addEventListener('input',function(){
    btns.forEach(function(x){x.classList.remove('active')});
    btns[btns.length-1].classList.add('active');
    updateSummary();
  });
  updateSummary();
}

/* ═══ INJECT [i] BUTTONS ═══ */
function injectInfoButtons(){
  Object.keys(INFO).forEach(function(fid){
    var inp=document.getElementById(fid); if(!inp)return;
    var field=inp.closest('.field'); if(!field)return;
    var lbl=field.querySelector('label'); if(!lbl)return;
    var hdr=document.createElement('div'); hdr.className='field-header';
    lbl.parentNode.insertBefore(hdr,lbl); hdr.appendChild(lbl);
    // Button wrapper (holds both i and ai buttons)
    var wrap=field._btnWrap;
    if(!wrap){wrap=document.createElement('div');wrap.className='field-header-btns';hdr.appendChild(wrap);field._btnWrap=wrap}
    var btn=document.createElement('button'); btn.type='button'; btn.className='btn-info'; btn.innerHTML='\u2139 Uitleg'; btn.title='Meer uitleg';
    wrap.appendChild(btn);
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
    // Use existing button wrapper or create one
    var wrap=field._btnWrap;
    if(!wrap){wrap=document.createElement('div');wrap.className='field-header-btns';hdr.appendChild(wrap);field._btnWrap=wrap}
    var btn=document.createElement('button'); btn.type='button'; btn.className='btn-ai'; btn.innerHTML='\u{1F916} Assistent'; btn.title=h.title;
    wrap.appendChild(btn);
    var panel=document.createElement('div'); panel.className='ai-panel';
    var pid='aip_'+fid;
    var html='<h4>\u{1F916} '+h.title+'</h4><p>'+h.desc+'</p>';
    if(h.type==='select'){
      html+='<select id="'+pid+'_sel"><option value="">— Kies —</option>';
      h.opts.forEach(function(o){html+='<option value="'+o[0]+'">'+o[1]+'</option>'});
      html+='</select><div class="ai-result" id="'+pid+'_res" style="display:none"></div>';
    } else if(h.type==='pv'){
      html+='<div style="display:grid;gap:8px">'+
        '<div><label style="font-size:.85em;font-weight:600">Aantal panelen</label><input type="number" id="'+pid+'_count" placeholder="bijv. 10" min="0" max="100" style="width:100%;padding:8px;border:1.5px solid #b0c4de;border-radius:6px;font-size:.9em"></div>'+
        '<div><label style="font-size:.85em;font-weight:600">Leeftijd panelen</label><select id="'+pid+'_age" style="width:100%;padding:8px;border:1.5px solid #b0c4de;border-radius:6px;font-size:.9em">'+
          '<option value="1.0">Nieuw (0–3 jaar)</option>'+
          '<option value="0.95">Recent (3–8 jaar)</option>'+
          '<option value="0.88" selected>Gemiddeld (8–15 jaar)</option>'+
          '<option value="0.80">Ouder (15–20 jaar)</option>'+
          '<option value="0.70">Oud (>20 jaar)</option></select></div>'+
        '<div><label style="font-size:.85em;font-weight:600">Ori\u00EBntatie panelen</label><select id="'+pid+'_ori" style="width:100%;padding:8px;border:1.5px solid #b0c4de;border-radius:6px;font-size:.9em">'+
          '<option value="1.0">Zuid (optimaal)</option>'+
          '<option value="0.95">Zuid-Oost of Zuid-West</option>'+
          '<option value="0.85">Oost of West</option>'+
          '<option value="0.65">Noord-Oost of Noord-West</option>'+
          '<option value="0.50">Noord (ongunstig)</option></select></div>'+
        '<button type="button" class="ai-apply-btn" id="'+pid+'_calc" style="margin-top:4px">Bereken kWp \u2192</button>'+
        '<div class="ai-result" id="'+pid+'_res" style="display:none"></div></div>';
    } else if(h.type==='selfuse'){
      var sty='width:100%;padding:8px;border:1.5px solid #b0c4de;border-radius:6px;font-size:.9em';
      html+='<div style="display:grid;gap:8px">'+
        '<div><label style="font-size:.85em;font-weight:600">Hebt u een thuisbatterij?</label><select id="'+pid+'_bat" style="'+sty+'">'+
          '<option value="0">Nee</option>'+
          '<option value="15">Ja, kleine batterij (3\u20135 kWh)</option>'+
          '<option value="25">Ja, grote batterij (8\u201315 kWh)</option></select></div>'+
        '<div><label style="font-size:.85em;font-weight:600">Overdag thuis?</label><select id="'+pid+'_home" style="'+sty+'">'+
          '<option value="0">Nee, overdag niet thuis</option>'+
          '<option value="10">Soms (halftijds/part-time)</option>'+
          '<option value="15">Ja, thuiswerker of gepensioneerd</option></select></div>'+
        '<div><label style="font-size:.85em;font-weight:600">Grote dagverbruikers?</label><select id="'+pid+'_load" style="'+sty+'">'+
          '<option value="0">Nee, alleen standaard apparaten</option>'+
          '<option value="5">Warmtepomp of airco overdag</option>'+
          '<option value="10">Warmtepomp + EV laden overdag</option>'+
          '<option value="15">Warmtepomp + EV + zwembadpomp</option></select></div>'+
        '<button type="button" class="ai-apply-btn" id="'+pid+'_calc" style="margin-top:4px">Bereken eigenverbruik \u2192</button>'+
        '<div class="ai-result" id="'+pid+'_res" style="display:none"></div></div>';
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
      if(h.type==='select'){
        var sel=document.getElementById(pid+'_sel');
        if(sel)sel.addEventListener('change',function(){
          var res=document.getElementById(pid+'_res');
          if(!sel.value||!res)return;
          var label=sel.options[sel.selectedIndex].text;
          res.style.display='block';
          res.innerHTML='<strong>Geschatte waarde: '+sel.value+'</strong><br>'+
            '<span style="font-size:.85em;color:#555">'+label+'</span><br>'+
            '<button type="button" class="ai-apply-btn" data-for="'+fid+'" data-val="'+sel.value+'" id="'+pid+'_apply">Overnemen \u2192</button>';
          document.getElementById(pid+'_apply').addEventListener('click',function(){
            var f=document.getElementById(fid); f.value=sel.value;
            f.dispatchEvent(new Event('input',{bubbles:true}));
          });
        });
      } else if(h.type==='pv'){
        var pvCalcBtn=document.getElementById(pid+'_calc');
        if(pvCalcBtn)pvCalcBtn.addEventListener('click',function(){
          var count=num(document.getElementById(pid+'_count').value,0);
          var ageFactor=num(document.getElementById(pid+'_age').value,0.88);
          var oriFactor=num(document.getElementById(pid+'_ori').value,1.0);
          if(count<=0)return;
          var wpPerPanel=400*ageFactor;
          var effectiveKwp=(count*wpPerPanel/1000)*oriFactor;
          var res=document.getElementById(pid+'_res');
          if(res){
            res.style.display='block';
            var ageLabel=document.getElementById(pid+'_age').options[document.getElementById(pid+'_age').selectedIndex].text;
            var oriLabel=document.getElementById(pid+'_ori').options[document.getElementById(pid+'_ori').selectedIndex].text;
            res.innerHTML='<strong>Effectief vermogen: '+effectiveKwp.toFixed(1)+' kWp</strong><br>'+
              '<span style="font-size:.85em;color:#555">'+count+' panelen \u00D7 400Wp \u00D7 '+Math.round(ageFactor*100)+'% ('+ageLabel+') \u00D7 '+Math.round(oriFactor*100)+'% ('+oriLabel+')</span><br>'+
              '<button type="button" class="ai-apply-btn" data-for="'+fid+'" data-val="'+effectiveKwp.toFixed(1)+'" id="'+pid+'_apply2">Overnemen \u2192</button>';
            document.getElementById(pid+'_apply2').addEventListener('click',function(){
              var f=document.getElementById(fid); f.value=effectiveKwp.toFixed(1);
              f.dispatchEvent(new Event('input',{bubbles:true}));
            });
          }
        });
      } else if(h.type==='selfuse'){
        var suCalcBtn=document.getElementById(pid+'_calc');
        if(suCalcBtn)suCalcBtn.addEventListener('click',function(){
          var batBonus=num(document.getElementById(pid+'_bat').value,0);
          var homeBonus=num(document.getElementById(pid+'_home').value,0);
          var loadBonus=num(document.getElementById(pid+'_load').value,0);
          // Basis eigenverbruik zonder batterij, niet thuis, geen grote verbruikers: ~30%
          var base=30;
          var pct=Math.min(90,base+batBonus+homeBonus+loadBonus);
          var res=document.getElementById(pid+'_res');
          if(res){
            res.style.display='block';
            var uitleg=[];
            uitleg.push('Basis: '+base+'%');
            if(batBonus>0) uitleg.push('Batterij: +'+batBonus+'%');
            if(homeBonus>0) uitleg.push('Thuis overdag: +'+homeBonus+'%');
            if(loadBonus>0) uitleg.push('Dagverbruikers: +'+loadBonus+'%');
            res.innerHTML='<strong>Geschat eigenverbruik: '+pct+'%</strong><br>'+
              '<span style="font-size:.85em;color:#555">'+uitleg.join(' \u00B7 ')+'</span><br>'+
              '<span style="font-size:.82em;color:var(--text-light);display:block;margin-top:4px">'+(pct<40?'Laag eigenverbruik \u2014 overweeg een batterij of verschuif verbruik naar overdag.':pct<60?'Gemiddeld eigenverbruik \u2014 goed resultaat voor een standaard installatie.':pct<75?'Hoog eigenverbruik \u2014 u haalt veel uit uw panelen.':'Zeer hoog eigenverbruik \u2014 maximaal rendement uit uw installatie.')+'</span><br>'+
              '<button type="button" class="ai-apply-btn" data-for="'+fid+'" data-val="'+pct+'" id="'+pid+'_apply3">Overnemen \u2192</button>';
            document.getElementById(pid+'_apply3').addEventListener('click',function(){
              var f=document.getElementById(fid); f.value=pct;
              f.dispatchEvent(new Event('input',{bubbles:true}));
            });
          }
        });
      }
    },50);
  });
}


/* ═══ VELD = ENIGE WAARHEID: presets en assistent-knoppen volgen de veldwaarde ═══ */
function syncFieldState(fid){
  var f=document.getElementById(fid); if(!f)return;
  var v=num(f.value,NaN);
  document.querySelectorAll('.preset-btn[data-t="'+fid+'"]').forEach(function(b){
    if(num(b.dataset.v,NaN)===v)b.classList.add('active');else b.classList.remove('active');
  });
  document.querySelectorAll('.ai-apply-btn[data-for="'+fid+'"]').forEach(function(b){
    if(num(b.dataset.val,NaN)===v){b.textContent='\u2713 Ingevuld!';b.disabled=true}
    else{b.textContent='Overnemen \u2192';b.disabled=false}
  });
}
function bindValueSync(){
  ['wallU','roofU','floorU','winU','ceilingH','mainScop','volume','pvKwp','pvSelfUse'].forEach(function(fid){
    var f=document.getElementById(fid);
    if(f)f.addEventListener('input',function(){syncFieldState(fid)});
  });
}

/* ═══ M² × PLAFONDHOOGTE → M³: volume volgt automatisch totdat de gebruiker
   het volume bewust zelf overschrijft ═══ */
function bindAreaVolumeLink(){
  var opp=document.getElementById('woonoppervlak');
  var ch=document.getElementById('ceilingH');
  var vol=document.getElementById('volume');
  if(!opp||!vol)return;
  var volumeTouched=false;
  vol.addEventListener('input',function(e){ if(e.isTrusted)volumeTouched=true; });
  function recalc(){
    if(volumeTouched)return;
    var m2=num(opp.value,0);
    var h=num(ch?ch.value:2.5,2.5);
    if(m2>0&&h>0){
      vol.value=Math.round(m2*h);
      vol.dispatchEvent(new Event('input',{bubbles:false}));
    }
  }
  opp.addEventListener('input',recalc);
  if(ch)ch.addEventListener('input',recalc);
  recalc();
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
    win:{'Enkel glas':5.5,'Oud dubbel':2.8,'Modern dubbel':1.6,'Triple HR++':1.0},
    ceiling:{'Laag (2,2 m)':2.2,'Standaard (2,5 m)':2.5,'Ruim (2,7 m)':2.7,'Oud Frans huis (3,0 m)':3.0}
  };
  var T={wall:'wallU',roof:'roofU',floor:'floorU',win:'winU',ceiling:'ceilingH'};
  Object.keys(P).forEach(function(k){
    var c=$('#'+k+'Presets'), tid=T[k];
    if(!c)return;
    c.innerHTML=Object.keys(P[k]).map(function(l){return'<button type="button" class="preset-btn" data-t="'+tid+'" data-v="'+P[k][l]+'">'+l+'</button>'}).join('');
    c.querySelectorAll('.preset-btn').forEach(function(b){
      b.addEventListener('click',function(){
        var f=document.getElementById(b.dataset.t);
        f.value=b.dataset.v;
        f.dispatchEvent(new Event('input',{bubbles:true}));
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
      '<input type="number" id="price_'+k+'" value="'+PRICE_DEFAULTS_USER[k]+'" step="0.01">'+
      '<div class="help price-source" id="price_src_'+k+'"></div></div>';
  }).join('')+'<div id="priceUpdateInfo" style="font-size:.82em;color:var(--text-light);margin-top:8px"></div>';
  // Fetch actuele prijzen van API
  fetchLivePrices();
}

function fetchLivePrices(){
  fetch('/api/prices').then(function(r){return r.json()}).then(function(data){
    if(!data||!data.elec)return;
    Object.keys(data).forEach(function(k){
      if(k==='updated'||k==='staleWarning')return;
      var p=data[k];if(!p||!p.value)return;
      var inp=document.getElementById('price_'+k);
      var src=document.getElementById('price_src_'+k);
      if(inp){
        inp.value=p.value;
        if(typeof PRICE_DEFAULTS_USER!=='undefined') PRICE_DEFAULTS_USER[k]=p.value;
      }
      if(src){
        var badge=p.auto?'\u{1F7E2}':p.stale?'\u{1F534}':'\u{1F7E1}';
        src.innerHTML=badge+' '+p.source+', '+p.date+(p.stale?' <strong style="color:#dc3545">(verouderd)</strong>':'');
      }
    });
    var info=$('#priceUpdateInfo');
    if(info){
      var legend='\u{1F7E2} = live opgehaald \u{1F7E1} = referentiewaarde \u{1F534} = verouderd (>4 mnd)';
      var html='Prijzen opgehaald: '+data.updated+'<br><span style="font-size:.9em">'+legend+'</span>';
      if(data.staleWarning){
        html+='<div style="margin-top:8px;padding:8px 12px;background:rgba(220,53,69,0.08);border-left:3px solid #dc3545;border-radius:0 6px 6px 0;font-size:.9em;color:#dc3545">'+
          '<strong>\u26A0 '+data.staleWarning+'</strong><br>Pas de waarde handmatig aan op basis van uw meest recente factuur.</div>';
      }
      info.innerHTML=html;
    }
  }).catch(function(){
    // Stil falen — hardcoded defaults blijven staan
  });
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
  return{zone:v('zone','paris'),setpoint:num(v('setpoint'),20),volume:num(v('volume'),250),woonoppervlak:num(v('woonoppervlak'),100),ach:num(v('ach'),0.5),ventType:v('ventType','natural'),hrvEta:num(v('hrvEta'),0.75),
    wallA:num(v('wallA'),120),wallU:num(v('wallU'),0.5),roofA:num(v('roofA'),100),roofU:num(v('roofU'),0.25),floorA:num(v('floorA'),100),floorU:num(v('floorU'),0.35),winA:num(v('winA'),20),winU:num(v('winU'),1.6),
    presentDaysWinter:Math.min(212,Math.max(0,num(v('presentDaysWinter'),155))),presentDaysSummer:Math.min(153,Math.max(0,num(v('presentDaysSummer'),105))),awaySetpoint:num(v('awaySetpoint'),12),
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
    case'2':
      var actP=document.querySelector('.presence-preset.active');
      var wd=num(v('presentDaysWinter'),0), sd=num(v('presentDaysSummer'),0);
      h=c('Klimaatzone',ZL[v('zone')]||v('zone'))+c('Binnentemperatuur',v('setpoint')+' °C')+c('Bij afwezigheid',v('awaySetpoint')+' °C')+
        c('Gebruik',actP?actP.textContent.trim():'Zelf ingevuld')+
        c('Aanwezigheid',(wd+sd)+' dagen/jaar · '+wd+' winter (okt–apr) + '+sd+' zomer (mei–sep)');
      break;
    case'3':
      h=c('Woonoppervlak',v('woonoppervlak')+' m²')+c('Plafondhoogte',String(v('ceilingH')).replace('.',',')+' m')+c('Volume',v('volume')+' m³')+c('Ventilatie',VL[v('ventType')]||v('ventType'))+c('Luchtwisseling',v('ach')+'/uur');
      if(v('ventType')==='hrv')h+=c('WTW',v('hrvEta'));
      var _vol=num(v('volume'),0), _opp=num(v('woonoppervlak'),0);
      if(_opp>0&&_vol>0){
        var _ph=_vol/_opp;
        if(_ph<2||_ph>4){
          h+='<div class="confirm-card" style="border-color:#c0392b;background:rgba(192,57,43,0.05)"><div class="label" style="color:#c0392b">Controleer deze combinatie</div><div class="value small" style="color:#c0392b">'+_vol+' m³ bij '+_opp+' m² betekent een gemiddelde plafondhoogte van '+_ph.toFixed(1)+' m — dat is onwaarschijnlijk. Klopt het woonoppervlak of het volume niet?</div></div>';
        }
      }
      break;
    case'4':h=c('Muren',v('wallA')+' m² · U='+v('wallU'))+c('Dak',v('roofA')+' m² · U='+v('roofU'))+c('Vloer',v('floorA')+' m² · U='+v('floorU'))+c('Ramen',v('winA')+' m² · U='+v('winU'));break;
    case'5':var ml=HEAT_MAIN_DEF.find(function(x){return x.key===v('mainType')});h=c('Hoofd',ml?ml.label:v('mainType'));
      if(v('mainType')==='hp')h+=c('SCOP',v('mainScop'));if('gas fioul pellet wood'.split(' ').indexOf(v('mainType'))>=0)h+=c('Rendement',v('mainEta'));
      var al=HEAT_AUX_DEF.find(function(x){return x.key===v('auxType')});h+=c('Bij',al?al.label:'Geen');
      if(v('auxType')!=='none')h+=c('Aandeel',(v('auxSharePreset')==='custom'?v('auxShareCustom'):v('auxSharePreset'))+'%');break;
    case'6':h=c('Personen',v('persons'))+c('Douches',v('showersPerPerson')+'/dag')+c('Liter/douche',v('litersPer')+' L');
      var dl=DHW_TYPES_DEF.find(function(x){return x.key===v('dhwType')});h+=c('Warmwater',dl?dl.label:v('dhwType'));break;
    case'7':
      h=c('Zonnepanelen',num(v('pvKwp'))>0?v('pvKwp')+' kWp, '+v('pvSelfUse')+'% eigen':'Geen');
      if(num(v('pvKwp'))>0&&v('pvExportMode')!=='nvt') h+=c('Teruglevering',v('pvExportMode')==='vente'?'Vente du surplus':'Eigen tarief');
      // Apparaten: tel actieve kWh
      var appTotal=0;
      DEFAULT_APPLIANCES.forEach(function(a,i){var cb=document.getElementById('appl_on_'+i);var kw=document.getElementById('appl_kwh_'+i);if(cb&&cb.checked&&kw)appTotal+=num(kw.value,a.kwh)});
      h+=c('Apparaten',fmt0(appTotal)+' kWh/j ('+(DEFAULT_APPLIANCES.filter(function(a,i){var cb=document.getElementById('appl_on_'+i);return cb&&cb.checked}).length)+' actief)');
      h+=c('EV',num(v('evKmWeek'))>0?v('evKmWeek')+' km/wk':'Geen');
      h+=c('Airco',$('#acOn')&&$('#acOn').checked?'Ja (SEER '+v('seer')+')':'Nee');
      h+=c('Zwembad',$('#poolHas')&&$('#poolHas').checked?'Ja, '+v('poolVol')+' m\u00B3':'Nee');
      // Prijzen samenvatting
      var elP=document.getElementById('price_elec'),gasP=document.getElementById('price_gas');
      if(elP) h+=c('Elektriciteit',elP.value+' \u20AC/kWh');
      if(gasP) h+=c('Gas',gasP.value+' \u20AC/m\u00B3');
      break;
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
      '<p><strong>Aanwezigheid:</strong> '+s.presentDaysWinter+' d winter (okt\u2013apr) + '+s.presentDaysSummer+' d zomer (mei\u2013sep) = '+(s.presentDaysWinter+s.presentDaysSummer)+' d/jaar</p>'+
      '<p><strong>HDD-verdeling:</strong> 85% winter / 15% zomer (Météo France klimaatnormalen)</p>'+
      '<p><strong>Warmtevraag:</strong> '+fmt0(r.heatDemand)+' kWh/j</p>'+
      '<p style="margin-top:10px;font-size:.85em;color:var(--text-light)">Bron: Méthode 3CL-DPE 2021 · Infofrankrijk.com · Météo France</p>';
  }
  // Store for AI and DF
  window._lastState=s; window._lastResult=r;
  // Trigger DPE render (compact card + modal data)
  if(typeof renderDPE==='function') renderDPE();
  // Trigger savings + subsidies
  renderSavings(s,r);
  renderSubsidies(s,r);
};
function rw(l,val){return'<div class="result-row"><span class="label">'+l+'</span><span class="val">'+val+'</span></div>'}

/* ═══ BESPARINGSKANSEN ═══ */
function renderSavings(s,r){
  var card=$('#savingsCard');
  var list=$('#savingsList');
  var totalEl=$('#savingsTotal');
  if(!card||!list||!totalEl)return;

  // Drempelwaarden: huidige U vs. "goed geïsoleerd" doel
  var maatregelen=[
    {key:'roof', label:'Dakisolatie',  aField:'roofA', uField:'roofU', targetU:0.25, desc:'20 cm minerale wol of PUR', threshold:0.5,  icon:'\u{1F3E0}'},
    {key:'wall', label:'Gevelisolatie', aField:'wallA', uField:'wallU', targetU:0.35, desc:'10-15 cm buitenisolatie',    threshold:0.6,  icon:'\u{1F9F1}'},
    {key:'floor',label:'Vloerisolatie', aField:'floorA',uField:'floorU',targetU:0.35, desc:'8-12 cm onder of boven vloer',threshold:0.6,  icon:'\u{1FA9C}'},
    {key:'win',  label:'Beter glas',    aField:'winA',  uField:'winU',  targetU:1.2,  desc:'Modern HR dubbel of triple', threshold:2.0,  icon:'\u{1FA9F}'}
  ];

  // Ventilatie-maatregel
  var ventMaatregel=null;
  if(s.ventType!=='hrv'&&s.ach>0.4){
    ventMaatregel={key:'vent',label:'VMC double flux (WTW)',desc:'Warmteterugwinning op ventilatie',icon:'\u{1F4A8}'};
  }

  var items=[];
  var totalSaving=0;

  maatregelen.forEach(function(m){
    var currentU=s[m.uField];
    if(currentU<=m.threshold)return; // al goed genoeg

    // Herbereken met verbeterde U-waarde
    var improved=JSON.parse(JSON.stringify(s));
    improved[m.uField]=m.targetU;
    var rNew=computeResults(improved);
    var saving=r.totalCost-rNew.totalCost;
    if(saving<20)return; // niet de moeite

    items.push({
      icon:m.icon, label:m.label, desc:m.desc,
      from:'U='+currentU, to:'U='+m.targetU,
      saving:saving
    });
    totalSaving+=saving;
  });

  // Ventilatie
  if(ventMaatregel){
    var improved=JSON.parse(JSON.stringify(s));
    improved.ventType='hrv';
    improved.hrvEta=0.8;
    var rNew=computeResults(improved);
    var saving=r.totalCost-rNew.totalCost;
    if(saving>=20){
      items.push({
        icon:ventMaatregel.icon, label:ventMaatregel.label, desc:ventMaatregel.desc,
        from:'ACH='+s.ach, to:'WTW \u03B7=80%',
        saving:saving
      });
      totalSaving+=saving;
    }
  }

  // Warmtepomp upgrade (als geen WP)
  if(s.mainType!=='hp'){
    var improved=JSON.parse(JSON.stringify(s));
    improved.mainType='hp';
    improved.mainScop=3.5;
    var rNew=computeResults(improved);
    var saving=r.totalCost-rNew.totalCost;
    if(saving>=50){
      items.push({
        icon:'\u{1F321}\uFE0F', label:'Warmtepomp (lucht/water)',desc:'SCOP 3,5 — vervangt '+(HEAT_MAIN_DEF.find(function(x){return x.key===s.mainType})||{label:s.mainType}).label,
        from:s.mainType, to:'WP SCOP 3,5',
        saving:saving
      });
      totalSaving+=saving;
    }
  }

  if(items.length===0){
    card.style.display='none';
    return;
  }

  // Sorteer op hoogste besparing
  items.sort(function(a,b){return b.saving-a.saving});

  card.style.display='block';
  list.innerHTML=items.map(function(it){
    return'<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,155,77,0.12)">'+
      '<span style="font-size:1.3em;flex-shrink:0;margin-top:2px">'+it.icon+'</span>'+
      '<div style="flex:1">'+
        '<div style="font-weight:700;font-size:.95em">'+it.label+'</div>'+
        '<div style="font-size:.84em;color:var(--text-light)">'+it.desc+'</div>'+
        '<div style="font-size:.82em;color:var(--text-light);margin-top:2px">'+it.from+' \u2192 '+it.to+'</div>'+
      '</div>'+
      '<div style="text-align:right;flex-shrink:0">'+
        '<div style="font-weight:800;font-size:1.05em;color:#009B4D">'+eur(it.saving)+'</div>'+
        '<div style="font-size:.78em;color:var(--text-light)">/jaar</div>'+
      '</div>'+
    '</div>';
  }).join('');

  totalEl.innerHTML='<span style="color:#009B4D">Totaal potentieel: '+eur(totalSaving)+'/jaar</span>'+
    '<span style="font-size:.85em;font-weight:400;color:var(--text-light);margin-left:8px">('+eur(totalSaving/12)+'/maand)</span>';
}

/* ═══ DPE MODAL ═══ */
window.openDPEModal=function(){
  var m=document.getElementById('dpeModal');
  if(m){m.style.display='flex';document.body.style.overflow='hidden'}
};
window.closeDPEModal=function(){
  var m=document.getElementById('dpeModal');
  if(m){m.style.display='none';document.body.style.overflow=''}
};
// Close on overlay click
document.addEventListener('click',function(e){
  if(e.target&&e.target.id==='dpeModal') closeDPEModal();
});
// Close on Escape
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') closeDPEModal();
});

/* ═══ SUBSIDIES ═══ */
function renderSubsidies(s,r){
  var card=$('#subsidieCard');
  var list=$('#subsidieList');
  if(!card||!list)return;

  // DPE berekenen (conventioneel, dubbele drempel) — met terugval op de oude schatting.
  var dpeC=currentDPE(s);
  var dpe=dpeC?{letter:dpeC.classe,index:dpeC.details.classeIndex}
              :getDPE(((r.verbruik.heatMain||0)+(r.verbruik.heatAux||0)+(r.verbruik.tapwater||0)+(r.verbruik.koelingEl||0))/Math.max(1,s.floorA||100));

  var subs=[];

  // MaPrimeRénov' Geste — altijd beschikbaar voor résidence principale
  subs.push({
    icon:'\u{1F3E0}',
    name:'MaPrimeR\u00E9nov\u2019 Geste',
    desc:'Eenmalige renovatiemaatregel (isolatie, verwarming, ventilatie). Bedrag afhankelijk van inkomen en maatregel.',
    status:'Beschikbaar',
    color:'#009B4D'
  });

  // MaPrimeRénov' Ampleur — alleen bij DPE E/F/G
  if(dpe.index>=4){
    subs.push({
      icon:'\u{1F3D7}\uFE0F',
      name:'MaPrimeR\u00E9nov\u2019 Ampleur',
      desc:'Combinatierenovatie met \u22652 klassensprongen en \u22652 isolatiemaatregelen. Subsidiabele werken tot \u20AC30.000 (2 klassen) of \u20AC40.000 (3+ klassen); vergoedingspercentage afhankelijk van inkomenscategorie. Verplicht: Mon Accompagnateur R\u00E9nov\u2019 en vooraf een afspraak bij France R\u00E9nov\u2019.',
      status:'Uw woning komt in aanmerking (DPE '+dpe.letter+')',
      color:'#009B4D'
    });
  } else {
    subs.push({
      icon:'\u{1F3D7}\uFE0F',
      name:'MaPrimeR\u00E9nov\u2019 Ampleur',
      desc:'Combinatierenovatie, vereist DPE E, F of G. Uw woning heeft DPE '+dpe.letter+'.',
      status:'Niet van toepassing (DPE '+dpe.letter+')',
      color:'#999'
    });
  }

  // CEE
  subs.push({
    icon:'\u{1F4B6}',
    name:'CEE (Certificats d\u2019\u00C9conomies d\u2019\u00C9nergie)',
    desc:'Premies via uw energieleverancier, voor woningen ouder dan 2 jaar. Cumuleerbaar met MaPrimeR\u00E9nov\u2019 par geste; bij een r\u00E9novation d\u2019ampleur zit de CEE-waarde al in de prime verwerkt.',
    status:'Beschikbaar',
    color:'#009B4D'
  });

  // Éco-PTZ
  subs.push({
    icon:'\u{1F3E6}',
    name:'\u00C9co-PTZ (rentevrije lening)',
    desc:'Tot \u20AC50.000 via een erkende bank. Geen inkomensvoorwaarde. Looptijd tot 20 jaar.',
    status:'Beschikbaar',
    color:'#009B4D'
  });

  // TVA 5,5%
  subs.push({
    icon:'\u{1F4CB}',
    name:'TVA r\u00E9duite 5,5%',
    desc:'Verlaagd btw-tarief op arbeid \u00E9n materiaal voor energierenovatie. Automatisch toegepast door de aannemer.',
    status:'Automatisch',
    color:'#009B4D'
  });

  card.style.display='block';
  list.innerHTML=subs.map(function(sub){
    return'<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,102,204,0.1)">'+
      '<span style="font-size:1.2em;flex-shrink:0">'+sub.icon+'</span>'+
      '<div style="flex:1">'+
        '<div style="font-weight:700;font-size:.92em">'+sub.name+'</div>'+
        '<div style="font-size:.84em;color:var(--text-light)">'+sub.desc+'</div>'+
      '</div>'+
      '<div style="font-size:.82em;font-weight:600;color:'+sub.color+';white-space:nowrap;flex-shrink:0">'+sub.status+'</div>'+
    '</div>';
  }).join('')+
  '<div style="font-size:.78em;color:var(--text-light);margin-top:8px;font-style:italic">Stand: juli 2026 (loi de finances 2026, heropening guichet 23 februari 2026). Regels wijzigen regelmatig \u2014 controleer de actuele voorwaarden op france-renov.gouv.fr v\u00F3\u00F3r u een aanvraag doet.</div>';
}

/* ═══ PDF RAPPORT ═══ */
window.generatePDF=function(){
  var btn=$('#printPdfBtn');
  var s=window._lastState, r=window._lastResult;
  if(!s||!r){alert('Bereken eerst het resultaat.');return}

  if(btn){btn.textContent='Rapport wordt voorbereid...';btn.disabled=true}

  // 1. Vul besparingskansen print-blok
  var savingsPrint=$('#savingsPrintContent');
  var savingsScreen=$('#savingsList');
  var savingsTotal=$('#savingsTotal');
  if(savingsPrint&&savingsScreen&&savingsScreen.innerHTML){
    savingsPrint.innerHTML=savingsScreen.innerHTML;
    if(savingsTotal) savingsPrint.innerHTML+='<div style="margin-top:12px;padding-top:12px;border-top:2px solid rgba(0,155,77,0.2);font-weight:700">'+savingsTotal.innerHTML+'</div>';
  }

  // 2. Haal AI-verslag op, dan print
  var aiPrint=$('#aiPrintContent');
  var aiScreen=$('#aiExplanation');

  // Als AI al op scherm staat, gebruik dat
  if(aiScreen&&aiScreen.style.display!=='none'&&aiScreen.innerHTML&&aiScreen.innerHTML.indexOf('analyseert')===-1){
    if(aiPrint) aiPrint.innerHTML=aiScreen.innerHTML;
    doPrint(btn);
    return;
  }

  // Anders: haal AI op
  fetch('https://if-tools-api.vercel.app/api/energy-explain',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      zone:s.zone,totalCost:r.totalCost,perMonth:r.perMonth,
      heatDemand:r.heatDemand,mainType:s.mainType,auxType:s.auxType,
      mainScop:s.mainScop,mainEta:s.mainEta,
      wallU:s.wallU,roofU:s.roofU,floorU:s.floorU,winU:s.winU,
      wallA:s.wallA,roofA:s.roofA,floorA:s.floorA,winA:s.winA,
      volume:s.volume,presentDaysWinter:s.presentDaysWinter,presentDaysSummer:s.presentDaysSummer,
      setpoint:s.setpoint,awaySetpoint:s.awaySetpoint,
      ach:s.ach,persons:s.persons,pvKwp:s.pvKwp,
      costs:r.costs,verbruik:r.verbruik,debug:r.debug
    })
  }).then(function(resp){return resp.json()})
  .then(function(data){
    var raw=data.explanation||'Geen AI-analyse beschikbaar.';
    var html=raw
      .replace(/^### (.+)$/gm,'<h4 style="color:var(--primary);margin:12px 0 4px;font-size:.95em">$1</h4>')
      .replace(/^## (.+)$/gm,'<h3 style="color:var(--primary);margin:16px 0 6px;font-size:1.05em">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/^- (.+)$/gm,'<div style="padding-left:1em;text-indent:-1em;margin:2px 0">\u2022 $1</div>')
      .replace(/\n\n/g,'</p><p style="margin:8px 0">')
      .replace(/\n/g,'<br>');
    if(aiPrint) aiPrint.innerHTML='<p style="margin:8px 0">'+html+'</p>';
    doPrint(btn);
  }).catch(function(){
    if(aiPrint) aiPrint.innerHTML='<p><em>AI-analyse kon niet worden opgehaald.</em></p>';
    doPrint(btn);
  });
};

function doPrint(btn){
  setTimeout(function(){
    // Tijdelijk titel aanpassen zodat browser "Energierapport — Infofrankrijk.com" toont ipv de URL
    var origTitle=document.title;
    document.title='Energierapport \u2014 Infofrankrijk.com';
    window.print();
    document.title=origTitle;
    if(btn){btn.textContent='Rapport genereren (PDF) \u2192';btn.disabled=false}
  },300);
}

/* ═══ AI EXPLANATION ═══ */
window.requestAIExplanation=function(){
  var btn=$('#aiExplainBtn');
  var div=$('#aiExplanation');
  if(!btn||!div)return;
  var s=window._lastState, r=window._lastResult;
  if(!s||!r){btn.textContent='Bereken eerst het resultaat';return}
  btn.textContent='Even geduld...';btn.disabled=true;
  div.style.display='block';
  div.innerHTML='<em>De AI-assistent analyseert uw resultaten...</em>';

  fetch('https://if-tools-api.vercel.app/api/energy-explain',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      zone:s.zone,totalCost:r.totalCost,perMonth:r.perMonth,
      heatDemand:r.heatDemand,mainType:s.mainType,auxType:s.auxType,
      mainScop:s.mainScop,mainEta:s.mainEta,
      wallU:s.wallU,roofU:s.roofU,floorU:s.floorU,winU:s.winU,
      wallA:s.wallA,roofA:s.roofA,floorA:s.floorA,winA:s.winA,
      volume:s.volume,presentDaysWinter:s.presentDaysWinter,presentDaysSummer:s.presentDaysSummer,
      setpoint:s.setpoint,awaySetpoint:s.awaySetpoint,
      ach:s.ach,persons:s.persons,pvKwp:s.pvKwp,
      costs:r.costs,verbruik:r.verbruik,debug:r.debug
    })
  }).then(function(resp){return resp.json()})
  .then(function(data){
    var raw=data.explanation||data.error||'Geen uitleg beschikbaar.';
    // Simpele markdown → HTML
    var html=raw
      .replace(/^### (.+)$/gm,'<h4 style="color:var(--primary);margin:12px 0 4px;font-size:.95em">$1</h4>')
      .replace(/^## (.+)$/gm,'<h3 style="color:var(--primary);margin:16px 0 6px;font-size:1.05em">$1</h3>')
      .replace(/^# (.+)$/gm,'<h3 style="color:var(--primary);margin:16px 0 8px;font-size:1.1em">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/^- (.+)$/gm,'<div style="padding-left:1em;text-indent:-1em;margin:2px 0">\u2022 $1</div>')
      .replace(/\n\n/g,'</p><p style="margin:8px 0">')
      .replace(/\n/g,'<br>');
    html='<div style="line-height:1.7;font-size:.9em"><p style="margin:8px 0">'+html+'</p></div>';
    // Toon plausibiliteitswaarschuwingen als die er zijn
    if(data.warnings&&data.warnings.length>0){
      html+='<div style="margin-top:16px;padding:12px 16px;background:rgba(245,166,35,0.08);border-left:4px solid #F5A623;border-radius:0 6px 6px 0;font-size:.88em">';
      html+='<strong style="color:#E95D0F">Plausibiliteitscheck:</strong><br>';
      data.warnings.forEach(function(w){
        var icon=w.ernst==='fout'?'🔴':w.ernst==='waarschuwing'?'🟡':'🔵';
        html+=icon+' <strong>'+w.veld+':</strong> '+w.probleem+'<br>';
      });
      html+='</div>';
    }
    div.innerHTML=html;
    btn.textContent='Opnieuw uitleggen';btn.disabled=false;
  }).catch(function(){
    div.innerHTML='<p>De AI-assistent is momenteel niet beschikbaar. Hieronder een samenvatting op basis van uw invoer:</p>'+buildFallbackExplanation(s,r);
    btn.textContent='Opnieuw proberen';btn.disabled=false;
  });
};

function buildFallbackExplanation(s,r){
  var zn={med:'Middellandse Zee',ouest:'Zuid-West',paris:'Noord/Parijs',centre:'Centraal',est:'Oost',mont:'Bergen'};
  var ht={hp:'warmtepomp',elec:'elektrische verwarming',gas:'gasketel',fioul:'stookolieketel',pellet:'pelletketel',wood:'houtkachel'};
  var biggest='verwarming';var bigVal=r.costs.verwarming;
  if(r.costs.tapwater>bigVal){biggest='warm water';bigVal=r.costs.tapwater}
  if(r.costs.apparaten>bigVal){biggest='apparaten';bigVal=r.costs.apparaten}
  return'<p>Uw woning in de zone <strong>'+( zn[s.zone]||s.zone)+'</strong> met een verwarmd volume van <strong>'+s.volume+' m\u00B3</strong> en <strong>'+(ht[s.mainType]||s.mainType)+'</strong> als hoofdverwarming kost naar schatting <strong>'+eur(r.totalCost)+'</strong> per jaar aan energie.</p>'+
    '<p>U bent <strong>'+s.presentDaysWinter+' dagen in de winter</strong> en <strong>'+s.presentDaysSummer+' dagen in de zomer</strong> aanwezig. '+
    (s.winU>3?'<strong>Opvallend:</strong> uw ramen hebben een hoge U-waarde ('+s.winU+'). Dubbel glas zou hier al een groot verschil maken. ':'')+
    (s.roofU>1?'<strong>Tip:</strong> uw dak is matig geïsoleerd (U='+s.roofU+'). Dakisolatie is vaak de meest rendabele investering. ':'')+
    '</p><p style="font-size:.85em;color:var(--text-light)">Dit is een automatische samenvatting. Voor een uitgebreidere analyse, stel uw vraag aan Caf\u00E9 Claude op Infofrankrijk.com.</p>';
}

/* ═══ DOSSIERFRANRKIJK SAVE ═══ */
window.saveToDF=function(){
  var s=window._lastState, r=window._lastResult;
  if(!s||!r){alert('Bereken eerst het resultaat.');return}
  var zn={med:'Middellandse Zee',ouest:'Zuid-West',paris:'Noord/Parijs',centre:'Centraal',est:'Oost',mont:'Bergen'};
  var ht={hp:'Warmtepomp',elec:'Elektrisch',gas:'Gasketel',fioul:'Stookolie',pellet:'Pelletketel',wood:'Houtkachel'};

  // DPE berekenen (conventioneel, dubbele drempel) — terugval op oude schatting.
  var dpeC2=currentDPE(s);
  var kwhM22=dpeC2?dpeC2.perM2.ep:((r.verbruik.heatMain||0)+(r.verbruik.heatAux||0)+(r.verbruik.tapwater||0)+(r.verbruik.koelingEl||0))/Math.max(1,s.floorA||100);
  var dpe2=dpeC2?{letter:dpeC2.classe,index:dpeC2.details.classeIndex}:getDPE(kwhM22);

  var titel='EnergiePortaal rapport \u2014 '+eur(r.totalCost)+'/jaar';

  // Markdown formaat (DF rendert via ReactMarkdown + remarkGfm)
  var nl='\n';
  var inhoud='# Energierapport'+nl+nl+
    '**Geschatte jaarkosten:** '+eur(r.totalCost)+' ('+eur(r.perMonth)+'/maand)'+nl+nl+
    '| | |'+nl+'|---|---|'+nl+
    '| Klimaatzone | '+(zn[s.zone]||s.zone)+' |'+nl+
    '| Volume | '+s.volume+' m\u00B3 |'+nl+
    '| Aanwezig | '+s.presentDaysWinter+' d winter + '+s.presentDaysSummer+' d zomer |'+nl+
    '| Verwarming | '+(ht[s.mainType]||s.mainType)+' |'+nl+nl+
    '## Kostenopbouw'+nl+nl+
    '| Post | Bedrag |'+nl+'|---|---|'+nl+
    '| Verwarming | '+eur(r.costs.verwarming)+' |'+nl+
    '| Warm water | '+eur(r.costs.tapwater)+' |'+nl+
    '| Apparaten | '+eur(r.costs.apparaten)+' |'+nl;
  if(Math.abs(r.costs.koeling)>1) inhoud+='| Koeling | '+eur(r.costs.koeling)+' |'+nl;
  if(Math.abs(r.costs.ev)>1) inhoud+='| EV | '+eur(r.costs.ev)+' |'+nl;
  if(Math.abs(r.costs.zwembad)>1) inhoud+='| Zwembad | '+eur(r.costs.zwembad)+' |'+nl;
  if(Math.abs(r.costs.pvWaarde)>1) inhoud+='| PV besparing | '+eur(r.costs.pvWaarde)+' |'+nl;
  inhoud+='| **Totaal/jaar** | **'+eur(r.totalCost)+'** |'+nl+nl+
    '## Isolatie'+nl+nl+
    '| Onderdeel | Oppervlak | U-waarde |'+nl+'|---|---|---|'+nl+
    '| Muren | '+s.wallA+' m\u00B2 | '+s.wallU+' |'+nl+
    '| Dak | '+s.roofA+' m\u00B2 | '+s.roofU+' |'+nl+
    '| Vloer | '+s.floorA+' m\u00B2 | '+s.floorU+' |'+nl+
    '| Ramen | '+s.winA+' m\u00B2 | '+s.winU+' |'+nl+nl+
    '## Berekening'+nl+nl+
    '- Transmissie: H = '+fmt1(r.debug.UA)+' W/K'+nl+
    '- Ventilatie: H = '+fmt1(r.debug.HventEff)+' W/K'+nl+
    '- Totaal: H = '+fmt1(r.debug.H)+' W/K'+nl+
    '- Warmtevraag: '+fmt0(r.heatDemand)+' kWh/jaar'+nl+nl+
    '## DPE-indicatie'+nl+nl+
    '**Energielabel: '+dpe2.letter+'**'+(dpeC2?' (conventioneel gebruik: 365 dagen, 19 \u00B0C)':'')+nl+nl;
  if(dpeC2){
    inhoud+='| Schaal | Waarde | Klasse |'+nl+'|---|---|---|'+nl+
      '| Primaire energie | '+Math.round(dpeC2.perM2.ep)+' kWh EP/m\u00B2/jaar | '+dpeC2.details.epClasse+' |'+nl+
      '| CO\u2082-uitstoot (GES) | '+fmt1(dpeC2.perM2.ges)+' kg CO\u2082/m\u00B2/jaar | '+dpeC2.details.gesClasse+' |'+nl+
      '| **Eindklasse** | slechtste van beide | **'+dpe2.letter+'** |'+nl+nl;
  } else {
    inhoud+='('+Math.round(kwhM22)+' kWh/m\u00B2 per jaar)'+nl+nl;
  }
  var ban4=VERHUURVERBODEN.find(function(v){return v.letter===dpe2.letter});
  if(ban4) inhoud+='\u26A0\uFE0F **Verhuurverbod:** '+ban4.tekst+nl+nl;
  if(dpe2.index>0){
    var better=DPE_KLASSEN[dpe2.index-1];
    inhoud+='Energieklasse '+better.letter+' bereiken: nog '+Math.round(kwhM22-better.max)+' kWh EP/m\u00B2 besparen.'+nl+nl;
  }
  inhoud+='> \u26D6\uFE0F Indicatie op basis van conventioneel gebruik (365 dagen, 19 \u00B0C) \u2014 dit is geen offici\u00EBle DPE. In Frankrijk is het wettelijk verboden om een document als DPE te presenteren zonder certificering (Loi Climat et R\u00E9silience, Arr\u00EAt\u00E9 du 31 mars 2021).'+nl+nl;

  // Besparingskansen toevoegen aan DF export
  var savingsEl=$('#savingsList');
  if(savingsEl&&savingsEl.children.length>0){
    inhoud+='## Besparingskansen'+nl+nl;
    var totalEl=$('#savingsTotal');
    if(totalEl) inhoud+='**'+totalEl.textContent+'**'+nl+nl;
  }

  // Subsidies
  inhoud+='## Subsidies voor energierenovatie'+nl+nl+
    '- **MaPrimeR\u00E9nov\u2019 Geste** \u2014 eenmalige renovatiemaatregel (isolatie, verwarming, ventilatie)'+nl+
    '- **MaPrimeR\u00E9nov\u2019 Ampleur** \u2014 combinatierenovatie, vereist DPE E/F/G'+(dpe2.index>=4?' **(uw woning komt in aanmerking)**':'')+''+nl+
    '- **CEE** \u2014 premies via uw energieleverancier, cumuleerbaar'+nl+
    '- **\u00C9co-PTZ** \u2014 rentevrije lening tot \u20AC50.000'+nl+
    '- **TVA 5,5%** \u2014 verlaagd btw-tarief op renovatiewerken'+nl+nl+
    '> Sinds 23 feb 2026: afspraak bij France R\u00E9nov\u2019 verplicht v\u00F3\u00F3r elke MPR-aanvraag. De meeste subsidies moeten v\u00F3\u00F3r aanvang van de werken worden aangevraagd.'+nl+nl;

  inhoud+='---'+nl+'*Bronnen: M\u00E9thode 3CL-DPE 2021, ADEME, M\u00E9t\u00E9o France, Infofrankrijk.com \u00B7 Christian von Kl\u00F6sterlein, "Klussen in Frankrijk" \u00B7 Rob van der Meulen, "Warmteverliezen"*';

  // Stuur via pending API (zoals Café Claude)
  var btn=$('#dfSaveBtn');
  if(btn){btn.textContent='Opslaan...';btn.disabled=true}
  fetch('https://dossierfrankrijk.nl/api/pending',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({titel:titel,inhoud:inhoud})
  }).then(function(resp){return resp.json()})
  .then(function(data){
    if(data.id){
      window.open('https://dossierfrankrijk.nl/importeer?id='+data.id,'_blank');
    }else{
      // Fallback: directe URL
      window.open('https://dossierfrankrijk.nl/nieuw?titel='+encodeURIComponent(titel)+'&inhoud='+encodeURIComponent(inhoud),'_blank');
    }
    if(btn){btn.textContent='Opslaan in DossierFrankrijk \u2192';btn.disabled=false}
  }).catch(function(){
    // Fallback: directe URL
    window.open('https://dossierfrankrijk.nl/nieuw?titel='+encodeURIComponent(titel)+'&inhoud='+encodeURIComponent(inhoud),'_blank');
    if(btn){btn.textContent='Opslaan in DossierFrankrijk \u2192';btn.disabled=false}
  });
};

/* ═══ DPE INDICATIE ═══ */
var DPE_KLASSEN=[
  {letter:'A',max:70,  kleur:'#009B4D'},
  {letter:'B',max:110, kleur:'#52B74B'},
  {letter:'C',max:180, kleur:'#C8D400'},
  {letter:'D',max:250, kleur:'#FFED00'},
  {letter:'E',max:330, kleur:'#F5A623'},
  {letter:'F',max:420, kleur:'#E95D0F'},
  {letter:'G',max:Infinity,kleur:'#E3001B'}
];
var VERHUURVERBODEN=[
  {letter:'G',sinds:'1 januari 2025',tekst:'Woningen met label G mogen sinds 1 januari 2025 niet meer verhuurd worden met een nieuw huurcontract.'},
  {letter:'F',sinds:'1 januari 2028',tekst:'Woningen met label F mogen vanaf 1 januari 2028 niet meer verhuurd worden met een nieuw huurcontract.'},
  {letter:'E',sinds:'1 januari 2034',tekst:'Woningen met label E mogen vanaf 1 januari 2034 niet meer verhuurd worden met een nieuw huurcontract.'}
];

function getDPE(kwhM2){
  for(var i=0;i<DPE_KLASSEN.length;i++){
    if(kwhM2<=DPE_KLASSEN[i].max) return{letter:DPE_KLASSEN[i].letter,kleur:DPE_KLASSEN[i].kleur,index:i,kwhM2:kwhM2};
  }
  return{letter:'G',kleur:'#E3001B',index:6,kwhM2:kwhM2};
}

// Conventionele DPE voor de huidige state (los van persoonlijk gebruik).
// Null als engine/dpe.js niet geladen is.
function currentDPE(s){
  if(typeof window.computeDPE!=='function') return null;
  try{ return window.computeDPE(s); }catch(e){ return null; }
}
// Horizontale A–G balk met marker (▼) op de berekende eindklasse.
function dpeHorizontalBar(activeIdx){
  var segs='';
  for(var i=0;i<DPE_KLASSEN.length;i++){
    var k=DPE_KLASSEN[i];var on=i===activeIdx;
    segs+='<div style="flex:1;text-align:center">'+
      '<div style="height:1.4em;line-height:1.4em;font-size:1.1em;color:#333">'+(on?'▼':'')+'</div>'+
      '<div style="background:'+k.kleur+';color:#fff;font-weight:800;font-family:Poppins,sans-serif;padding:9px 0;border-radius:5px;'+
      (on?'transform:scale(1.18);box-shadow:0 0 0 3px #333;position:relative;z-index:1':'opacity:.85')+'">'+k.letter+'</div>'+
    '</div>';
  }
  return '<div style="display:flex;align-items:flex-end;gap:4px">'+segs+'</div>';
}

window.renderDPE=function(){
  var noData=$('#dpeNoData'),content=$('#dpeContent');
  var s=window._lastState,r=window._lastResult;
  var dpeFull=s?currentDPE(s):null;

  // NIEUW DPE-blok (sectie 8, direct onder de kostenopbouw) — conventioneel, dubbele drempel.
  var convBlock=$('#dpeConvBlock');
  if(convBlock&&dpeFull){
    convBlock.style.display='block';
    var cbar=$('#dpeConvBar'); if(cbar) cbar.innerHTML=dpeHorizontalBar(dpeFull.details.classeIndex);
    var cnums=$('#dpeConvNumbers');
    if(cnums){
      var driver=dpeFull.details.drivenBy==='ges'?'CO₂-uitstoot'
                :dpeFull.details.drivenBy==='energie'?'energieverbruik':'energie én CO₂';
      cnums.innerHTML=
        '<div style="flex:1;min-width:150px;padding:10px 12px;background:var(--primary-light);border-radius:8px">'+
          '<div style="font-size:.72em;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px">Primaire energie</div>'+
          '<div style="font-size:1.35em;font-weight:800;font-family:Poppins,sans-serif">'+fmt0(dpeFull.perM2.ep)+' <span style="font-size:.6em;font-weight:600">kWh EP/m²/jr</span></div>'+
          '<div style="font-size:.78em;color:var(--text-light)">Energieklasse '+dpeFull.details.epClasse+'</div>'+
        '</div>'+
        '<div style="flex:1;min-width:150px;padding:10px 12px;background:var(--primary-light);border-radius:8px">'+
          '<div style="font-size:.72em;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px">CO₂-uitstoot</div>'+
          '<div style="font-size:1.35em;font-weight:800;font-family:Poppins,sans-serif">'+fmt1(dpeFull.perM2.ges)+' <span style="font-size:.6em;font-weight:600">kg CO₂/m²/jr</span></div>'+
          '<div style="font-size:.78em;color:var(--text-light)">GES-klasse '+dpeFull.details.gesClasse+'</div>'+
        '</div>'+
        '<div style="flex:1;min-width:150px;padding:10px 12px;background:'+dpeFull.details.kleur+';color:#fff;border-radius:8px">'+
          '<div style="font-size:.72em;opacity:.9;text-transform:uppercase;letter-spacing:.5px">Eindklasse</div>'+
          '<div style="font-size:1.6em;font-weight:800;font-family:Poppins,sans-serif;line-height:1.1">'+dpeFull.classe+'</div>'+
          '<div style="font-size:.75em;opacity:.92">Slechtste van beide (bepaald door '+driver+')</div>'+
        '</div>';
    }
  } else if(convBlock){ convBlock.style.display='none'; }

  // Modal + compact + print delen dezelfde conventionele DPE.
  if(!noData||!content)return;
  if(!s||!r||!dpeFull){noData.style.display='block';content.style.display='none';return}
  noData.style.display='none';content.style.display='block';

  // Marker/afstand op de primaire-energie-as; eindklasse (letter/kleur) = slechtste van energie/GES.
  var floorA=dpeFull.details.shab;
  var kwhM2=dpeFull.perM2.ep;
  var dpe={letter:dpeFull.classe,kleur:dpeFull.details.kleur,index:dpeFull.details.epClasseIndex};

  // Big letter
  var bigEl=$('#dpeBigLetter');
  if(bigEl){bigEl.textContent=dpe.letter;bigEl.style.backgroundColor=dpe.kleur}
  var kwhEl=$('#dpeKwhM2');
  if(kwhEl)kwhEl.textContent=Math.round(kwhM2)+' kWh/m²';

  // DPE scale bars
  var scaleEl=$('#dpeScale');
  if(scaleEl){
    var html='';
    for(var i=0;i<DPE_KLASSEN.length;i++){
      var k=DPE_KLASSEN[i];
      var isCurrent=i===dpe.index;
      var w=35+i*9;
      var maxLabel=k.max===Infinity?'> 420':'\u2264 '+k.max;
      html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'+
        '<div style="height:32px;width:'+w+'%;border-radius:0 8px 8px 0;background:'+k.kleur+';display:flex;align-items:center;padding:0 10px;color:#fff;font-weight:700;font-size:.85em;'+
        (isCurrent?'box-shadow:0 0 0 3px #333,0 0 0 5px rgba(0,0,0,.15);':'opacity:.7;')+'">'+
        k.letter+'<span style="margin-left:auto;font-size:.75em;font-weight:400;opacity:.9">'+maxLabel+'</span></div>'+
        (isCurrent?'<span style="font-weight:700;font-size:.9em">◄ '+Math.round(kwhM2)+' kWh/m²</span>':'')+
        '</div>';
    }
    scaleEl.innerHTML=html;
  }

  // Distance to next class
  var distEl=$('#dpeDistance');
  var distCard=$('#dpeDistanceCard');
  if(distEl&&distCard){
    var txt='';
    if(dpe.index>0){
      var betterClass=DPE_KLASSEN[dpe.index-1];
      var needed=Math.round(kwhM2-betterClass.max);
      txt+='<strong>Klasse '+betterClass.letter+' bereiken:</strong> u moet nog <strong>'+needed+' kWh/m²</strong> besparen (dat is '+Math.round(needed*floorA)+' kWh/jaar totaal).';
    }else{
      txt+='Uw woning valt in de beste energieklasse (A). Uitstekend!';
    }
    if(dpe.index<DPE_KLASSEN.length-1){
      var worseClass=DPE_KLASSEN[dpe.index];
      var margin=Math.round(worseClass.max-kwhM2);
      if(dpe.index>0) txt+='<br><br>';
      txt+='<strong>Marge tot klasse '+(DPE_KLASSEN[dpe.index+1]?DPE_KLASSEN[dpe.index+1].letter:'')+':</strong> u zit '+margin+' kWh/m² onder de grens van '+worseClass.max+' kWh/m².';
    }
    distEl.innerHTML=txt;
    distCard.style.display='block';
  }

  // Rental ban
  var rentalCard=$('#dpeRentalCard');
  var rentalText=$('#dpeRentalText');
  if(rentalCard&&rentalText){
    var ban=VERHUURVERBODEN.find(function(v){return v.letter===dpe.letter});
    if(ban){
      rentalCard.style.display='block';
      rentalText.innerHTML='<strong>'+ban.tekst+'</strong><br><br>Dit geldt voor de <em>passoires thermiques</em> (energielekken) volgens de Loi Climat et Résilience (2021). Als u uw woning verhuurt of wilt verhuren, is renovatie naar minimaal klasse E (vóór 2034: klasse D) vereist.';
    }else if(dpe.letter==='D'||dpe.letter==='E'){
      rentalCard.style.display='block';
      rentalCard.style.background='rgba(245,166,35,0.08)';
      rentalCard.style.borderColor='rgba(245,166,35,0.3)';
      rentalCard.querySelector('h3').style.color='#F5A623';
      rentalCard.querySelector('h3').innerHTML='⚠ Aandachtspunt verhuur';
      rentalText.innerHTML=dpe.letter==='E'?
        'Woningen met label E mogen vanaf <strong>1 januari 2034</strong> niet meer verhuurd worden met een nieuw huurcontract. U hebt nog tijd om te renoveren, maar plan vooruit.':
        'Uw woning valt in klasse D. Momenteel is er geen verhuurverbod, maar de trend is dalend. Overweeg verbeteringen om waardevermindering te voorkomen.';
    }else{
      rentalCard.style.display='none';
    }
  }

  // Compact card in resultaatscherm
  var compactCard=$('#dpeCompactCard');
  var compactLetter=$('#dpeBigLetterCompact');
  var compactText=$('#dpeLetterText');
  var compactKwh=$('#dpeKwhM2Compact');
  var compactRental=$('#dpeRentalCompact');
  if(compactCard){
    compactCard.style.display='block';
    if(compactLetter){compactLetter.textContent=dpe.letter;compactLetter.style.backgroundColor=dpe.kleur}
    if(compactText)compactText.textContent='Klasse '+dpe.letter;
    if(compactKwh)compactKwh.innerHTML=Math.round(kwhM2)+' kWh EP/m² · '+fmt1(dpeFull.perM2.ges)+' kg CO₂/m² per jaar';
    if(compactRental){
      var ban2=VERHUURVERBODEN.find(function(v){return v.letter===dpe.letter});
      if(ban2){compactRental.style.display='block';compactRental.textContent='\u26A0 Verhuurverbod sinds '+ban2.sinds}
      else{compactRental.style.display='none'}
    }
  }

  // Print block (hidden on screen, shown in print CSS)
  var printLetter=$('#dpePrintLetter');
  if(printLetter){
    printLetter.innerHTML='<div style="display:inline-flex;align-items:center;justify-content:center;width:70px;height:70px;border-radius:14px;color:#fff;font-size:2.2em;font-weight:800;font-family:Poppins,sans-serif;background:'+dpe.kleur+'">'+dpe.letter+'</div>'+
      '<div style="font-size:1.35em;font-weight:700;margin-top:8px">'+Math.round(kwhM2)+' kWh EP/m\u00B2 \u00B7 '+fmt1(dpeFull.perM2.ges)+' kg CO\u2082/m\u00B2 per jaar</div>'+
      '<div style="font-size:.85em;color:#666;margin-top:2px">Eindklasse = slechtste van energie ('+dpeFull.details.epClasse+') en CO\u2082 ('+dpeFull.details.gesClasse+')</div>';
  }
  var printScale=$('#dpePrintScale');
  if(printScale){
    var sh='';
    for(var j=0;j<DPE_KLASSEN.length;j++){
      var kk=DPE_KLASSEN[j];var isCur=j===dpe.index;var ww=35+j*9;
      var ml=kk.max===Infinity?'> 420':'\u2264 '+kk.max;
      sh+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">'+
        '<div style="height:26px;width:'+ww+'%;border-radius:0 6px 6px 0;background:'+kk.kleur+';display:flex;align-items:center;padding:0 8px;color:#fff;font-weight:700;font-size:.8em;'+(isCur?'outline:3px solid #333;':'opacity:.6;')+'">'+kk.letter+'<span style="margin-left:auto;font-size:.7em;opacity:.9">'+ml+'</span></div>'+
        (isCur?'<span style="font-weight:700;font-size:.85em">\u25C4 '+Math.round(kwhM2)+' kWh/m\u00B2</span>':'')+
        '</div>';
    }
    printScale.innerHTML=sh;
  }
  var printDist=$('#dpePrintDistance');
  if(printDist&&distEl) printDist.innerHTML=distEl.innerHTML;
  var printRental=$('#dpePrintRental');
  if(printRental&&rentalText){
    var ban3=VERHUURVERBODEN.find(function(v){return v.letter===dpe.letter});
    if(ban3){printRental.style.display='block';printRental.innerHTML='<strong style="color:#dc3545">\u26A0 Verhuurverbod:</strong> '+ban3.tekst}
    else{printRental.style.display='none'}
  }
};

})();

/* ═══════════════════════════════════════════════════════════════
   V3 — INTAKE (gescripte conversational flow) + LIVE DASHBOARD
   Geen LLM: deterministische vraag-antwoordflow met knoppen.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var num=function(v,d){var n=parseFloat(String(v).replace(',','.'));return Number.isFinite(n)?n:(d||0)};
var eur=function(x){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x||0)};

var answers={renovations:[]};
var chat, stepIdx=0;

var FLOW=[
 {id:'zone',q:'Waar in Frankrijk staat de woning?',opts:[
   ['med','Middellandse Zeekust'],['ouest','Zuid-West / Atlantisch'],['paris','Noord / Parijs'],
   ['centre','Centraal Frankrijk'],['est','Oost-Frankrijk'],['mont','Berggebied']]},
 {id:'houseType',q:'Welk type woning is het?',opts:[
   ['longere','Long\u00e8re / fermette'],['village','Dorpswoning (aaneengesloten)'],['maitre','Maison de ma\u00eetre'],
   ['pavillon','Pavillon (vrijstaand)'],['modern','Moderne woning'],['appartement','Appartement']]},
 {id:'period',q:'Uit welke periode stamt de woning (oorspronkelijke bouw)?',opts:[
   ['pre1948','V\u00f3\u00f3r 1948'],['y48_74','1948\u20131974'],['y75_89','1975\u20131989'],
   ['y90_05','1990\u20132005'],['post2005','Na 2005']]},
 {id:'m2',q:'Hoeveel m\u00b2 woonoppervlak (surface habitable)?',type:'number',placeholder:'bijv. 120'},
 {id:'renovations',q:'Zijn er onderdelen al goed gerenoveerd/ge\u00efsoleerd? (meerdere mogelijk)',type:'multi',opts:[
   ['roof','Dak'],['walls','Muren'],['windows','Ramen (HR-glas)'],['floor','Vloer']]},
 {id:'heating',q:'Wat is de hoofdverwarming?',opts:[
   ['hp','Warmtepomp'],['gas','Gasketel'],['fioul','Stookolie'],['wood','Houtkachel'],['pellet','Pelletketel'],['elec','Elektrisch']]},
 {id:'usage',q:'Hoe gebruikt u de woning?',opts:[
   ['permanent','\U0001F3E0 Permanent'],['halftijds','\U0001F3E1 Halftijds'],['zomer','\U0001F334 Zomervakantie'],['winter','\u2744\uFE0F Winterverblijf']]}
];

function bot(html){var b=document.createElement('div');b.className='chat-bubble chat-bot';b.innerHTML=html;chat.appendChild(b);scroll()}
function user(txt){var b=document.createElement('div');b.className='chat-bubble chat-user';b.textContent=txt;chat.appendChild(b);scroll()}
function scroll(){var s=chat.closest('.slide');if(s)s.scrollTop=s.scrollHeight}

function ask(){
  if(stepIdx>=FLOW.length){finishIntake();return}
  var st=FLOW[stepIdx];
  bot(st.q);
  var wrap=document.createElement('div');wrap.className='chat-options';
  if(st.type==='number'){
    wrap.className='chat-num';
    wrap.innerHTML='<input type="number" min="15" max="2000" placeholder="'+(st.placeholder||'')+'"> <button class="chat-opt">OK</button>';
    var inp=wrap.querySelector('input'),ok=wrap.querySelector('button');
    function submit(){var v=num(inp.value,0);if(v<15)return;answers[st.id]=v;wrap.remove();user(v+' m\u00b2');stepIdx++;ask()}
    ok.addEventListener('click',submit);
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')submit()});
    chat.appendChild(wrap);setTimeout(function(){inp.focus()},50);
  } else if(st.type==='multi'){
    var chosen=[];
    st.opts.forEach(function(o){
      var b=document.createElement('button');b.className='chat-opt chip';b.textContent=o[1];
      b.addEventListener('click',function(){
        var i=chosen.indexOf(o[0]);
        if(i>=0){chosen.splice(i,1);b.classList.remove('on')}else{chosen.push(o[0]);b.classList.add('on')}
      });
      wrap.appendChild(b);
    });
    var done=document.createElement('button');done.className='chat-opt';done.style.fontWeight='700';done.textContent='Klaar \u2192';
    done.addEventListener('click',function(){
      answers[st.id]=chosen.slice();wrap.remove();
      user(chosen.length?st.opts.filter(function(o){return chosen.indexOf(o[0])>=0}).map(function(o){return o[1]}).join(', '):'Geen renovaties');
      stepIdx++;ask();
    });
    wrap.appendChild(done);chat.appendChild(wrap);scroll();
  } else {
    st.opts.forEach(function(o){
      var b=document.createElement('button');b.className='chat-opt';b.textContent=o[1];
      b.addEventListener('click',function(){answers[st.id]=o[0];wrap.remove();user(o[1]);stepIdx++;ask()});
      wrap.appendChild(b);
    });
    chat.appendChild(wrap);scroll();
  }
}

function setField(id,val){
  var e=document.getElementById(id);if(!e)return;
  e.value=val;
  e.dispatchEvent(new Event('input',{bubbles:true}));
  e.dispatchEvent(new Event('change',{bubbles:true}));
}

window.finishIntake=function(testAnswers){
  if(testAnswers)answers=testAnswers;
  var pkg=applyArchetype(answers);
  Object.keys(pkg.fields).forEach(function(k){setField(k,pkg.fields[k])});
  // presence-profiel knop activeren op basis van gekozen usage
  var up=window.USAGE_PROFILES&&window.USAGE_PROFILES[answers.usage];
  if(up){document.querySelectorAll('.presence-preset').forEach(function(b){
    b.classList.toggle('active',num(b.dataset.w,-1)===up.winter&&num(b.dataset.s,-1)===up.summer)});}
  if(chat){
    bot('<div class="chat-summary"><strong>Uw startpakket staat klaar.</strong><br>'+pkg.summary.join('<br>')+
      '<br><br>In het overzicht kunt u elke waarde controleren en bijstellen \u2014 de berekening loopt live mee.</div>');
    var go=document.createElement('button');go.className='btn-primary';go.style.alignSelf='center';go.textContent='Naar het overzicht \u2192';
    go.addEventListener('click',function(){window.wizardGoTo('2','main');liveRecalc()});
    chat.appendChild(go);scroll();
  } else { liveRecalc(); }
};

/* ── Live herberekening op het dashboard ── */
var debTimer=null;
function liveRecalc(){
  if(typeof computeAndRender==='function')computeAndRender();
  var r=window._lastResult,s=window._lastState;
  if(!r)return;
  var c=$('#dashCost');if(c)c.textContent=eur(r.totalCost);
  var mo=$('#dashMonth');if(mo)mo.textContent=eur(r.perMonth)+' per maand';
  var d=null;
  try{ if(typeof computeDPE==='function'&&s) d=computeDPE(s); }catch(e){}
  var badge=$('#dashDPE');
  if(badge&&d){
    var KL={A:'#009B4D',B:'#52B74B',C:'#C8D400',D:'#FFED00',E:'#F5A623',F:'#E95D0F',G:'#E30613'};
    badge.textContent=d.classe;
    badge.style.background=KL[d.classe]||'#999';
    badge.style.color=(d.classe==='C'||d.classe==='D')?'#333':'#fff';
    var sub=$('#dashDPESub');if(sub)sub.textContent=Math.round(d.perM2.ep)+' kWh EP/m\u00b2 \u00b7 '+d.perM2.ges.toFixed(1)+' kg CO\u2082/m\u00b2';
  }
}
window.liveRecalc=liveRecalc;

document.addEventListener('DOMContentLoaded',function(){
  chat=document.getElementById('intakeChat');
  if(chat){bot('Welkom! Ik stel u zes korte vragen en zet daarna een compleet startpakket voor uw woning klaar.');ask()}
  var dash=document.querySelector('.slide[data-section="2"]');
  if(dash)['input','change'].forEach(function(ev){
    dash.addEventListener(ev,function(){clearTimeout(debTimer);debTimer=setTimeout(liveRecalc,250)});
  });
});
})();
