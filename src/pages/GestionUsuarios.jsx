import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import { crearUsuario, actualizarUsuario, obtenerUsuarios} from '../services/api.service';

const emptyForm = {  email: '', nombre_completo: '', password: '', rol: 'usuario', activo: 1 };

export default function GestionUsuarios() {
    const { user, perfil} = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    const loadUsuarios = async () => {
        setLoading(true);
        try {
            const data = await obtenerUsuarios(); //LLAMA A SUPABASE
            setUsuarios(data);
        } catch (err) {
            showMsg('danger', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsuarios(); }, []);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (u) => {
        setEditTarget(u);
        setForm({ email: u.email, nombre_completo: u.nombre_completo, password: '', rol: u.rol, activo: u.activo });
        setShowModal(true);
    };

    const handleSave = async () => {
        if ( !form.email) return showMsg('warning', 'Email es requerido.');
        if (!editTarget && !form.password) return showMsg('warning', 'La contraseña es requerida al crear un usuario.');
        setSaving(true);
        try {
            if (editTarget) {
                await actualizarUsuario(editTarget.id, {
                    nombre_completo: form.nombre_completo,
                    rol: form.rol,
                    acttivo: form.activo
                });
                showMsg('success', 'Usuario actualizado');
            } else {
            //    CREA EN AUTH.USERS (TRIGGER LO CREA EN AUTOMATICO)
            await crearUsuario({
                email: form.email,
                password: form.password,
                nombre_completo: form.nombre_completo,
                rol: form.rol
            });
            showMsg('success', 'Usuario creado');
            }
            setShowModal(false);
            loadUsuarios();
        } catch (err) {
            showMsg('danger', err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (u) => {
        if (!confirm(`¿Desactivar al usuario "${u.username}"?`)) return;
        try {
            await actualizarUsuario(u.id, {activo: false}); //LO DESACTIVA
            showMsg('success', 'Usuario desactivado.');
            loadUsuarios();
        } catch (err) {
            showMsg('danger', err.message);
        }
    };

    const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div style={{ maxWidth: 860, marginTop: '2.5rem', padding: '2rem 1.5rem',display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <FaUsers size={22} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a0533' }}>Gestión de Usuarios</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b5a8e' }}>Administración de cuentas del sistema</p>
                </div>
                <button onClick={openCreate} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    <FaPlus size={12} /> Nuevo Usuario
                </button>
            </div>

            {/* Toast */}
            {msg && (
                <div className={`alert alert-${msg.type}`} style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, minWidth: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                    {msg.text}
                </div>
            )}

            {/* Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner-border text-primary" /></div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0f5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(94,53,177,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff' }}>
                                {['ID', 'Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u, i) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f3f0ff', background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                                    <td style={{ padding: '0.7rem 1rem', color: '#6b5a8e' }}>{u.id}</td>
                                    <td style={{ padding: '0.7rem 1rem', color: '#374151' }}>{u.nombre_completo}</td>
                                    <td style={{ padding: '0.7rem 1rem', color: '#6b5a8e' }}>{u.email}</td>
                                    <td style={{ padding: '0.7rem 1rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: u.rol === 'admin' ? '#f3e8ff' : '#e0f2fe', color: u.rol === 'admin' ? '#7b1fa2' : '#0369a1' }}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.7rem 1rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: u.activo ? '#ecfdf5' : '#fef2f2', color: u.activo ? '#059669' : '#ef4444', border: `1px solid ${u.activo ? '#6ee7b7' : '#fca5a5'}` }}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.7rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEdit(u)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #d1c4e9', background: '#fff', color: '#5e35b1', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FaEdit size={11} /> Editar
                                            </button>
                                            {u.id !== user?.id && (
                                                <button onClick={() => handleDelete(u)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FaTrash size={11} /> Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,5,51,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', padding: '1rem 1.25rem', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                            <span>{editTarget ? `Editar: ${editTarget.nombre_completo || editTarget.email}` : 'Nuevo Usuario'}</span>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            {/* Email: solo al crear */}
                            {!editTarget && (
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                                        style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nombre completo</label>
                                <input type="text" value={form.nombre_completo} onChange={e => f('nombre_completo', e.target.value)}
                                    style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                            </div>
                            {/* Password: solo al crear */}
                            {!editTarget && (
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Contraseña *</label>
                                    <input type="password" value={form.password} onChange={e => f('password', e.target.value)}
                                        style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Rol</label>
                                    <select value={form.rol} onChange={e => f('rol', e.target.value)}
                                        style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem' }}>
                                        <option value="usuario">Usuario</option>
                                        <option value="admin">Admin</option>
                                        <option value="invitado">Invitado</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Estado</label>
                                    <select value={form.activo ? 1 : 0} onChange={e => f('activo', e.target.value === '1')}
                                        style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem' }}>
                                        <option value={1}>Activo</option>
                                        <option value={0}>Inactivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '0.45rem 1rem', borderRadius: 7, border: '1px solid #d1c4e9', background: '#fff', color: '#5e35b1', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                            <button onClick={handleSave} disabled={saving} style={{ padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {saving ? 'Guardando...' : editTarget ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}