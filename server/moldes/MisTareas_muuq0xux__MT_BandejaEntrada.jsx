/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const [tareas, setTareas] = useState([]);
  const [nueva, setNueva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`);
    if (res.ok) setTareas(res.registros.filter(t => t.completada === 0 && !t.fecha && !t.proyecto_id && !t.tarea_padre_id) || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async (e) => {
    e.preventDefault();
    if (!nueva.trim()) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'tar_' + Date.now(),
        usuario_id: uid,
        titulo: nueva.trim(),
        completada: 0,
        fecha_registro: new Date().toISOString()
      })
    }, {
      alLograr: () => { setNueva(''); cargar(); },
      alFallar: setError
    });
  };

  const abrirTarea = async (id) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_estado_ui')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'estado_' + uid, usuario_id: uid, tarea_activa_id: id })
    }, {
      alLograr: () => MEITI.irAPagina('detalle_tarea'),
      alFallar: setError
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <h2 className="text-2xl font-black px-2" style={{ color: tema.texto }}>{MEITI.t('inbox', null, 'Bandeja de Entrada')}</h2>
      
      <UI.Tarjeta className="p-4 rounded-3xl">
        <form onSubmit={agregar} className="flex items-center gap-2">
          <div className="flex-1">
            <UI.Campo tipo="text" valor={nueva} onChange={e => setNueva(e.target.value)} placeholder={MEITI.t('add_quick_task', null, 'Añadir tarea rápida...')} />
          </div>
          <button type="submit" aria-label={MEITI.t('send', null, 'Enviar')} className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95" style={{ backgroundColor: tema.colorPrimario, color: '#fff' }}>
            <Iconos.Send size={20} />
          </button>
        </form>
      </UI.Tarjeta>

      {cargando ? <div className="text-center p-4"><Iconos.Loader className="animate-spin mx-auto" color={tema.colorPrimario} /></div> : (
        <div className="flex flex-col gap-2">
          {tareas.length === 0 ? (
            <UI.EstadoVacio icono="fa-inbox" mensaje={MEITI.t('empty_inbox', null, 'Tu bandeja está vacía. Todo está organizado.')} />
          ) : (
            tareas.map(t => (
              <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={t.id} className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: tema.superficie }} onClick={() => abrirTarea(t.id)}>
                <Iconos.Circle size={20} color={tema.texto} className="opacity-30 shrink-0" />
                <p className="font-bold text-sm flex-1 truncate" style={{ color: tema.texto }}>{t.titulo}</p>
                <Iconos.ChevronRight size={16} color={tema.texto} className="opacity-30 shrink-0" />
              </Animacion.motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}