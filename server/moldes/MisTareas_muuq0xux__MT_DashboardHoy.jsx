/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const [tareas, setTareas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const [resTareas, resPrio] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('mt_prioridades')}?ecosistema=${eco}`)
    ]);
    if (resTareas.ok) setTareas(resTareas.registros || []);
    if (resPrio.ok) setPrioridades(resPrio.registros || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const completarTarea = async (tarea) => {
    const mutaciones = [];
    const hoy = new Date().toISOString().split('T')[0];
    
    mutaciones.push({
      url: `/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${tarea.id}`,
      opciones: {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tarea, completada: 1, fecha_completada: hoy })
      }
    });

    if (tarea.regla_repeticion && tarea.regla_repeticion !== 'none') {
      let nuevaFecha = new Date(tarea.fecha || hoy);
      if (tarea.regla_repeticion === 'diaria') nuevaFecha.setDate(nuevaFecha.getDate() + 1);
      else if (tarea.regla_repeticion === 'semanal') nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      else if (tarea.regla_repeticion === 'mensual') nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      
      mutaciones.push({
        url: `/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`,
        opciones: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...tarea,
            id: 'tar_' + Date.now(),
            completada: 0,
            fecha_completada: null,
            fecha: nuevaFecha.toISOString().split('T')[0],
            fecha_registro: new Date().toISOString()
          })
        }
      });
    }

    await MEITI.mutarVarias(mutaciones, {
      alLograr: cargar,
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

  const hoyStr = new Date().toISOString().split('T')[0];
  const tareasHoy = tareas.filter(t => t.fecha === hoyStr && t.completada === 0 && !t.tarea_padre_id);
  const tareasAtrasadas = tareas.filter(t => t.fecha && t.fecha < hoyStr && t.completada === 0 && !t.tarea_padre_id);
  const completadasHoy = tareas.filter(t => t.fecha_completada === hoyStr && t.completada === 1).length;

  const getPrioLevel = (id) => {
    const p = prioridades.find(x => x.id === id);
    return p ? Number(p.nivel) : 99;
  };
  
  tareasHoy.sort((a, b) => getPrioLevel(a.prioridad_id) - getPrioLevel(b.prioridad_id));
  tareasAtrasadas.sort((a, b) => getPrioLevel(a.prioridad_id) - getPrioLevel(b.prioridad_id));

  const renderTarea = (t) => {
    const prio = prioridades.find(x => x.id === t.prioridad_id);
    const color = prio ? prio.color : tema.texto;
    return (
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={t.id} className="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: tema.superficie }} onClick={() => abrirTarea(t.id)}>
        <button onClick={(e) => { e.stopPropagation(); completarTarea(t); }} className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: color }}>
          <div className="w-4 h-4 rounded-full opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: color }}></div>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: tema.texto }}>{t.titulo}</p>
          {t.descripcion && <p className="text-xs opacity-60 truncate" style={{ color: tema.texto }}>{t.descripcion}</p>}
        </div>
        {t.regla_repeticion && t.regla_repeticion !== 'none' && <Iconos.Repeat size={14} color={tema.colorSecundario} className="shrink-0" />}
      </Animacion.motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <UI.Tarjeta className="p-5 rounded-3xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: tema.texto }}>{MEITI.t('today', null, 'Hoy')}</h2>
          <p className="opacity-70 text-sm capitalize" style={{ color: tema.texto }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-4" style={{ borderColor: tema.colorPrimario, color: tema.colorPrimario }}>
          <span className="text-xl font-black">{completadasHoy}</span>
        </div>
      </UI.Tarjeta>

      {cargando ? <div className="text-center p-4"><Iconos.Loader className="animate-spin mx-auto" color={tema.colorPrimario} /></div> : (
        <>
          {tareasAtrasadas.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#ef4444' }}><Iconos.CalendarClock size={18} /> {MEITI.t('overdue', null, 'Atrasadas')}</h3>
              {tareasAtrasadas.map(renderTarea)}
            </div>
          )}

          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: tema.texto }}><Iconos.Sun size={18} color={tema.colorSecundario} /> {MEITI.t('for_today', null, 'Para hoy')}</h3>
            {tareasHoy.length === 0 ? (
              <UI.EstadoVacio icono="fa-mug-hot" mensaje={MEITI.t('no_tasks_today', null, 'No tienes tareas pendientes para hoy. ¡Disfruta tu día!')} />
            ) : (
              tareasHoy.map(renderTarea)
            )}
          </div>
        </>
      )}

      <div className="fixed bottom-24 right-4 z-30">
        <button onClick={() => abrirTarea('')} className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95" style={{ backgroundColor: tema.colorPrimario, color: '#fff' }}>
          <Iconos.Plus size={28} />
        </button>
      </div>
    </div>
  );
}