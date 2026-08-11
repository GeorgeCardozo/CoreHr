import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obtenerEmpleados, actualizarEmpleado, eliminarEmpleado, crearEmpleadosMasivo, getAssetUrl, subirFotoPerfil } from '../services/api';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const ListaEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbiertoId, setMenuAbiertoId]= useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const source = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      const next = source[index + 1];
      if (character === '"' && inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = !inQuotes;
      } else if (character === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else if ((character === '\n' || character === '\r') && !inQuotes) {
        if (character === '\r' && next === '\n') index += 1;
        row.push(field.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
    if (rows.length <= 1 || inQuotes) return [];

    const headers = rows[0].map((header) => header.toLowerCase());
    return rows.slice(1).filter((values) => values.length >= headers.length).map((values) => {
      const item = {};
      headers.forEach((header, index) => { item[header] = values[index] || ''; });
      return item;
    });
  };

  const handleBulkTextChange = (text) => {
    setBulkText(text);
    const parsed = parseCSV(text);
    setBulkPreview(parsed);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo CSV no puede superar 2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setBulkText(text);
      const parsed = parseCSV(text);
      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkPreview.length === 0) {
      toast.error('No hay datos válidos para subir.');
      return;
    }
    setBulkUploading(true);
    try {
      const response = await crearEmpleadosMasivo(bulkPreview);
      toast.success(`Carga masiva completada: ${response.creados.length} creados.`);
      if (response.errores.length > 0) {
        setBulkResult(response);
      } else {
        setIsBulkModalOpen(false);
        setBulkText('');
        setBulkPreview([]);
        fetchEmpleados();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error durante la carga masiva.');
    } finally {
      setBulkUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    try {
      const csvCell = (value) => {
        const text = String(value ?? '');
        const protectedText = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
        return `"${protectedText.replaceAll('"', '""')}"`;
      };
      const headers = ['Documento de identidad', 'Nombres', 'Apellidos', 'Correo institucional', 'Cargo', 'Departamento', 'Fecha de ingreso', 'Estado de contrato'];
      const rows = (empleadosFiltrados.length > 0 ? empleadosFiltrados : empleados).map((emp) => [
        emp.documento_identidad, emp.nombres, emp.apellidos, emp.correo, emp.cargo || 'No registrado',
        emp.departamento || 'No registrado', emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-CO') : '',
        emp.tiene_contrato ? 'Con contrato' : 'Sin contrato',
      ].map(csvCell).join(','));
      const blob = new Blob([`\uFEFF${headers.map(csvCell).join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Reporte_Colaboradores_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Reporte CSV generado exitosamente.');
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      toast.error('Error al generar el archivo CSV.');
    }
  };

  const getAvatar = (emp) => {
    if (emp?.foto_perfil) {
      return getAssetUrl(emp.foto_perfil);
    }
    const nombres = emp?.nombres || 'C';
    const apellidos = emp?.apellidos || 'Colaborador';
    const iniciales = `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
    
    const colores = [
      '#008080', '#004d40', '#0f766e', '#0369a1', '#1d4ed8', 
      '#6d28d9', '#a21caf', '#be185d', '#b91c1c', '#c2410c'
    ];
    const index = (iniciales.charCodeAt(0) + (iniciales.charCodeAt(1) || 0)) % colores.length;
    const color = colores[index];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="${color}" />
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', sans-serif" font-size="38" font-weight="bold" fill="#ffffff">
          ${iniciales}
        </text>
      </svg>
    `.trim().replace(/\s+/g, ' ');
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  useEffect(() => {
    const cerrarMenu = () => {
      setMenuAbiertoId(null)
    };

    // Contratamos al guarda (escucha los clics en todo el documento)
    document.addEventListener('click', cerrarMenu);
    
    // Despedimos al guarda cuando el componente se destruye (buenas prácticas)
    return () => {
      document.removeEventListener('click', cerrarMenu);
    };
  }, []);

  // Obtener filtro inicial del query string
  const queryParams = new URLSearchParams(location.search);
  const filtroInicial = queryParams.get('filtro') === 'sin-contrato' ? 'Sin Contrato' : 'Todos';

  const [filtroContrato, setFiltroContrato] = useState(filtroInicial);

  // Sincronizar el filtro si cambia el query string
  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const filterVal = qParams.get('filtro') === 'sin-contrato' ? 'Sin Contrato' : 'Todos';
    setFiltroContrato(filterVal);
  }, [location.search]);

  // Estados para Edición y Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [editFormData, setEditFormData] = useState({
    correo: '',
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: '',
    superior_inmediato: '',
    habilidades: '',
    fecha_info_personal: '',
    fecha_soportes: '',
    fecha_seguridad: '',
    departamento: '',
    fecha_terminacion: '',
    tipo_genero: '',
    fecha_nacimiento: '',
    correo_personal: '',
    contacto_emergencia: '',
    parentesco: '',
    telefono_emergencia: ''
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);

  const fetchEmpleados = async () => {
    try {
      const data = await obtenerEmpleados();
      setEmpleados(data.empleados || []);
    } catch (err) {
      console.error(err);
      setError('Error al obtener la lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  useEffect(() => {
    const editId = new URLSearchParams(location.search).get('edit');
    if (editId && empleados.length > 0) {
      const targetEmp = empleados.find((e) => Number(e.id) === Number(editId));
      if (targetEmp) {
        handleOpenEdit(targetEmp);
      }
    }
  }, [location.search, empleados]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas desactivar a este colaborador? Se conservará el historial, pero se bloqueará su acceso.')) {
      try {
        setError('');
        await eliminarEmpleado(id);
        setEmpleados((prev) => prev.filter((emp) => emp.id !== id));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error al desactivar el colaborador.');
      }
    }
  };

  function handleOpenEdit(emp) {
    setSelectedEmpleado(emp);
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setEditFormData({
      correo: emp.correo || '',
      documento_identidad: emp.documento_identidad || '',
      nombres: emp.nombres || '',
      apellidos: emp.apellidos || '',
      telefono: emp.telefono || '',
      fecha_ingreso: formatDate(emp.fecha_ingreso),
      superior_inmediato: emp.superior_inmediato || '',
      habilidades: Array.isArray(emp.habilidades) ? emp.habilidades.join(', ') : '',
      fecha_info_personal: formatDate(emp.fecha_info_personal),
      fecha_soportes: formatDate(emp.fecha_soportes),
      fecha_seguridad: formatDate(emp.fecha_seguridad),
      departamento: emp.departamento || '',
      fecha_terminacion: formatDate(emp.fecha_terminacion),
      tipo_genero: emp.tipo_genero || '',
      fecha_nacimiento: formatDate(emp.fecha_nacimiento),
      correo_personal: emp.correo_personal || '',
      contacto_emergencia: emp.contacto_emergencia || '',
      parentesco: emp.parentesco || '',
      telefono_emergencia: emp.telefono_emergencia || ''
    });
    setEditError('');
    setEditPhotoFile(null);
    setEditPhotoPreview(emp.foto_perfil ? getAssetUrl(emp.foto_perfil) : null);
    setIsEditModalOpen(true);
  }

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes en formato JPG, PNG o WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB.');
      return;
    }
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    try {
      let nuevaFoto = selectedEmpleado.foto_perfil;

      if (editPhotoFile) {
        const formData = new FormData();
        formData.append('foto', editPhotoFile);
        formData.append('empleado_id', selectedEmpleado.id);

        const photoRes = await subirFotoPerfil(formData);
        if (photoRes?.foto_perfil) {
          nuevaFoto = photoRes.foto_perfil;
        }
      }

      const data = await actualizarEmpleado(selectedEmpleado.id, {
        correo: editFormData.correo || null,
        documento_identidad: editFormData.documento_identidad,
        nombres: editFormData.nombres,
        apellidos: editFormData.apellidos,
        telefono: editFormData.telefono || null,
        fecha_ingreso: editFormData.fecha_ingreso || null,
        superior_inmediato: editFormData.superior_inmediato || null,
        habilidades: editFormData.habilidades ? editFormData.habilidades.split(',').map(s => s.trim()).filter(Boolean) : [],
        fecha_info_personal: editFormData.fecha_info_personal || null,
        fecha_soportes: editFormData.fecha_soportes || null,
        fecha_seguridad: editFormData.fecha_seguridad || null,
        departamento: editFormData.departamento || null,
        fecha_terminacion: editFormData.fecha_terminacion || null,
        tipo_genero: editFormData.tipo_genero || null,
        fecha_nacimiento: editFormData.fecha_nacimiento || null,
        correo_personal: editFormData.correo_personal || null,
        contacto_emergencia: editFormData.contacto_emergencia || null,
        parentesco: editFormData.parentesco || null,
        telefono_emergencia: editFormData.telefono_emergencia || null
      });

      // Actualizar la lista localmente
      setEmpleados((prev) => 
        prev.map((emp) => emp.id === selectedEmpleado.id ? { ...emp, ...data.empleado, foto_perfil: nuevaFoto } : emp)
      );
      setIsEditModalOpen(false);
      setSelectedEmpleado(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
      toast.success('Colaborador actualizado exitosamente.');
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Error al actualizar los datos del colaborador.');
    } finally {
      setEditLoading(false);
    }
  };

  const searchQuery = new URLSearchParams(location.search).get('q') || '';

  const empleadosFiltrados = empleados.filter((emp) => {
    if (filtroContrato === 'Sin Contrato' && emp.tiene_contrato) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nombreCompleto = `${emp.nombres || ''} ${emp.apellidos || ''}`.toLowerCase();
      const matchName = nombreCompleto.includes(q);
      const matchDoc = (emp.documento_identidad || '').toLowerCase().includes(q);
      const matchEmail = (emp.correo || '').toLowerCase().includes(q);
      const matchCargo = (emp.cargo || '').toLowerCase().includes(q);
      const matchDept = (emp.departamento || '').toLowerCase().includes(q);
      return matchName || matchDoc || matchEmail || matchCargo || matchDept;
    }
    return true;
  });


  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header con navegación y botón de creación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-6">
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mb-2 transition-colors print:hidden"
            >
              ← Volver al panel principal
            </button>
            {/* Cabecera exclusiva para impresión */}
            <div className="hidden print:block mb-8 text-center border-b border-slate-350 pb-4">
              <h1 className="text-2xl font-bold text-black">Gimnasio Los Arrayanes Bilingüe</h1>
              <h2 className="text-xl font-bold text-slate-800 mt-1">Reporte de Colaboradores - CoreRRHH</h2>
              <p className="text-xs text-slate-500 mt-1">Fecha de Generación: {new Date().toLocaleDateString('es-CO')}</p>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent print:hidden">
              Colaboradores de CoreRRHH
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 print:hidden">
              Listado general y administración del personal contratado.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold rounded-lg py-2.5 px-4 transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Imprimir PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold rounded-lg py-2.5 px-4 transition-all flex items-center gap-2 cursor-pointer text-xs"
              title="Exportar listado de colaboradores a CSV"
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold rounded-lg py-2.5 px-4 transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Carga Masiva</span>
            </button>

            <button
              onClick={() => navigate('/crear-empleado')}
              className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg py-2.5 px-4 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <span className="text-lg font-bold">+</span> Registrar Colaborador
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Bento-Grid / Contenedor Estilizado de Tabla */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-on-surface-variant text-sm">Cargando colaboradores...</p>
            </div>
          ) : empleados.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-on-surface-variant text-5xl">👥</div>
              <p className="text-on-surface-variant font-medium">No hay colaboradores registrados en el sistema.</p>
              <p className="text-on-surface-variant text-xs">Presiona el botón superior para añadir el primer empleado.</p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {/* Header de la tabla con toggle de filtro */}
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-outline-variant/60 pb-4 print:hidden">
                <div>
                  <h2 className="text-base font-bold text-on-surface tracking-wide">Colaboradores Registrados</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Administre las cuentas y fichas de su personal.</p>
                </div>

                <div className="flex items-center gap-3">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                      🔍 "{searchQuery}"
                      <button onClick={() => navigate('/empleados')} className="hover:text-red-400 font-bold ml-1 cursor-pointer">✕</button>
                    </span>
                  )}
                  <div className="flex bg-background border border-outline-variant/60 rounded-lg p-0.5">
                    <button 
                      onClick={() => setFiltroContrato('Todos')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        filtroContrato === 'Todos' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant hover:text-on-surface-variant'
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setFiltroContrato('Sin Contrato')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        filtroContrato === 'Sin Contrato' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant hover:text-on-surface-variant'
                      }`}
                    >
                      Sin Contrato
                    </button>
                  </div>
                </div>
              </div>

              {empleadosFiltrados.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <span className="material-symbols-outlined text-slate-600 text-4xl">work_off</span>
                  <p className="text-on-surface-variant font-medium text-sm">No hay colaboradores sin contrato activo bajo este filtro.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/60 bg-surface-container text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Colaborador</th>
                        <th className="py-4 px-6">Cargo</th>
                        <th className="py-4 px-6">Ingreso</th>
                        <th className="py-4 px-6">Contrato</th>
                        <th className="py-4 px-6 text-center print:hidden">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-sm">
                      {empleadosFiltrados.map((emp) => (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-surface-container/30 transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className='flex gap-2 items-center'>
                            <img 
                               src={getAvatar(emp)} 
                               alt={`Foto de ${emp.nombres}`} 
                               className='w-10 h-10 rounded-full object-cover' 
                             />
                            <div>
                            <div className='font-medium text-on-surface'> { emp.nombres} { emp.apellidos}</div>
                            <div className='text-xs  text-on-surface-variant'> { emp.correo}</div>
                            </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">
                            {emp.cargo || 'No registrado'}
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant">
                            {new Date(emp.fecha_ingreso).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            {emp.tiene_contrato ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400"></span>
                                Con Contrato
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse"></span>
                                Sin Contrato
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center print:hidden">
                            <div className="flex justify-center items-center gap-2 relative">
                              
                              <button
                                onClick={(e) => {e.stopPropagation(); setMenuAbiertoId(emp.id)}}
                                className="text-on-surface font-semibold text-xs py-1.5 px-3 rounded-lg shadow-md hover:shadow-sky-500/10 transition-all cursor-pointer">
                               <span className='material-symbols-outlined'> more_vert </span>
                              </button>
                              {menuAbiertoId == emp.id && (
                              <>
                              
                              <div className="absolute z-10 border border-outline-variant/50 py-1.5 min-w-[90px] bg-surface-container right-0 mt-0 rounded-md shadow-lg flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                                <button className='text-xs text-on-surface-variant px-4 py-2 hover:text-green-300 text-left material-symbols-outlined' onClick={()=>handleOpenEdit(emp)}>Edit_Square</button>
                                <button className='text-xs text-on-surface-variant px-4 py-2 hover:text-red-400 text-left material-symbols-outlined ' onClick={()=>handleDelete(emp.id)}>delete</button>

                                </div>
                                </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant/60 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Editar Colaborador
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl font-bold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-2.5">
                {editError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                
                {/* Foto de Perfil */}
                <div className="flex flex-col items-center justify-center space-y-2 pb-2 border-b border-outline-variant/40">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-md group">
                    <img
                      src={editPhotoPreview || getAvatar(selectedEmpleado)}
                      alt="Foto del colaborador"
                      className="w-full h-full object-cover"
                    />
                    <label
                      htmlFor="edit_foto_input"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-semibold"
                    >
                      <span className="material-symbols-outlined text-lg mb-0.5">photo_camera</span>
                      <span>Cambiar</span>
                    </label>
                  </div>
                  <input
                    id="edit_foto_input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleEditPhotoChange}
                  />
                  <label
                    htmlFor="edit_foto_input"
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    <span>{editPhotoFile ? editPhotoFile.name : 'Cambiar foto de perfil'}</span>
                  </label>
                </div>

                {/* Correo Institucional */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_correo">
                    Correo Institucional *
                  </label>
                  <input
                    id="edit_correo"
                    name="correo"
                    type="email"
                    required
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.correo}
                    onChange={(e) => setEditFormData({ ...editFormData, correo: e.target.value })}
                  />
                </div>

                {/* Documento Identidad */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_documento_identidad">
                    Documento de Identidad *
                  </label>
                  <input
                    id="edit_documento_identidad"
                    name="documento_identidad"
                    type="text"
                    required
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.documento_identidad}
                    onChange={(e) => setEditFormData({ ...editFormData, documento_identidad: e.target.value })}
                  />
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_nombres">
                    Nombres *
                  </label>
                  <input
                    id="edit_nombres"
                    name="nombres"
                    type="text"
                    required
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.nombres}
                    onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_apellidos">
                    Apellidos *
                  </label>
                  <input
                    id="edit_apellidos"
                    name="apellidos"
                    type="text"
                    required
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.apellidos}
                    onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_telefono">
                    Teléfono de Contacto
                  </label>
                  <input
                    id="edit_telefono"
                    name="telefono"
                    type="text"
                    placeholder="Ej. +57 300 000 0000"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.telefono}
                    onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                  />
                </div>

                {/* Fecha Ingreso */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_ingreso">
                    Fecha de Ingreso
                  </label>
                  <input
                    id="edit_fecha_ingreso"
                    name="fecha_ingreso"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_ingreso}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_ingreso: e.target.value })}
                  />
                </div>

                {/* Fecha Terminación */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_terminacion">
                    Fecha de Terminación
                  </label>
                  <input
                    id="edit_fecha_terminacion"
                    name="fecha_terminacion"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_terminacion}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_terminacion: e.target.value })}
                  />
                </div>

                {/* Superior Inmediato */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_superior_inmediato">
                    Superior Inmediato
                  </label>
                  <input
                    id="edit_superior_inmediato"
                    name="superior_inmediato"
                    type="text"
                    placeholder="Ej. Dra. Marta Rivera"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.superior_inmediato}
                    onChange={(e) => setEditFormData({ ...editFormData, superior_inmediato: e.target.value })}
                  />
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_departamento">
                    Departamento (Ej. Académico - STEM)
                  </label>
                  <input
                    id="edit_departamento"
                    name="departamento"
                    type="text"
                    placeholder="Ej. Académico - STEM"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.departamento}
                    onChange={(e) => setEditFormData({ ...editFormData, departamento: e.target.value })}
                  />
                </div>

                {/* Género */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_tipo_genero">
                    Género
                  </label>
                  <select
                    id="edit_tipo_genero"
                    name="tipo_genero"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.tipo_genero}
                    onChange={(e) => setEditFormData({ ...editFormData, tipo_genero: e.target.value })}
                  >
                    <option value="">Seleccione género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_nacimiento">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="edit_fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_nacimiento}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_nacimiento: e.target.value })}
                  />
                </div>

                {/* Correo Personal */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_correo_personal">
                    Correo Personal
                  </label>
                  <input
                    id="edit_correo_personal"
                    name="correo_personal"
                    type="email"
                    placeholder="Ej. personal@correo.com"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.correo_personal}
                    onChange={(e) => setEditFormData({ ...editFormData, correo_personal: e.target.value })}
                  />
                </div>

                {/* Habilidades */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_habilidades">
                    Habilidades (separadas por coma)
                  </label>
                  <input
                    id="edit_habilidades"
                    name="habilidades"
                    type="text"
                    placeholder="Ej. Node.js, Inglés B2, Google Workspace"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.habilidades}
                    onChange={(e) => setEditFormData({ ...editFormData, habilidades: e.target.value })}
                  />
                </div>

                {/* Fecha Info Personal */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_info_personal">
                    Fecha Verificación Info Personal
                  </label>
                  <input
                    id="edit_fecha_info_personal"
                    name="fecha_info_personal"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_info_personal}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_info_personal: e.target.value })}
                  />
                </div>

                {/* Fecha Soportes */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_soportes">
                    Fecha Verificación Soportes
                  </label>
                  <input
                    id="edit_fecha_soportes"
                    name="fecha_soportes"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_soportes}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_soportes: e.target.value })}
                  />
                </div>

                {/* Fecha Seguridad */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_fecha_seguridad">
                    Fecha Validación Seguridad
                  </label>
                  <input
                    id="edit_fecha_seguridad"
                    name="fecha_seguridad"
                    type="date"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.fecha_seguridad}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_seguridad: e.target.value })}
                  />
                </div>

                <h4 className="text-sm font-bold text-primary border-b border-outline-variant/60 pb-1 pt-2">
                  Contacto de Emergencia
                </h4>

                {/* Contacto de Emergencia - Nombre */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_contacto_emergencia">
                    Nombre del Contacto
                  </label>
                  <input
                    id="edit_contacto_emergencia"
                    name="contacto_emergencia"
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.contacto_emergencia}
                    onChange={(e) => setEditFormData({ ...editFormData, contacto_emergencia: e.target.value })}
                  />
                </div>

                {/* Contacto de Emergencia - Parentesco */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_parentesco">
                    Parentesco
                  </label>
                  <input
                    id="edit_parentesco"
                    name="parentesco"
                    type="text"
                    placeholder="Ej. Madre, Cónyuge, Hermano"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.parentesco}
                    onChange={(e) => setEditFormData({ ...editFormData, parentesco: e.target.value })}
                  />
                </div>

                {/* Contacto de Emergencia - Teléfono */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="edit_telefono_emergencia">
                    Teléfono de Emergencia
                  </label>
                  <input
                    id="edit_telefono_emergencia"
                    name="telefono_emergencia"
                    type="text"
                    placeholder="Ej. +57 300 000 0000"
                    className="w-full bg-surface-container border border-outline-variant/60 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={editFormData.telefono_emergencia}
                    onChange={(e) => setEditFormData({ ...editFormData, telefono_emergencia: e.target.value })}
                  />
                </div>

              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 border-t border-outline-variant/60 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-surface-container hover:bg-surface-container-low text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg px-5 py-2 text-xs shadow-lg hover:shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Modal de Carga Masiva */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3 shrink-0">
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Carga Masiva de Colaboradores
              </h3>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkText('');
                  setBulkPreview([]);
                  setBulkResult(null);
                }}
                className="text-on-surface-variant hover:text-on-surface text-2xl font-bold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Content body (scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {bulkResult ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-primary text-sm rounded-lg p-3">
                    ✓ Se crearon exitosamente <strong>{bulkResult.creados.length}</strong> colaboradores.
                  </div>
                  {bulkResult.errores.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Errores detectados ({bulkResult.errores.length})</h4>
                      <div className="overflow-x-auto border border-red-500/20 rounded-lg max-h-40 overflow-y-auto bg-red-500/5 text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-red-500/10 text-red-650 dark:text-red-400 border-b border-red-500/20 font-bold">
                              <th className="p-2">Fila</th>
                              <th className="p-2">Correo</th>
                              <th className="p-2">Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-500/10 text-on-surface">
                            {bulkResult.errores.map((err, index) => (
                              <tr key={index}>
                                <td className="p-2 font-bold">{err.fila}</td>
                                <td className="p-2 truncate max-w-[150px]">{err.correo}</td>
                                <td className="p-2 text-red-550">{err.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setBulkResult(null);
                        setBulkText('');
                        setBulkPreview([]);
                        setIsBulkModalOpen(false);
                        fetchEmpleados();
                      }}
                      className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg px-4 py-2 text-xs cursor-pointer"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-lg border border-outline-variant/60 leading-relaxed">
                    <p className="font-bold mb-1 text-primary">Instrucciones de formato:</p>
                    <p>La primera línea debe contener las cabeceras separadas por comas. Las siguientes líneas deben tener los datos correspondientes.</p>
                    <p className="font-mono mt-1 select-all bg-background p-1.5 rounded border border-outline-variant/30 overflow-x-auto">
                      correo,contrasena,documento_identidad,nombres,apellidos,telefono,departamento,tipo_genero,correo_personal
                    </p>
                    <p className="mt-1">La contraseña temporal es obligatoria, debe tener mínimo 12 caracteres e incluir mayúscula, minúscula y número.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="flex-1">
                      <label className="block text-on-surface-variant text-xs font-semibold mb-1">Cargar archivo CSV:</label>
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange}
                        className="w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container file:text-on-surface hover:file:bg-surface-container-low file:cursor-pointer"
                      />
                    </div>
                    <div className="flex items-end">
                      <span className="text-xs text-on-surface-variant italic">O pega el texto abajo:</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant text-xs font-semibold mb-1" htmlFor="bulk_csv_text">
                      Datos CSV (Pegar texto):
                    </label>
                    <textarea
                      id="bulk_csv_text"
                      placeholder="Pegue aquí el contenido de su CSV..."
                      className="w-full h-36 bg-background border border-outline-variant/60 rounded-lg p-3 text-xs font-mono text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={bulkText}
                      onChange={(e) => handleBulkTextChange(e.target.value)}
                    />
                  </div>

                  {bulkPreview.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Vista Previa ({bulkPreview.length} colaboradores detectados)
                      </h4>
                      <div className="overflow-x-auto border border-outline-variant/65 rounded-lg max-h-36 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-bold">
                              <th className="p-2">Correo</th>
                              <th className="p-2">Identidad</th>
                              <th className="p-2">Nombre</th>
                              <th className="p-2">Apellido</th>
                              <th className="p-2">Cargo/Dept</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/40 text-on-surface">
                            {bulkPreview.slice(0, 5).map((row, index) => (
                              <tr key={index} className="hover:bg-surface-container/20">
                                <td className="p-2 truncate max-w-[120px]">{row.correo}</td>
                                <td className="p-2">{row.documento_identidad}</td>
                                <td className="p-2">{row.nombres}</td>
                                <td className="p-2">{row.apellidos}</td>
                                <td className="p-2">{row.departamento || 'General'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {bulkPreview.length > 5 && (
                        <p className="text-[10px] text-on-surface-variant italic text-right">* Se muestran sólo las primeras 5 filas para vista previa.</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 border-t border-outline-variant/60 pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkModalOpen(false);
                        setBulkText('');
                        setBulkPreview([]);
                        setBulkResult(null);
                      }}
                      className="bg-surface-container hover:bg-surface-container-low text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={bulkUploading || bulkPreview.length === 0}
                      className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg px-5 py-2 text-xs shadow-lg hover:shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {bulkUploading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                          <span>Subir Colaboradores</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ListaEmpleados;
