import React, { useState, useEffect } from 'react';
import { FileText, Users, Package, Plus, Edit2, Trash2, Download, X, Search } from 'lucide-react';

// Utilidad para generar IDs únicos
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Utilidad para formatear fechas
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Utilidad para formatear moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const API_URL = window.location.origin;

const FacturacionApp = () => {
  const [activeTab, setActiveTab] = useState('facturas');
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [facturas, setFacturas] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para los formularios
  const [clienteForm, setClienteForm] = useState({
    nombre: '', cif: '', email: '', telefono: '', direccion: ''
  });
  const [servicioForm, setServicioForm] = useState({
    nombre: '', descripcion: '', precio: 0
  });
  const [facturaForm, setFacturaForm] = useState({
    clienteId: '', fecha: new Date().toISOString().split('T')[0],
    numero: '', items: []
  });

  // Cargar datos al iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [clientesRes, serviciosRes, facturasRes] = await Promise.all([
        fetch(`${API_URL}/api/clientes`),
        fetch(`${API_URL}/api/servicios`),
        fetch(`${API_URL}/api/facturas`)
      ]);
      
      const clientesData = await clientesRes.json();
      const serviciosData = await serviciosRes.json();
      const facturasData = await facturasRes.json();
      
      setClientes(clientesData);
      setServicios(serviciosData);
      
      // Convertir formato de facturas del backend
      const facturasFormatted = facturasData.map(f => ({
        id: f.id,
        numero: f.numero,
        clienteId: f.cliente_id,
        fecha: f.fecha,
        total: f.total,
        items: f.items
      }));
      setFacturas(facturasFormatted);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Funciones para manejar clientes
  const handleSaveCliente = async () => {
    if (!clienteForm.nombre || !clienteForm.cif) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    try {
      if (editingItem) {
        await fetch(`${API_URL}/api/clientes/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clienteForm)
        });
        setClientes(clientes.map(c => c.id === editingItem.id ? { ...clienteForm, id: editingItem.id } : c));
      } else {
        const newCliente = { ...clienteForm, id: generateId() };
        await fetch(`${API_URL}/api/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCliente)
        });
        setClientes([...clientes, newCliente]);
      }
      closeModal();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleDeleteCliente = async (id) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await fetch(`${API_URL}/api/clientes/${id}`, { method: 'DELETE' });
        setClientes(clientes.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error eliminando cliente:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  // Funciones para manejar servicios
  const handleSaveServicio = async () => {
    if (!servicioForm.nombre || servicioForm.precio <= 0) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    try {
      if (editingItem) {
        await fetch(`${API_URL}/api/servicios/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(servicioForm)
        });
        setServicios(servicios.map(s => s.id === editingItem.id ? { ...servicioForm, id: editingItem.id } : s));
      } else {
        const newServicio = { ...servicioForm, id: generateId() };
        await fetch(`${API_URL}/api/servicios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newServicio)
        });
        setServicios([...servicios, newServicio]);
      }
      closeModal();
    } catch (error) {
      console.error('Error guardando servicio:', error);
      alert('Error al guardar el servicio');
    }
  };

  const handleDeleteServicio = async (id) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      try {
        await fetch(`${API_URL}/api/servicios/${id}`, { method: 'DELETE' });
        setServicios(servicios.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error eliminando servicio:', error);
        alert('Error al eliminar el servicio');
      }
    }
  };

  // Funciones para manejar facturas
  const handleSaveFactura = async () => {
    if (!facturaForm.clienteId || !facturaForm.numero || facturaForm.items.length === 0) {
      alert('Por favor, completa todos los campos y añade al menos un servicio');
      return;
    }

    try {
      const factura = {
        id: editingItem ? editingItem.id : generateId(),
        numero: facturaForm.numero,
        cliente_id: facturaForm.clienteId,
        fecha: facturaForm.fecha,
        total: calcularTotal(facturaForm.items),
        items: facturaForm.items
      };

      if (editingItem) {
        await fetch(`${API_URL}/api/facturas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(factura)
        });
        setFacturas(facturas.map(f => f.id === editingItem.id ? { ...factura, clienteId: factura.cliente_id } : f));
      } else {
        await fetch(`${API_URL}/api/facturas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(factura)
        });
        setFacturas([...facturas, { ...factura, clienteId: factura.cliente_id }]);
      }
      closeModal();
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar la factura');
    }
  };

  const handleDeleteFactura = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      try {
        await fetch(`${API_URL}/api/facturas/${id}`, { method: 'DELETE' });
        setFacturas(facturas.filter(f => f.id !== id));
      } catch (error) {
        console.error('Error eliminando factura:', error);
        alert('Error al eliminar la factura');
      }
    }
  };

  const addItemToFactura = (servicioId) => {
    const servicio = servicios.find(s => s.id === servicioId);
    if (!servicio) return;

    const newItem = {
      id: generateId(),
      servicioId: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      cantidad: 1
    };

    setFacturaForm({
      ...facturaForm,
      items: [...facturaForm.items, newItem]
    });
  };

  const updateItemCantidad = (itemId, cantidad) => {
    setFacturaForm({
      ...facturaForm,
      items: facturaForm.items.map(item =>
        item.id === itemId ? { ...item, cantidad: Math.max(1, cantidad) } : item
      )
    });
  };

  const removeItemFromFactura = (itemId) => {
    setFacturaForm({
      ...facturaForm,
      items: facturaForm.items.filter(item => item.id !== itemId)
    });
  };

  const calcularTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  // Funciones de modal
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);

    if (type === 'cliente') {
      setClienteForm(item || { nombre: '', cif: '', email: '', telefono: '', direccion: '' });
    } else if (type === 'servicio') {
      setServicioForm(item || { nombre: '', descripcion: '', precio: 0 });
    } else if (type === 'factura') {
      if (item) {
        setFacturaForm(item);
      } else {
        const nextNumero = String(facturas.length + 1).padStart(4, '0');
        setFacturaForm({
          clienteId: '',
          fecha: new Date().toISOString().split('T')[0],
          numero: `F-${new Date().getFullYear()}-${nextNumero}`,
          items: []
        });
      }
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
  };

  // Exportar factura a PDF
  const exportToPDF = async (factura) => {
    try {
      const response = await fetch(`${API_URL}/api/generar-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId: factura.id })
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${factura.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  // Filtrar elementos según búsqueda
  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFacturas = facturas.filter(f => {
    const cliente = clientes.find(c => c.id === f.clienteId);
    return f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (cliente && cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: '"Manrope", -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}>
              <FileText size={24} color="white" />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.5px'
              }}>
                Sistema de Facturación
              </h1>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 500
              }}>
                Gestiona tu negocio de forma profesional
              </p>
            </div>
          </div>

          {/* Búsqueda */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 42px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(30, 41, 59, 0.9)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(30, 41, 59, 0.6)';
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 30px',
          display: 'flex',
          gap: '8px'
        }}>
          {[
            { id: 'facturas', label: 'Facturas', icon: FileText },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'servicios', label: 'Servicios', icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px'
      }}>
        {/* Botón añadir */}
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.5px'
          }}>
            {activeTab === 'facturas' ? 'Listado de Facturas' :
             activeTab === 'clientes' ? 'Listado de Clientes' :
             'Listado de Servicios'}
          </h2>
          <button
            onClick={() => openModal(activeTab === 'facturas' ? 'factura' : activeTab === 'clientes' ? 'cliente' : 'servicio')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }}
          >
            <Plus size={18} />
            Añadir {activeTab === 'facturas' ? 'Factura' : activeTab === 'clientes' ? 'Cliente' : 'Servicio'}
          </button>
        </div>

        {/* Lista de Clientes */}
        {activeTab === 'clientes' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '20px'
          }}>
            {filteredClientes.map(cliente => (
              <div key={cliente.id} style={{
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'white' }}>
                      {cliente.nombre}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px'
                    }}>
                      {cliente.cif}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openModal('cliente', cliente)}
                      style={{
                        padding: '8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.25)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                    >
                      <Edit2 size={16} color="#60a5fa" />
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente.id)}
                      style={{
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
                    >
                      <Trash2 size={16} color="#f87171" />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.8' }}>
                  {cliente.email && <div>📧 {cliente.email}</div>}
                  {cliente.telefono && <div>📱 {cliente.telefono}</div>}
                  {cliente.direccion && <div>📍 {cliente.direccion}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Servicios */}
        {activeTab === 'servicios' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}>
            {filteredServicios.map(servicio => (
              <div key={servicio.id} style={{
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white', flex: 1 }}>
                    {servicio.nombre}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openModal('servicio', servicio)}
                      style={{
                        padding: '8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.25)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                    >
                      <Edit2 size={16} color="#60a5fa" />
                    </button>
                    <button
                      onClick={() => handleDeleteServicio(servicio.id)}
                      style={{
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
                    >
                      <Trash2 size={16} color="#f87171" />
                    </button>
                  </div>
                </div>
                {servicio.descripcion && (
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                    {servicio.descripcion}
                  </p>
                )}
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Precio unitario
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                    {formatCurrency(servicio.precio)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Facturas */}
        {activeTab === 'facturas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFacturas.map(factura => {
              const cliente = clientes.find(c => c.id === factura.clienteId);
              return (
                <div key={factura.id} style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'white' }}>
                          {factura.numero}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}>
                          Emitida
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#94a3b8' }}>Cliente:</span> <strong style={{ color: 'white' }}>{cliente?.nombre || 'Cliente no encontrado'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Fecha:</span> {formatDate(factura.fecha)}
                        </div>
                      </div>
                      <div style={{
                        padding: '16px',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                          SERVICIOS INCLUIDOS ({factura.items.length})
                        </div>
                        {factura.items.map(item => (
                          <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                          }}>
                            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
                              {item.cantidad}x {item.nombre}
                            </span>
                            <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                              {formatCurrency(item.precio * item.cantidad)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                        borderRadius: '10px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 600 }}>Total (IVA incluido):</span>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                          {formatCurrency(factura.total * 1.21)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                      <button
                        onClick={() => exportToPDF(factura)}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '8px',
                          color: '#4ade80',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.25)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.15)'}
                      >
                        <Download size={16} />
                        PDF
                      </button>
                      <button
                        onClick={() => openModal('factura', factura)}
                        style={{
                          padding: '10px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.25)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                      >
                        <Edit2 size={16} color="#60a5fa" />
                      </button>
                      <button
                        onClick={() => handleDeleteFactura(factura.id)}
                        style={{
                          padding: '10px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
                      >
                        <Trash2 size={16} color="#f87171" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'white' }}>
                {editingItem ? 'Editar' : 'Nuevo'} {modalType === 'cliente' ? 'Cliente' : modalType === 'servicio' ? 'Servicio' : 'Factura'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
              >
                <X size={20} color="#f87171" />
              </button>
            </div>

            {/* Formulario Cliente */}
            {modalType === 'cliente' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={clienteForm.nombre}
                    onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    CIF *
                  </label>
                  <input
                    type="text"
                    value={clienteForm.cif}
                    onChange={(e) => setClienteForm({ ...clienteForm, cif: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={clienteForm.email}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={clienteForm.telefono}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Dirección
                  </label>
                  <textarea
                    value={clienteForm.direccion}
                    onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveCliente}
                  style={{
                    padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  {editingItem ? 'Actualizar Cliente' : 'Crear Cliente'}
                </button>
              </div>
            )}

            {/* Formulario Servicio */}
            {modalType === 'servicio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Nombre del servicio *
                  </label>
                  <input
                    type="text"
                    value={servicioForm.nombre}
                    onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Descripción
                  </label>
                  <textarea
                    value={servicioForm.descripcion}
                    onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Precio unitario (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={servicioForm.precio}
                    onChange={(e) => setServicioForm({ ...servicioForm, precio: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveServicio}
                  style={{
                    padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  {editingItem ? 'Actualizar Servicio' : 'Crear Servicio'}
                </button>
              </div>
            )}

            {/* Formulario Factura */}
            {modalType === 'factura' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Número de factura *
                  </label>
                  <input
                    type="text"
                    value={facturaForm.numero}
                    onChange={(e) => setFacturaForm({ ...facturaForm, numero: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Cliente *
                  </label>
                  <select
                    value={facturaForm.clienteId}
                    onChange={(e) => setFacturaForm({ ...facturaForm, clienteId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={facturaForm.fecha}
                    onChange={(e) => setFacturaForm({ ...facturaForm, fecha: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{
                  marginTop: '8px',
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                      Servicios en la factura
                    </label>
                  </div>
                  
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addItemToFactura(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">+ Añadir servicio</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre} - {formatCurrency(servicio.precio)}
                      </option>
                    ))}
                  </select>

                  {facturaForm.items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {facturaForm.items.map(item => (
                        <div key={item.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(30, 41, 59, 0.4)',
                          borderRadius: '8px',
                          border: '1px solid rgba(148, 163, 184, 0.1)'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                              {item.nombre}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {formatCurrency(item.precio)} cada uno
                            </div>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateItemCantidad(item.id, parseInt(e.target.value) || 1)}
                            style={{
                              width: '70px',
                              padding: '8px',
                              background: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '14px',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6', minWidth: '80px', textAlign: 'right' }}>
                            {formatCurrency(item.precio * item.cantidad)}
                          </div>
                          <button
                            onClick={() => removeItemFromFactura(item.id)}
                            style={{
                              padding: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
                          >
                            <Trash2 size={14} color="#f87171" />
                          </button>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        marginTop: '8px'
                      }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1' }}>Total:</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6' }}>
                          {formatCurrency(calcularTotal(facturaForm.items))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      No hay servicios añadidos. Selecciona uno arriba.
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveFactura}
                  style={{
                    padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  {editingItem ? 'Actualizar Factura' : 'Crear Factura'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturacionApp;