const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// ---- Cartella archivio in AppData -------------------------------------------
// Windows: C:\Users\<utente>\AppData\Roaming\Preventivi Botosan\Archivio
function cartellaArchivio() {
  const dir = path.join(app.getPath('userData'), 'Archivio');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
              'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

// Ogni mese ha la sua sottocartella:  Archivio\2026-11 Novembre
function cartellaMese(d = new Date()) {
  const nome = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} ${MESI[d.getMonth()]}`;
  const dir = path.join(cartellaArchivio(), nome);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ---- Contatore progressivo dei preventivi -----------------------------------
function fileContatore() {
  return path.join(app.getPath('userData'), 'contatore.json');
}

function leggiContatore() {
  try {
    return JSON.parse(fs.readFileSync(fileContatore(), 'utf8'));
  } catch (_) {
    return {};
  }
}

function numeroProssimo() {
  const anno = new Date().getFullYear();
  const c = leggiContatore();
  const ultimo = c[anno] || 0;
  return {
    anno,
    progressivo: ultimo + 1,
    numero: `${anno}-${String(ultimo + 1).padStart(3, '0')}`,
    emessiAnno: ultimo
  };
}

function avanzaContatore() {
  const anno = new Date().getFullYear();
  const c = leggiContatore();
  c[anno] = (c[anno] || 0) + 1;
  fs.writeFileSync(fileContatore(), JSON.stringify(c, null, 2));
  return c[anno];
}

let win;

function creaFinestra() {
  win = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 900,
    title: 'Preventivi Botosan Multiservizi',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

// ---- Aggiornamento automatico (GitHub Releases) ------------------------------
// Il programma controlla da solo se esiste una versione piu' recente,
// la scarica in background e la installa alla chiusura.
function versoRenderer(canale, dati) {
  if (win && !win.isDestroyed()) win.webContents.send(canale, dati);
}

function configuraAggiornamenti() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () =>
    versoRenderer('agg-stato', { stato: 'controllo' })
  );
  autoUpdater.on('update-available', (info) =>
    versoRenderer('agg-stato', { stato: 'disponibile', versione: info.version })
  );
  autoUpdater.on('update-not-available', () =>
    versoRenderer('agg-stato', { stato: 'aggiornato', versione: app.getVersion() })
  );
  autoUpdater.on('download-progress', (p) =>
    versoRenderer('agg-stato', { stato: 'download', percento: Math.round(p.percent) })
  );
  autoUpdater.on('update-downloaded', (info) =>
    versoRenderer('agg-stato', { stato: 'pronto', versione: info.version })
  );
  autoUpdater.on('error', (err) =>
    versoRenderer('agg-stato', { stato: 'errore', messaggio: String(err && err.message) })
  );

  // controllo all'avvio e poi ogni 4 ore
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(() => {});
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
  }
}

ipcMain.handle('agg-controlla', async () => {
  if (!app.isPackaged) return { stato: 'sviluppo', versione: app.getVersion() };
  try {
    await autoUpdater.checkForUpdates();
    return { stato: 'controllo' };
  } catch (e) {
    return { stato: 'errore', messaggio: String(e.message) };
  }
});

ipcMain.handle('agg-installa', async () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('versione-app', async () => app.getVersion());

app.whenReady().then(() => {
  cartellaArchivio();
  creaFinestra();
  configuraAggiornamenti();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creaFinestra();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- Generazione PDF ---------------------------------------------------------
function nomeFileSicuro(s) {
  return String(s || '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

ipcMain.handle('salva-pdf', async (_e, { html, numero, cliente }) => {
  // Finestra nascosta che contiene SOLO la versione stampabile del preventivo
  const stampa = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true }
  });

  await stampa.loadURL(
    'data:text/html;charset=utf-8,' + encodeURIComponent(html)
  );
  // piccolo margine perché i font/immagini finiscano di caricare
  await new Promise((r) => setTimeout(r, 400));

  // se il preventivo ha molte righe, riduce leggermente la scala
  // in modo che stia comunque in una sola pagina A4
  await stampa.webContents.executeJavaScript(`(() => {
    const p = document.getElementById('pag');
    if (!p) return 1;
    const max = 1122;                       // altezza A4 in px a 96dpi
    const h = p.scrollHeight;
    if (h > max) { p.style.zoom = max / h; return max / h; }
    return 1;
  })()`);
  await new Promise((r) => setTimeout(r, 150));

  const pdf = await stampa.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  stampa.destroy();

  const data = new Date();
  const stamp =
    data.getFullYear() +
    String(data.getMonth() + 1).padStart(2, '0') +
    String(data.getDate()).padStart(2, '0');

  const base = nomeFileSicuro(
    `Preventivo_${numero || 'senza-numero'}_${cliente || 'cliente'}`
  );

  // 1) copia di archivio in AppData, nella cartella del mese (sempre, automatica)
  const fileArchivio = path.join(cartellaMese(data), `${stamp}_${base}.pdf`);
  fs.writeFileSync(fileArchivio, pdf);

  // il preventivo e' stato emesso: avanza il contatore progressivo
  avanzaContatore();

  // 2) copia scelta dall'utente
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Salva preventivo',
    defaultPath: path.join(app.getPath('documents'), `${base}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, pdf);
    return { ok: true, percorso: filePath, archivio: fileArchivio };
  }
  return { ok: true, percorso: null, archivio: fileArchivio };
});

