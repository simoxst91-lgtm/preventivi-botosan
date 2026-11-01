const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  salvaPdf: (payload) => ipcRenderer.invoke('salva-pdf', payload),
  apriArchivio: () => ipcRenderer.invoke('apri-archivio'),
  apriCartella: (p) => ipcRenderer.invoke('apri-cartella', p),
  contatore: () => ipcRenderer.invoke('contatore'),
  elencoArchivio: () => ipcRenderer.invoke('elenco-archivio'),
  apriFile: (p) => ipcRenderer.invoke('apri-file', p),
  salvaBozza: (d) => ipcRenderer.invoke('salva-bozza', d),
  elencoBozze: () => ipcRenderer.invoke('elenco-bozze'),
  eliminaBozza: (id) => ipcRenderer.invoke('elimina-bozza', id),

  // aggiornamenti
  versioneApp: () => ipcRenderer.invoke('versione-app'),
  controllaAggiornamenti: () => ipcRenderer.invoke('agg-controlla'),
  installaAggiornamento: () => ipcRenderer.invoke('agg-installa'),
  suStatoAggiornamento: (cb) =>
    ipcRenderer.on('agg-stato', (_e, dati) => cb(dati))
});
