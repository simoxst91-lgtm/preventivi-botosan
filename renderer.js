/* ===========================================================
   Preventivi Botosan Multiservizi - logica interfaccia
   =========================================================== */

const SERVIZI_DEFAULT = [
  'Sopralluogo / pianificazione',
  'Smontaggio e rimontaggio mobili',
  'Imballaggio / scatole',
  'Trasporto e movimentazione',
  'Autoscala / piattaforma aerea',
  'Deposito / custodia',
  'Sgombero e smaltimento',
  'Pulizie post-cantiere',
  'Montaggi / lavori extra'
];

const $ = (id) => document.getElementById(id);
const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
const eur = (n) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let logoDataUrl = '';

/* ---------- SERVIZI (checkbox, aggiungibili) ---------- */
function aggiungiServizio(testo, spuntato = false) {
  const div = document.createElement('div');
  div.className = 'voce';
  const id = 'srv' + Math.random().toString(36).slice(2, 8);
  div.innerHTML =
    `<input type="checkbox" id="${id}" ${spuntato ? 'checked' : ''}>` +
    `<label for="${id}" class="chk" style="flex:1">${testo}</label>` +
    `<button title="Rimuovi">&times;</button>`;
  div.querySelector('button').onclick = () => div.remove();
  div.dataset.testo = testo;
  $('servizi').appendChild(div);
}

function caricaServiziDefault() {
  $('servizi').innerHTML = '';
  SERVIZI_DEFAULT.forEach((s) => aggiungiServizio(s));
}

$('btn-add-servizio').onclick = () => {
  const t = $('nuovoServizio').value.trim();
  if (!t) return;
  aggiungiServizio(t, true);
  $('nuovoServizio').value = '';
};
$('nuovoServizio').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('btn-add-servizio').click();
});