// ---- Archivio ----------------------------------------------------------------
ipcMain.handle('apri-archivio', async () => {
  await shell.openPath(cartellaArchivio());
  return cartellaArchivio();
});

// Storico diviso per mese: restituisce l'elenco dei mesi con i loro PDF
ipcMain.handle('elenco-archivio', async () => {
  const base = cartellaArchivio();
  const mesi = [];

  const leggiPdf = (dir) =>
    fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((f) => {
        const st = fs.statSync(path.join(dir, f));
        return { nome: f, data: st.mtime.getTime(), percorso: path.join(dir, f) };
      })
      .sort((a, b) => b.data - a.data);

  for (const voce of fs.readdirSync(base, { withFileTypes: true })) {
    if (!voce.isDirectory()) continue;
    const file = leggiPdf(path.join(base, voce.name));
    if (file.length) mesi.push({ mese: voce.name, cartella: path.join(base, voce.name), file });
  }

  // vecchi PDF rimasti nella cartella principale (archivi precedenti)
  const sciolti = leggiPdf(base);
  if (sciolti.length)
    mesi.push({ mese: 'Senza mese', cartella: base, file: sciolti });

  mesi.sort((a, b) => b.mese.localeCompare(a.mese));
  return mesi;
});

ipcMain.handle('apri-cartella', async (_e, percorso) => {
  await shell.openPath(percorso || cartellaArchivio());
});

ipcMain.handle('contatore', async () => numeroProssimo());

ipcMain.handle('apri-file', async (_e, percorso) => {
  await shell.openPath(percorso);
});

// ---- Bozze (salva/riapri i dati del form) ------------------------------------
function fileBozze() {
  return path.join(app.getPath('userData'), 'bozze.json');
}

ipcMain.handle('salva-bozza', async (_e, dati) => {
  let bozze = [];
  try {
    bozze = JSON.parse(fs.readFileSync(fileBozze(), 'utf8'));
  } catch (_) {}
  bozze.unshift({ id: Date.now(), dati });
  fs.writeFileSync(fileBozze(), JSON.stringify(bozze.slice(0, 100), null, 2));
  return true;
});

ipcMain.handle('elenco-bozze', async () => {
  try {
    return JSON.parse(fs.readFileSync(fileBozze(), 'utf8'));
  } catch (_) {
    return [];
  }
});

ipcMain.handle('elimina-bozza', async (_e, id) => {
  let bozze = [];
  try {
    bozze = JSON.parse(fs.readFileSync(fileBozze(), 'utf8'));
  } catch (_) {}
  bozze = bozze.filter((b) => b.id !== id);
  fs.writeFileSync(fileBozze(), JSON.stringify(bozze, null, 2));
  return true;
});
