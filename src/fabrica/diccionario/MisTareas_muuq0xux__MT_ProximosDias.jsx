import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const MisTareas_muuq0xux__MT_ProximosDias = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`);
    if (res.ok) setTareas(res.registros.filter(t => t.completada === 0 && !t.tarea_padre_id) || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const hoy = new Date();
  const dias = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    dias.push(d.toISOString().split('T')[0]);
  }

  const cambiarFecha = async (tarea, nuevaFecha) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${tarea.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tarea, fecha: nuevaFecha })
    }, {
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

  return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <h2 className="text-2xl font-black px-2" style={{ color: tema.texto }}>{MEITI.t('next_7_days', null, 'Próximos 7 Días')}</h2>
      
      {cargando ? <div className="text-center p-4"><Iconos.Loader className="animate-spin mx-auto" color={tema.colorPrimario} /></div> : (
        <div className="flex flex-col gap-6">
          {dias.map(dia => {
            const tareasDia = tareas.filter(t => t.fecha === dia);
            const dateObj = new Date(dia + 'T12:00:00');
            return (
              <div key={dia}>
                <h3 className="font-bold mb-3 border-b pb-1 capitalize" style={{ color: tema.colorSecundario, borderColor: tema.colorSecundario + '33' }}>
                  {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h3>
                {tareasDia.length === 0 ? (
                  <p className="text-sm opacity-50 italic" style={{ color: tema.texto }}>{MEITI.t('no_tasks_scheduled', null, 'Sin tareas programadas')}</p>
                ) : (
                  tareasDia.map(t => (
                    <Animacion.motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={t.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ backgroundColor: tema.superficie }}>
                      <div className="flex-1 cursor-pointer min-w-0" onClick={() => abrirTarea(t.id)}>
                        <p className="font-bold text-sm truncate" style={{ color: tema.texto }}>{t.titulo}</p>
                      </div>
                      <input type="date" value={t.fecha || ''} onChange={(e) => cambiarFecha(t, e.target.value)} className="text-xs p-1 rounded bg-transparent border shrink-0" style={{ color: tema.texto, borderColor: tema.texto + '33' }} />
                    </Animacion.motion.div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisTareas_muuq0xux__MT_ProximosDias;
