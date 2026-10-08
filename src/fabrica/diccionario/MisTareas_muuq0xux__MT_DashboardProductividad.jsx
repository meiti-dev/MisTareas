import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const MisTareas_muuq0xux__MT_DashboardProductividad = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('mt_tareas')}?ecosistema=${eco}`);
      if (res.ok) {
        setTareas(res.registros || []);
      } else {
        setError(res.error || MEITI.t('err_load_tasks', null, 'Error al cargar las tareas.'));
      }
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <UI.Tarjeta>
        <div className="p-12 flex justify-center items-center">
          <Iconos.LoaderCircle size={40} className="animate-spin" color={tema.colorPrimario} />
        </div>
      </UI.Tarjeta>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ultimos7Dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const completadas = tareas.filter(t => String(t.completada) === '1' && t.fecha_completada);
  const porDia = {};
  completadas.forEach(t => {
    const fecha = t.fecha_completada.split('T')[0];
    porDia[fecha] = (porDia[fecha] || 0) + 1;
  });

  const datosGrafico = ultimos7Dias.map(fecha => {
    const [y, m, d] = fecha.split('-');
    return {
      fechaOriginal: fecha,
      dia: `${d}/${m}`,
      completadas: porDia[fecha] || 0
    };
  });

  const totalSemana = datosGrafico.reduce((acc, curr) => acc + curr.completadas, 0);
  const maxDia = Math.max(...datosGrafico.map(d => d.completadas));

  let racha = 0;
  let fechaCheck = new Date(hoy);
  const hoyStr = fechaCheck.toISOString().split('T')[0];
  
  if (porDia[hoyStr] > 0) {
    racha++;
    fechaCheck.setDate(fechaCheck.getDate() - 1);
  } else {
    fechaCheck.setDate(fechaCheck.getDate() - 1);
  }

  while (true) {
    const checkStr = fechaCheck.toISOString().split('T')[0];
    if (porDia[checkStr] > 0) {
      racha++;
      fechaCheck.setDate(fechaCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Animacion.motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.colorPrimario + '22', color: tema.colorPrimario }}>
              <Iconos.Flame size={28} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('current_streak', null, 'Racha Actual')}</p>
              <h3 className="text-3xl font-black" style={{ color: tema.texto }}>{racha} <span className="text-lg opacity-70 font-bold">{MEITI.t('days', null, 'días')}</span></h3>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>

        <Animacion.motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.colorSecundario + '22', color: tema.colorSecundario }}>
              <Iconos.CheckCheck size={28} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('completed_7d', null, 'Últimos 7 días')}</p>
              <h3 className="text-3xl font-black" style={{ color: tema.texto }}>{totalSemana} <span className="text-lg opacity-70 font-bold">{MEITI.t('tasks_short', null, 'tareas')}</span></h3>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>

        <Animacion.motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.texto + '11', color: tema.texto }}>
              <Iconos.Trophy size={28} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider" style={{ color: tema.texto }}>{MEITI.t('best_day', null, 'Mejor Día')}</p>
              <h3 className="text-3xl font-black" style={{ color: tema.texto }}>{maxDia} <span className="text-lg opacity-70 font-bold">{MEITI.t('tasks_short', null, 'tareas')}</span></h3>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
      </div>

      <Animacion.motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <UI.Tarjeta className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <Iconos.TrendingUp size={24} color={tema.colorPrimario} />
            <h2 className="text-xl font-bold" style={{ color: tema.texto }}>{MEITI.t('performance_chart', null, 'Rendimiento Semanal')}</h2>
          </div>
          
          {totalSemana === 0 ? (
            <UI.EstadoVacio icono="fa-chart-simple" mensaje={MEITI.t('no_data_chart', null, 'Completa tareas para ver tu progreso en el gráfico.')} />
          ) : (
            <div className="w-full h-80">
              <Graficos.ResponsiveContainer width="100%" height="100%">
                <Graficos.BarChart data={datosGrafico} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <Graficos.CartesianGrid strokeDasharray="3 3" stroke={tema.texto + '22'} vertical={false} />
                  <Graficos.XAxis dataKey="dia" stroke={tema.texto} opacity={0.7} tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <Graficos.YAxis stroke={tema.texto} opacity={0.7} tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                  <Graficos.Tooltip 
                    cursor={{ fill: tema.texto + '0D' }}
                    contentStyle={{ backgroundColor: tema.superficie, borderColor: tema.colorPrimario + '33', borderRadius: '1rem', color: tema.texto, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: tema.colorPrimario, fontWeight: '900' }}
                  />
                  <Graficos.Bar dataKey="completadas" name={MEITI.t('tasks', null, 'Tareas completadas')} fill={tema.colorPrimario} radius={[6, 6, 0, 0]} maxBarSize={60} />
                </Graficos.BarChart>
              </Graficos.ResponsiveContainer>
            </div>
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default MisTareas_muuq0xux__MT_DashboardProductividad;
