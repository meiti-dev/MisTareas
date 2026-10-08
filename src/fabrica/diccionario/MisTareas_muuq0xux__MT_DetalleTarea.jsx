import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const MisTareas_muuq0xux__MT_DetalleTarea = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();

  const [tareaId, setTareaId] = useState(null);
  const [form, setForm] = useState({ id: '', titulo: '', descripcion: '', fecha: '', prioridad_id: '', proyecto_id: '', regla_repeticion: 'none' });
  const [subtareas, setSubtareas] = useState([]);
  const [nuevaSub, setNuevaSub] = useState('');
  const [subtareaEditando, setSubtareaEditando] = useState(null);

  const [proyectos, setProyectos] = useState([]);
  const [prioridades, setPrioridades] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const [resEst, resProj, resPrio] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_estado_ui')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_proyectos')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_prioridades')}?ecosistema=${eco}`)
    ]);

    if (resProj.ok) setProyectos(resProj.registros || []);
    if (resPrio.ok) setPrioridades(resPrio.registros || []);

    let tId = null;
    if (resEst.ok && resEst.registros.length > 0) {
      tId = resEst.registros[0].tarea_activa_id;
      setTareaId(tId);
    }

    if (tId) {
      const resTar = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`);
      if (resTar.ok) {
        const t = resTar.registros.find(x => x.id === tId);
        if (t) {
          setForm({
            id: t.id,
            titulo: t.titulo || '',
            descripcion: t.descripcion || '',
            fecha: t.fecha || '',
            prioridad_id: t.prioridad_id || '',
            proyecto_id: t.proyecto_id || '',
            regla_repeticion: t.regla_repeticion || 'none'
          });
        }
        setSubtareas(resTar.registros.filter(x => x.tarea_padre_id === tId));
      }
    } else {
      setForm({ ...form, id: 'tar_' + Date.now() });
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    if (e) e.preventDefault();
    if (!form.titulo.trim()) return setError(MEITI.t('title_required', null, 'El título es obligatorio'));
    setGuardando(true);
    setError(null);

    const payload = {
      ...form,
      usuario_id: uid,
      completada: 0,
      fecha_registro: form.fecha_registro || new Date().toISOString()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`, {
      method: tareaId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('task_saved', null, 'Tarea guardada'));
        setTimeout(() => setExito(null), 3000);
        if (!tareaId) MEITI.irAPagina('inicio');
        setGuardando(false);
      },
      alFallar: (err) => { setError(err); setGuardando(false); }
    });
  };

  const agregarSubtarea = async () => {
    if (!nuevaSub.trim() || !tareaId) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'tar_' + Date.now(),
        usuario_id: uid,
        titulo: nuevaSub.trim(),
        tarea_padre_id: tareaId,
        completada: 0,
        fecha_registro: new Date().toISOString()
      })
    }, {
      alLograr: () => { setNuevaSub(''); cargar(); },
      alFallar: setError
    });
  };

  const guardarEdicionSubtarea = async () => {
    if (!subtareaEditando || !subtareaEditando.titulo.trim()) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${subtareaEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtareaEditando)
    }, {
      alLograr: () => { setSubtareaEditando(null); cargar(); },
      alFallar: setError
    });
  };

  const borrarSubtarea = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_subtask_q', null, '¿Borrar esta subtarea?'))) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const borrarTarea = async () => {
    if (!tareaId) return;
    if (!await MEITI.confirmar(MEITI.t('delete_task_q', null, '¿Borrar esta tarea y sus subtareas?'))) return;

    const mutaciones = subtareas.map(s => ({
      url: `/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${s.id}`,
      opciones: { method: 'DELETE' }
    }));
    mutaciones.push({
      url: `/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${tareaId}`,
      opciones: { method: 'DELETE' }
    });

    await MEITI.mutarVarias(mutaciones, {
      alLograr: () => MEITI.irAPagina('inicio'),
      alFallar: setError
    });
  };

  const toggleSubtarea = async (sub) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}&id=${sub.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sub, completada: sub.completada ? 0 : 1 })
    }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  if (cargando) return <div className="p-8 flex justify-center"><i className="fa-solid fa-circle-notch fa-spin text-3xl" style={{ color: tema.colorPrimario }}></i></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <UI.Boton variante="secundario" onClick={() => MEITI.irAPagina('inicio')} ariaLabel={MEITI.t('back', null, 'Volver')}>
          <i className="fa-solid fa-arrow-left"></i>
        </UI.Boton>
        <h2 className="text-xl font-bold" style={{ color: tema.texto }}>
          {tareaId ? MEITI.t('edit_task', null, 'Editar Tarea') : MEITI.t('new_task', null, 'Nueva Tarea')}
        </h2>
        {tareaId ? (
          <UI.Boton variante="peligro" onClick={borrarTarea} ariaLabel={MEITI.t('delete', null, 'Borrar')}>
            <i className="fa-solid fa-trash"></i>
          </UI.Boton>
        ) : <div className="w-10"></div>}
      </div>

      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <UI.Tarjeta className="p-5">
        <div className="flex flex-col gap-4">
          <UI.Campo etiqueta={MEITI.t('title', null, 'Título')} tipo="text" valor={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder={MEITI.t('what_to_do', null, '¿Qué hay que hacer?')} />
          <UI.Campo etiqueta={MEITI.t('description', null, 'Descripción')} tipo="textarea" valor={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder={MEITI.t('additional_details', null, 'Detalles adicionales...')} />

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('date', null, 'Fecha')} tipo="date" valor={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
            </div>
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('priority', null, 'Prioridad')} tipo="select" valor={form.prioridad_id} onChange={e => setForm({...form, prioridad_id: e.target.value})} opciones={[{value:'', label: MEITI.t('no_priority', null, 'Sin prioridad')}, ...prioridades.map(p => ({value: p.id, label: p.nombre}))]} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('project', null, 'Proyecto')} tipo="select" valor={form.proyecto_id} onChange={e => setForm({...form, proyecto_id: e.target.value})} opciones={[{value:'', label: MEITI.t('inbox', null, 'Bandeja de entrada')}, ...proyectos.map(p => ({value: p.id, label: p.nombre}))]} />
            </div>
            <div className="flex-1">
              <UI.Campo etiqueta={MEITI.t('repetition', null, 'Repetición')} tipo="select" valor={form.regla_repeticion} onChange={e => setForm({...form, regla_repeticion: e.target.value})} opciones={[{value:'none', label: MEITI.t('no_repeat', null, 'No repetir')}, {value:'diaria', label: MEITI.t('daily', null, 'Diaria')}, {value:'semanal', label: MEITI.t('weekly', null, 'Semanal')}, {value:'mensual', label: MEITI.t('monthly', null, 'Mensual')}]} />
            </div>
          </div>

          <div className="mt-2">
            <UI.Boton onClick={guardar} disabled={guardando} className="w-full justify-center">
              <i className="fa-solid fa-save mr-2"></i> {guardando ? MEITI.t('saving', null, 'Guardando...') : MEITI.t('save_task', null, 'Guardar Tarea')}
            </UI.Boton>
          </div>
        </div>
      </UI.Tarjeta>

      {tareaId && (
        <UI.Tarjeta className="p-5">
          <h3 className="font-bold mb-4 text-lg" style={{ color: tema.texto }}>
            <i className="fa-solid fa-list-check mr-2" style={{ color: tema.colorSecundario }}></i>
            {MEITI.t('subtasks', null, 'Subtareas')}
          </h3>

          <div className="mb-6">
            <UI.TablaDatos
              columnas={[
                { clave: 'titulo', etiqueta: MEITI.t('title', null, 'Título') },
                {
                  clave: 'completada',
                  etiqueta: MEITI.t('status', null, 'Estado'),
                  render: (f) => <UI.Chip tono={f.completada ? 'exito' : 'neutro'}>{f.completada ? MEITI.t('completed', null, 'Completada') : MEITI.t('pending', null, 'Pendiente')}</UI.Chip>
                }
              ]}
              datos={subtareas}
              claveId="id"
              onEditar={(fila) => setSubtareaEditando(fila)}
              onBorrar={(fila) => borrarSubtarea(fila.id)}
              accionesExtra={[
                {
                  etiqueta: (f) => f.completada ? MEITI.t('mark_pending', null, 'Marcar pendiente') : MEITI.t('mark_completed', null, 'Completar'),
                  icono: 'fa-check',
                  tono: (f) => f.completada ? 'neutro' : 'exito',
                  onClick: toggleSubtarea
                }
              ]}
            />
          </div>

          {subtareaEditando ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="flex-1">
                <UI.Campo
                  etiqueta={MEITI.t('edit_subtask', null, 'Editar subtarea')}
                  tipo="text"
                  valor={subtareaEditando.titulo}
                  onChange={e => setSubtareaEditando({...subtareaEditando, titulo: e.target.value})}
                />
              </div>
              <UI.Boton onClick={guardarEdicionSubtarea}>{MEITI.t('save', null, 'Guardar')}</UI.Boton>
              <UI.Boton variante="secundario" onClick={() => setSubtareaEditando(null)}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>
            </div>
          ) : (
            <UI.Campo
              etiqueta={MEITI.t('new_subtask', null, 'Nueva subtarea')}
              tipo="text"
              valor={nuevaSub}
              onChange={e => setNuevaSub(e.target.value)}
              placeholder={MEITI.t('new_subtask_placeholder', null, 'Escribe y presiona Agregar...')}
              accion={<UI.Boton onClick={agregarSubtarea}>{MEITI.t('add', null, 'Agregar')}</UI.Boton>}
            />
          )}
        </UI.Tarjeta>
      )}
    </div>
  );
};

export default MisTareas_muuq0xux__MT_DetalleTarea;
