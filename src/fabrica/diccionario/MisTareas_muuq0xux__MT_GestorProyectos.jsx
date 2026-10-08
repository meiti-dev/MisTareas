import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const MisTareas_muuq0xux__MT_GestorProyectos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const [proyectos, setProyectos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const [resProj, resTar] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_proyectos')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`)
    ]);
    if (resProj.ok) setProyectos(resProj.registros || []);
    if (resTar.ok) setTareas(resTar.registros || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async (e) => {
    e.preventDefault();
    if (!nuevo.trim()) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_proyectos')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'proj_' + Date.now(),
        usuario_id: uid,
        nombre: nuevo.trim(),
        color: tema.colorPrimario
      })
    }, {
      alLograr: () => { setNuevo(''); cargar(); },
      alFallar: setError
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!editando || !editando.nombre.trim()) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_proyectos')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando)
    }, {
      alLograr: () => { setEditando(null); cargar(); },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (await MEITI.confirmar(MEITI.t('delete_project_q', null, '¿Borrar este proyecto?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('delete_yes', null, 'Sí, borrar'), tono: 'peligro' })) {
      await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('mt_proyectos')}?ecosistema=${eco}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }, {
        alLograr: cargar,
        alFallar: setError
      });
    }
  };

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: MEITI.t('name', null, 'Nombre'),
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color || tema.colorPrimario }}></div>
          <span className="font-bold">{p.nombre}</span>
        </div>
      )
    },
    {
      clave: 'progreso',
      etiqueta: MEITI.t('progress', null, 'Progreso'),
      render: (p) => {
        const tareasProj = tareas.filter(t => t.proyecto_id === p.id && !t.tarea_padre_id);
        const completadas = tareasProj.filter(t => t.completada === 1).length;
        const total = tareasProj.length;
        const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
        return (
          <div className="flex flex-col gap-1 min-w-32">
            <div className="flex justify-between text-xs opacity-70">
              <span>{pct}%</span>
              <span>{completadas}/{total}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: tema.fondo }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color || tema.colorPrimario }}></div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black px-2" style={{ color: tema.texto }}>{MEITI.t('projects', null, 'Proyectos')}</h2>
        <p className="px-2 opacity-70 text-sm" style={{ color: tema.texto }}>{MEITI.t('projects_desc', null, 'Gestiona tus proyectos y mide su avance.')}</p>
      </div>
      
      {editando ? (
        <UI.Tarjeta className="p-4">
          <h3 className="font-bold mb-4" style={{ color: tema.texto }}>{MEITI.t('edit_project', null, 'Editar Proyecto')}</h3>
          <form onSubmit={guardarEdicion} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <UI.Campo 
                etiqueta={MEITI.t('name', null, 'Nombre')}
                tipo="text" 
                valor={editando.nombre} 
                onChange={e => setEditando({...editando, nombre: e.target.value})} 
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="flex-1">
                <UI.Boton variante="secundario" onClick={() => setEditando(null)}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>
              </div>
              <div className="flex-1">
                <UI.Boton tipo="submit" variante="primario">{MEITI.t('save', null, 'Guardar')}</UI.Boton>
              </div>
            </div>
          </form>
        </UI.Tarjeta>
      ) : (
        <UI.Tarjeta className="p-4">
          <form onSubmit={agregar} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <UI.Campo 
                etiqueta={MEITI.t('new_project', null, 'Nuevo proyecto')}
                tipo="text" 
                valor={nuevo} 
                onChange={e => setNuevo(e.target.value)} 
                placeholder={MEITI.t('project_name_placeholder', null, 'Ej: Rediseño web...')}
              />
            </div>
            <div className="w-full md:w-auto">
              <UI.Boton tipo="submit" variante="primario">{MEITI.t('add', null, 'Agregar')}</UI.Boton>
            </div>
          </form>
        </UI.Tarjeta>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {cargando ? (
          <div className="p-8 text-center opacity-50">{MEITI.t('loading', null, 'Cargando...')}</div>
        ) : proyectos.length === 0 ? (
          <UI.EstadoVacio icono="fa-folder-open" mensaje={MEITI.t('no_projects', null, 'No tienes proyectos creados.')} />
        ) : (
          <UI.Tarjeta className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-0">
              <UI.TablaDatos 
                columnas={columnas}
                datos={proyectos}
                claveId="id"
                onEditar={(fila) => setEditando(fila)}
                onBorrar={(fila) => borrar(fila.id)}
              />
            </div>
          </UI.Tarjeta>
        )}
      </div>
    </div>
  );
};

export default MisTareas_muuq0xux__MT_GestorProyectos;
