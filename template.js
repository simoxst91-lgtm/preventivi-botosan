/* Template di stampa del preventivo (usato per generare il PDF) */
function dataIt(iso){if(!iso)return '';const p=iso.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:iso;}
const LOGO=()=> (typeof logoDataUrl!=='undefined'&&logoDataUrl)?logoDataUrl:'';
const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function templateStampa(d) {
  const box = (v) => `<div class="b">${esc(v)}</div>`;
  const campo = (lab, v, cls = '') =>
    `<div class="campo ${cls}"><span class="lab">${lab}</span>${box(v)}</div>`;

  const spunta = (on) => `<span class="sq">${on ? '&#10003;' : ''}</span>`;

  const serviziHtml = (d.servizi || [])
    .map((s) => `<div class="srv">${spunta(s.attivo)} ${esc(s.testo)}</div>`)
    .join('');

  const tipi = ['Abitazione', 'Ufficio / studio', 'Negozio', 'Altro'];
  const tipiHtml = tipi
    .map((t) => `<span class="tp">${spunta(d.tipologia === t)} ${t}</span>`)
    .join('');

  const righeHtml = (d.righe || [])
    .map(
      (r) => `<tr>
        <td>${esc(r.desc)}</td>
        <td class="c">${esc(r.qta)}</td>
        <td class="c">${esc(r.prezzo)}</td>
        <td class="c">${esc(r.sconto)}</td>
        <td class="r">${esc(r.tot)}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#1b2a4a;font-size:8.5pt}
  .pag{width:210mm;padding:9mm 11mm 7mm}
  .head{display:flex;align-items:center;gap:8mm;border-bottom:2px solid #1b2a4a;padding-bottom:4mm}
  .head img{width:56mm;height:auto}
  .head .ht{font-size:9pt;font-weight:bold;letter-spacing:1px}
  .head .hs{font-size:7.5pt;color:#5a6b86;line-height:1.5;margin-top:2mm}
  .titolo{display:flex;align-items:baseline;justify-content:space-between;margin:4mm 0 2mm}
  h1{font-size:21pt;margin:0;letter-spacing:1px}
  .sub{font-size:7pt;color:#5a6b86;letter-spacing:.6px}
  h2{background:#eef2f8;border-left:4px solid #1b2a4a;font-size:8pt;letter-spacing:.6px;
     padding:1.4mm 3mm;margin:3.5mm 0 2.5mm}
  .lab{display:block;font-size:6.5pt;color:#5a6b86;letter-spacing:.4px;font-weight:bold;margin-bottom:.8mm}
  .b{border:1px solid #c9d4e4;border-radius:1.2mm;min-height:6.5mm;padding:1.4mm 2mm;font-size:9pt}
  .riga{display:flex;gap:4mm;margin-bottom:2mm}
  .campo{flex:1}
  .w-pic{flex:0 0 22mm}
  .w-asc{flex:0 0 26mm;align-self:flex-end;padding-bottom:1.8mm;font-size:8pt}
  .sq{display:inline-block;width:3.2mm;height:3.2mm;border:1px solid #8a9ab5;
      text-align:center;line-height:3mm;font-size:7pt;vertical-align:-.5mm;margin-right:1mm}
  .tp{margin-right:9mm;font-size:8pt}
  .srvbox{display:flex;flex-wrap:wrap}
  .srv{width:33.33%;font-size:8pt;padding:1mm 0}
  table{width:100%;border-collapse:collapse;margin-top:1mm}
  th{background:#1b2a4a;color:#fff;font-size:6.8pt;letter-spacing:.4px;padding:1.8mm 2mm;text-align:left}
  td{border:1px solid #c9d4e4;padding:1.3mm 2mm;font-size:8.5pt;height:6.2mm}
  td.c{text-align:center}td.r{text-align:right;font-weight:bold}
  th.n{width:20mm;text-align:center}
  .mini{font-size:6.5pt;color:#7a8aa3;margin:1.2mm 0 0}
  .firme{display:flex;gap:6mm;margin-top:5mm}
  .firme>div{flex:1}
  .fb{border-bottom:1px solid #8a9ab5;height:9mm}
</style></head><body><div class="pag" id="pag">

<div class="head">
  ${LOGO() ? `<img src="${LOGO()}">` : ''}
  <div>
    <div class="ht">TRASLOCHI &nbsp;&bull;&nbsp; TRASPORTI &nbsp;&bull;&nbsp; DEPOSITO &nbsp;&bull;&nbsp; SERVIZI PER LA CASA</div>
    <div class="hs">Via G. Marconi, 12 &ndash; 20065 Inzago (MI) &nbsp;|&nbsp; P. IVA 11532420962<br>
    info@botosanmultiservizi.it &nbsp;|&nbsp; 350 589 6017 &nbsp;&bull;&nbsp; 329 184 6530<br>
    www.botosanmultiservizi.it</div>
  </div>
</div>

<div class="titolo"><h1>PREVENTIVO</h1><div class="sub">TRASLOCHI E SERVIZI</div></div>

<div class="riga">
  ${campo('N. PREVENTIVO', d.numero)}
  ${campo('DATA', dataIt(d.data))}
  ${campo('VALIDITÀ', d.validita)}
  ${campo('DATA INTERVENTO', d.dataIntervento)}
</div>

<h2>1. DATI CLIENTE</h2>
<div class="riga">
  ${campo('NOME / AZIENDA', d.cliente)}
  ${campo('TELEFONO', d.telefono)}
  ${campo('E-MAIL', d.email)}
</div>
<div class="riga">
  ${campo('INDIRIZZO DI PARTENZA', d.partenza)}
  ${campo('PIANO', d.pianoP, 'w-pic')}
  <div class="w-asc">${spunta(d.ascP)} Ascensore</div>
</div>
<div class="riga">
  ${campo('INDIRIZZO DI DESTINAZIONE', d.destinazione)}
  ${campo('PIANO', d.pianoD, 'w-pic')}
  <div class="w-asc">${spunta(d.ascD)} Ascensore</div>
</div>

<h2>2. DETTAGLI DEL TRASLOCO</h2>
<div style="margin-bottom:2.5mm"><span class="lab" style="display:inline;margin-right:6mm">TIPOLOGIA</span>${tipiHtml}</div>
${campo('DISTANZA / NOTE ACCESSO', d.distanza)}

<h2>3. SERVIZI RICHIESTI</h2>
<div class="srvbox">${serviziHtml}</div>

<h2>4. DESCRIZIONE E COSTI</h2>
<table>
  <tr><th>DESCRIZIONE SERVIZIO</th><th class="n">Q.TÀ</th><th class="n">PREZZO UNIT. €</th>
      <th class="n">SCONTO €</th><th class="n">TOTALE €</th></tr>
  ${righeHtml}
</table>
<div class="riga" style="margin-top:3mm">
  ${campo('IMPONIBILE €', d.imponibile)}
  ${campo('IVA %', d.ivaPerc)}
  ${campo('IVA €', d.ivaVal)}
  ${campo('TOTALE €', d.totale)}
</div>
<div class="riga">
  ${campo('ACCONTO €', d.acconto)}
  ${campo('SALDO €', d.saldo)}
  ${campo('PAGAMENTO', d.pagamento)}
</div>

<h2>5. NOTE, ESCLUSIONI E CONDIZIONI</h2>
<div class="b" style="min-height:13mm;white-space:pre-wrap">${esc(d.note)}</div>
<p class="mini">Importi e aliquota IVA da verificare in base al servizio concordato e al regime fiscale applicabile.</p>
<p class="mini">Permessi, soste, materiali extra, deposito e smaltimenti sono inclusi solo se indicati nel preventivo.</p>

<div class="firme">
  <div><span class="lab">ACCETTAZIONE CLIENTE</span><div class="fb"></div></div>
  <div><span class="lab">FIRMA CLIENTE</span><div class="fb"></div></div>
  <div><span class="lab">FIRMA AZIENDA</span><div class="fb"></div></div>
</div>

</div></body></html>`;
}

if (typeof module !== 'undefined') module.exports = { templateStampa };