/* ---------- RIGHE COSTI (riquadri aggiungibili) ---------- */
function aggiungiRiga(d = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="r-desc" value="${d.desc || ''}"></td>
    <td><input type="number" class="r-qta" step="0.01" value="${d.qta ?? ''}"></td>
    <td><input type="number" class="r-prezzo" step="0.01" value="${d.prezzo ?? ''}"></td>
    <td><input type="number" class="r-sconto" step="0.01" value="${d.sconto ?? ''}"></td>
    <td><input type="text" class="r-tot tot-cella" readonly></td>
    <td><button class="btn-del" title="Elimina riga">&times;</button></td>`;
  tr.querySelector('.btn-del').onclick = () => {
    tr.remove();
    ricalcola();
  };
  tr.querySelectorAll('input').forEach((i) => i.addEventListener('input', ricalcola));
  $('righe').appendChild(tr);
  ricalcola();
}

$('btn-add-riga').onclick = () => aggiungiRiga();

/* ---------- CALCOLI ---------- */
function ricalcola() {
  let imponibile = 0;
  $('righe').querySelectorAll('tr').forEach((tr) => {
    const q = num(tr.querySelector('.r-qta').value);
    const p = num(tr.querySelector('.r-prezzo').value);
    const s = num(tr.querySelector('.r-sconto').value);
    const t = Math.max(0, q * p - s);
    tr.querySelector('.r-tot').value = q || p ? eur(t) : '';
    imponibile += t;
  });
  const perc = num($('ivaPerc').value);
  const iva = imponibile * perc / 100;
  const totale = imponibile + iva;
  const acconto = num($('acconto').value);

  $('imponibile').value = eur(imponibile);
  $('ivaVal').value = eur(iva);
  $('totale').value = eur(totale);
  $('saldo').value = eur(totale - acconto);
}
['ivaPerc', 'acconto'].forEach((id) => $(id).addEventListener('input', ricalcola));

/* ---------- RACCOLTA DATI ---------- */
function leggiDati() {
  const righe = [...$('righe').querySelectorAll('tr')].map((tr) => ({
    desc: tr.querySelector('.r-desc').value,
    qta: tr.querySelector('.r-qta').value,
    prezzo: tr.querySelector('.r-prezzo').value,
    sconto: tr.querySelector('.r-sconto').value,
    tot: tr.querySelector('.r-tot').value
  }));
  const servizi = [...$('servizi').querySelectorAll('.voce')].map((v) => ({
    testo: v.dataset.testo,
    attivo: v.querySelector('input').checked
  }));
  const tipo = document.querySelector('input[name=tipologia]:checked');
  return {
    numero: $('numero').value, data: $('data').value, validita: $('validita').value,
    dataIntervento: $('dataIntervento').value,
    cliente: $('cliente').value, telefono: $('telefono').value, email: $('email').value,
    partenza: $('partenza').value, pianoP: $('pianoP').value, ascP: $('ascP').checked,
    destinazione: $('destinazione').value, pianoD: $('pianoD').value, ascD: $('ascD').checked,
    tipologia: tipo ? tipo.value : '', distanza: $('distanza').value,
    servizi, righe,
    imponibile: $('imponibile').value, ivaPerc: $('ivaPerc').value,
    ivaVal: $('ivaVal').value, totale: $('totale').value,
    acconto: $('acconto').value ? eur(num($('acconto').value)) : '', saldo: $('saldo').value, pagamento: $('pagamento').value,
    note: $('note').value
  };
}

function scriviDati(d) {
  ['numero','data','validita','dataIntervento','cliente','telefono','email',
   'partenza','pianoP','destinazione','pianoD','distanza','ivaPerc','acconto',
   'pagamento','note'].forEach((k) => { if ($(k)) $(k).value = d[k] ?? ''; });
  $('ascP').checked = !!d.ascP;
  $('ascD').checked = !!d.ascD;
  document.querySelectorAll('input[name=tipologia]').forEach((r) => {
    r.checked = r.value === d.tipologia;
  });
  $('servizi').innerHTML = '';
  (d.servizi || []).forEach((s) => aggiungiServizio(s.testo, s.attivo));
  $('righe').innerHTML = '';
  (d.righe || []).forEach((r) => aggiungiRiga(r));
  if (!(d.righe || []).length) for (let i = 0; i < 4; i++) aggiungiRiga();
  ricalcola();
}

/* ---------- AZIONI ---------- */
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), 4000);
}

$('btn-pdf').onclick = async () => {
  const d = leggiDati();
  const res = await window.api.salvaPdf({
    html: templateStampa(d),
    numero: d.numero,
    cliente: d.cliente
  });
  toast(
    res.percorso
      ? 'PDF salvato. Copia di sicurezza nell’archivio del programma.'
      : 'Salvataggio annullato: resta comunque la copia nell’archivio del programma.'
  );
};

$('btn-bozza').onclick = async () => {
  await window.api.salvaBozza(leggiDati());
  toast('Bozza salvata.');
};

$('btn-nuovo').onclick = () => {
  if (!confirm('Svuotare il modulo e iniziare un nuovo preventivo?')) return;
  nuovoModulo();
};

function nuovoModulo() {
  document.querySelectorAll('input[type=text],input[type=number],textarea').forEach((i) => {
    if (!i.readOnly) i.value = '';
  });
  document.querySelectorAll('input[type=checkbox],input[type=radio]').forEach((i) => (i.checked = false));
  $('validita').value = '30 giorni';
  $('ivaPerc').value = 22;
  $('data').valueAsDate = new Date();
  caricaServiziDefault();
  $('righe').innerHTML = '';
  for (let i = 0; i < 4; i++) aggiungiRiga();
  ricalcola();
}

/* ---------- ARCHIVIO ---------- */
$('btn-archivio').onclick = async () => {
  $('overlay').classList.remove('hidden');
  mostraTab('pdf');
};
$('btn-chiudi').onclick = () => $('overlay').classList.add('hidden');
$('btn-cartella').onclick = () => window.api.apriArchivio();
document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => mostraTab(t.dataset.tab);
});

async function mostraTab(tab) {
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('attiva', t.dataset.tab === tab)
  );
  $('lista-pdf').classList.toggle('hidden', tab !== 'pdf');
  $('lista-bozze').classList.toggle('hidden', tab !== 'bozze');

  if (tab === 'pdf') {
    const files = await window.api.elencoArchivio();
    $('lista-pdf').innerHTML = files.length
      ? ''
      : '<div class="vuoto">Nessun preventivo in archivio.</div>';
    files.forEach((f) => {
      const d = document.createElement('div');
      d.className = 'voce-file';
      d.innerHTML = `<span>${f.nome}</span>`;
      const b = document.createElement('button');
      b.className = 'btn ghost small';
      b.textContent = 'Apri';
      b.onclick = () => window.api.apriFile(f.percorso);
      d.appendChild(b);
      $('lista-pdf').appendChild(d);
    });
  } else {
    const bozze = await window.api.elencoBozze();
    $('lista-bozze').innerHTML = bozze.length
      ? ''
      : '<div class="vuoto">Nessuna bozza salvata.</div>';
    bozze.forEach((b) => {
      const d = document.createElement('div');
      d.className = 'voce-file';
      const et = new Date(b.id).toLocaleString('it-IT');
      d.innerHTML = `<span>${b.dati.numero || 's.n.'} &ndash; ${b.dati.cliente || 'senza cliente'} <em style="color:#8a97ad">(${et})</em></span>`;
      const apri = document.createElement('button');
      apri.className = 'btn ghost small';
      apri.textContent = 'Carica';
      apri.onclick = () => {
        scriviDati(b.dati);
        $('overlay').classList.add('hidden');
        toast('Bozza caricata.');
      };
      const del = document.createElement('button');
      del.className = 'btn ghost small';
      del.textContent = 'Elimina';
      del.onclick = async () => {
        await window.api.eliminaBozza(b.id);
        mostraTab('bozze');
      };
      d.append(apri, del);
      $('lista-bozze').appendChild(d);
    });
  }
}

/* ---------- AGGIORNAMENTI ---------- */
let versioneCorrente = '';

function mostraAgg(classe, testo, titolo) {
  const box = $('agg-box');
  box.className = 'agg' + (classe ? ' ' + classe : '');
  $('agg-testo').textContent = testo;
  box.title = titolo || testo;
}

$('agg-box').onclick = async () => {
  const r = await window.api.controllaAggiornamenti();
  if (r.stato === 'sviluppo') {
    toast('Controllo aggiornamenti attivo solo nella versione installata.');
    return;
  }
  if (r.stato === 'errore') {
    mostraAgg('errore', 'Aggiornamenti non raggiungibili');
    toast('Impossibile contattare GitHub: ' + r.messaggio);
  }
};

window.api.suStatoAggiornamento((d) => {
  switch (d.stato) {
    case 'controllo':
      mostraAgg('lavoro', 'Controllo…');
      break;
    case 'disponibile':
      mostraAgg('lavoro', 'Nuova versione ' + d.versione, 'Scaricamento in corso');
      toast('Disponibile la versione ' + d.versione + ': scaricamento in corso.');
      break;
    case 'download':
      mostraAgg('lavoro', 'Scarico ' + d.percento + '%');
      break;
    case 'pronto':
      mostraAgg('pronto', 'Installa v' + d.versione, 'Clicca per riavviare e aggiornare');
      $('agg-box').onclick = () => window.api.installaAggiornamento();
      toast('Aggiornamento pronto: clicca "Installa" in alto a destra.');
      break;
    case 'aggiornato':
      mostraAgg('', 'v' + versioneCorrente, 'Programma aggiornato');
      break;
    case 'errore':
      mostraAgg('errore', 'v' + versioneCorrente, 'Aggiornamenti non raggiungibili');
      break;
  }
});

/* ---------- AVVIO ---------- */
(async function init() {
  // logo in base64 per poterlo incorporare nel PDF
  try {
    const r = await fetch('assets/logo.png');
    const blob = await r.blob();
    logoDataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });
  } catch (_) {}

  versioneCorrente = await window.api.versioneApp();
  mostraAgg('', 'v' + versioneCorrente, 'Clicca per controllare gli aggiornamenti');

  nuovoModulo();
})();
