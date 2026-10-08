/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const tabla = MEITI.obtenerTabla('mt_etiquetas');
  const urlBase = `/api/boveda/${tabla}?ecosistema=${eco}`;

  const [etiquetas, setEtiquetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const vacio = { id: '', nombre: '', color: '#3b82f6' };
  const [form, setForm] = useState(vacio);

  const paleta = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#64748b'];

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatosPropios(urlBase);
    if (res.ok) setEtiquetas(res.registros || []);
    else setError(res.error || MEITI.t('err_load_tags', null, 'Error al cargar etiquetas.'));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.nombre.trim()) return setError(MEITI.t('err_name_req', null, 'El nombre es obligatorio.'));
    
    setGuardando(true);
    const esNuevo = !form.id;
    const payload = {
      id: esNuevo ? 'tag_' + Date.now() : form.id,
      usuario_id: uid,
      nombre: form.nombre.trim(),
      color: form.color
    };

    await MEITI.mutar(urlBase, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('tag_saved', null, 'Etiqueta guardada.'));
        setForm(vacio);
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_tag', null, 'Error al guardar.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('del_tag_q', null, '¿Borrar esta etiqueta?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null); setExito(null);
    await MEITI.mutar(`${urlBase}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => {
        setExito(MEITI.t('tag_deleted', null, 'Etiqueta eliminada.'));
        if (form.id === id) setForm(vacio);
        cargar();
      },
      alFallar: (err) => setError(err || MEITI.t('err_del_tag', null, 'Error al eliminar.'))
    });
  };

  const editar = (fila) => {
    setForm({ id: fila.id, nombre: fila.nombre, color: fila.color || '#3b82f6' });
  };

  const columnas = [
    { clave: 'color', etiqueta: MEITI.t('col_color', null, 'Color'), render: (f) => <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: f.color }}></div> },
    { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Animacion.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <UI.Tarjeta>
          <div className="flex items-center gap-2 mb-4">
            <Iconos.Tags size={20} color={tema.colorPrimario} />
            <UI.Etiqueta>{form.id ? MEITI.t('edit_tag', null, 'Editar Etiqueta') : MEITI.t('new_tag', null, 'Nueva Etiqueta')}</UI.Etiqueta>
          </div>
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_tag_name', null, 'Ej: Urgente, Casa, Trabajo')} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <UI.Etiqueta>{MEITI.t('f_color', null, 'Color')}</UI.Etiqueta>
              <div className="flex flex-wrap gap-3">
                {paleta.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({...form, color: c})}
                    className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c, ringColor: c, ringOffsetColor: tema.superficie }}
                    aria-label={`Seleccionar color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2"><Iconos.Save size={16} /> {guardando ? MEITI.t('saving', null, 'Guardando...') : (form.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_create', null, 'Crear'))}</span>
              </UI.Boton>
              {form.id && (
                <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>
                  <span className="flex items-center gap-2"><Iconos.X size={16} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                </UI.Boton>
              )}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Iconos.List size={20} color={tema.colorSecundario} />
            <UI.Etiqueta>{MEITI.t('tag_list', null, 'Etiquetas Guardadas')}</UI.Etiqueta>
          </div>
          {cargando ? (
            <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p>
          ) : etiquetas.length === 0 ? (
            <UI.EstadoVacio icono="fa-tags" mensaje={MEITI.t('empty_tags', null, 'No hay etiquetas creadas.')} />
          ) : (
            <UI.TablaDatos columnas={columnas} datos={etiquetas} claveId="id" onEditar={editar} onBorrar={(fila) => borrar(fila.id)} />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
}