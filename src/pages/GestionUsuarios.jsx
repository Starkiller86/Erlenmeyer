import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import { crearUsuario, actualizarUsuario, obtenerUsuarios, guardarFirmaUsuario } from '../services/api.service';
import SignatureCanvas from 'react-signature-canvas';
import QRCode from 'qrcode';

const emptyForm = { email: '', nombre_completo: '', password: '', rol: 'usuario', activo: 1 };

export default function GestionUsuarios() {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // ── Estados de firma ──────────────────────────────────────────────────────
    const sigRef = useRef(null);
    const [firmaGuardada, setFirmaGuardada] = useState(null);   // URL de la firma en Supabase
    const [qrGuardado, setQrGuardado] = useState(null);         // URL del QR en Supabase
    const [savingFirma, setSavingFirma] = useState(false);      // loading del botón guardar firma
    const [firmaYaGuardada, setFirmaYaGuardada] = useState(false); // controla el color/texto del botón

    // ── Estado del modal de QR grande ────────────────────────────────────────
    const [modalImg, setModalImg] = useState(null); // URL de la imagen a mostrar en grande

    // ── Helper: mostrar toast ─────────────────────────────────────────────────
    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    // ── Cargar lista de usuarios ──────────────────────────────────────────────
    const loadUsuarios = async () => {
        setLoading(true);
        try {
            const data = await obtenerUsuarios();
            setUsuarios(data);
        } catch (err) {
            showMsg('danger', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsuarios(); }, []);

    // ── Abrir modal para CREAR usuario ────────────────────────────────────────
    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setFirmaGuardada(null);
        setQrGuardado(null);
        setFirmaYaGuardada(false);
        setShowModal(true);
    };

    // ── Abrir modal para EDITAR usuario ───────────────────────────────────────
    const openEdit = (u) => {
        setEditTarget(u);
        setForm({ email: u.email, nombre_completo: u.nombre_completo, password: '', rol: u.rol, activo: u.activo });
        // Si el usuario ya tiene firma/QR guardados, los mostramos
        setFirmaGuardada(u.firma_url || null);
        setQrGuardado(u.firma_qr_url || null);
        setFirmaYaGuardada(false); // resetear estado del botón al abrir
        setShowModal(true);
    };

    // ── Guardar firma: convierte el canvas a blob y lo sube via api.service ───
    const handleGuardarFirma = async (userId) => {
        if (!sigRef.current || sigRef.current.isEmpty()) {
            return showMsg('warning', 'Dibuja una firma antes de guardar.');
        }
        setSavingFirma(true);
        try {
            // Convertir canvas a PNG blob
            const firmaDataUrl = sigRef.current.toDataURL('image/png');
            const firmaBlob = await (await fetch(firmaDataUrl)).blob();

            // api.service sube la firma, genera el QR con la URL pública y sube el QR
            const { firmaUrl, qrUrl } = await guardarFirmaUsuario(userId, firmaBlob);

            // Actualizar estado local con las nuevas URLs
            setFirmaGuardada(firmaUrl);
            setQrGuardado(qrUrl);
            setFirmaYaGuardada(true); // cambia el botón a verde "✅ Firma guardada"
            sigRef.current.clear();   // limpiar canvas después de guardar
            showMsg('success', '✅ Firma y QR guardados correctamente.');
            loadUsuarios(); // refrescar tabla
        } catch (err) {
            showMsg('danger', 'Error al guardar firma: ' + err.message);
        } finally {
            setSavingFirma(false);
        }
    };

    // ── Guardar datos del usuario (crear o editar) ────────────────────────────
    const handleSave = async () => {
        if (!form.email) return showMsg('warning', 'Email es requerido.');
        if (!editTarget && !form.password) return showMsg('warning', 'La contraseña es requerida al crear un usuario.');
        setSaving(true);
        try {
            if (editTarget) {
                // EDITAR: solo actualiza los campos del formulario
                await actualizarUsuario(editTarget.id, {
                    nombre_completo: form.nombre_completo,
                    rol: form.rol,
                    activo: form.activo
                });
                showMsg('success', 'Usuario actualizado.');
                setShowModal(false);
                loadUsuarios();
            } else {
                // CREAR: crea el usuario en auth.users (el trigger lo copia a perfiles)
                const nuevoUser = await crearUsuario({
                    email: form.email,
                    password: form.password,
                    nombre_completo: form.nombre_completo,
                    rol: form.rol
                });
                const userId = nuevoUser?.id;

                // Si dibujaron firma, esperar 1s al trigger y luego guardarla
                if (userId && sigRef.current && !sigRef.current.isEmpty()) {
                    await new Promise(r => setTimeout(r, 1000)); // esperar trigger de Supabase
                    await handleGuardarFirma(userId);
                }

                showMsg('success', 'Usuario creado correctamente.');
                setShowModal(false);
                loadUsuarios();
            }
        } catch (err) {
            showMsg('danger', err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Desactivar usuario ────────────────────────────────────────────────────
    const handleDelete = async (u) => {
        if (!confirm(`¿Desactivar al usuario "${u.nombre_completo}"?`)) return;
        try {
            await actualizarUsuario(u.id, { activo: false });
            showMsg('success', 'Usuario desactivado.');
            loadUsuarios();
        } catch (err) {
            showMsg('danger', err.message);
        }
    };

    // ── Helper: actualizar campo del formulario ───────────────────────────────
    const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

    // ── Estilos reutilizables ─────────────────────────────────────────────────
    const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
    const inputStyle = { width: '100%', padding: '0.45rem 0.65rem', border: '1px solid #d1c4e9', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: '100%', marginTop: '2.5rem', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>

            {/* ── Header ── */}
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

            {/* ── Toast de notificaciones ── */}
            {msg && (
                <div className={`alert alert-${msg.type}`} style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, minWidth: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                    {msg.text}
                </div>
            )}

            {/* ── Tabla de usuarios ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner-border text-primary" /></div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0f5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(94,53,177,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff' }}>
                                {['ID', 'Nombre', 'Email', 'Rol', 'Estado', 'Firma / QR', 'Acciones'].map(h => (
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

                                    {/* ── Columna Firma / QR ── */}
                                    <td style={{ padding: '0.7rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {/* Miniatura de la firma — clic abre en nueva pestaña */}
                                            {u.firma_url ? (
                                                <img
                                                    src={u.firma_url + '?t=' + Date.now()} // anti-caché
                                                    alt="firma"
                                                    style={{ height: 32, border: '1px solid #d1c4e9', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                                                    onClick={() => window.open(u.firma_url, '_blank')}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Sin firma</span>
                                            )}

                                            {/* Miniatura del QR — clic abre modal grande */}
                                            {u.firma_qr_url && (
                                                <img
                                                    src={u.firma_qr_url + '?t=' + Date.now()} // anti-caché
                                                    alt="qr"
                                                    style={{ height: 32, border: '1px solid #d1c4e9', borderRadius: 4, cursor: 'pointer' }}
                                                    onClick={() => setModalImg(u.firma_qr_url + '?t=' + Date.now())}
                                                />
                                            )}
                                        </div>
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

            {/* ── Modal Crear / Editar usuario ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,5,51,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}
                    onClick={() => setShowModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Cabecera del modal */}
                        <div style={{ background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', padding: '1rem 1.25rem', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1 }}>
                            <span>{editTarget ? `Editar: ${editTarget.nombre_completo || editTarget.email}` : 'Nuevo Usuario'}</span>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

                            {/* Email — solo visible al CREAR */}
                            {!editTarget && (
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)} style={inputStyle} />
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>Nombre completo</label>
                                <input type="text" value={form.nombre_completo} onChange={e => f('nombre_completo', e.target.value)} style={inputStyle} />
                            </div>

                            {/* Contraseña — solo visible al CREAR */}
                            {!editTarget && (
                                <div>
                                    <label style={labelStyle}>Contraseña *</label>
                                    <input type="password" value={form.password} onChange={e => f('password', e.target.value)} style={inputStyle} />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Rol</label>
                                    <select value={form.rol} onChange={e => f('rol', e.target.value)} style={inputStyle}>
                                        <option value="usuario">Usuario</option>
                                        <option value="admin">Admin</option>
                                        <option value="invitado">Invitado</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Estado</label>
                                    <select value={form.activo ? 1 : 0} onChange={e => f('activo', e.target.value === '1')} style={inputStyle}>
                                        <option value={1}>Activo</option>
                                        <option value={0}>Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Sección de Firma ── */}
                            <div style={{ borderTop: '1px solid #f3f0ff', paddingTop: '0.875rem' }}>
                                <label style={{ ...labelStyle, fontSize: '0.82rem', color: '#5e35b1', marginBottom: 8 }}>
                                    ✍️ Firma del usuario
                                </label>

                                {/* Mostrar firma y QR actuales si existen (modo editar) */}
                                {firmaGuardada && (
                                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, background: '#faf8ff', borderRadius: 8, padding: '0.6rem 0.8rem', border: '1px solid #e8e0f5' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b5a8e', marginBottom: 4 }}>Firma actual:</p>
                                            <img
                                                src={firmaGuardada + '?t=' + Date.now()} // anti-caché
                                                alt="firma actual"
                                                style={{ height: 40, border: '1px solid #d1c4e9', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                                                onClick={() => window.open(firmaGuardada, '_blank')}
                                            />
                                        </div>
                                        {qrGuardado && (
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b5a8e', marginBottom: 4 }}>QR actual:</p>
                                                {/* Clic en QR del modal de edición → abre modal grande */}
                                                <img
                                                    src={qrGuardado + '?t=' + Date.now()} // anti-caché
                                                    alt="qr actual"
                                                    style={{ height: 40, border: '1px solid #d1c4e9', borderRadius: 4, cursor: 'pointer' }}
                                                    onClick={() => setModalImg(qrGuardado + '?t=' + Date.now())}
                                                />
                                            </div>
                                        )}
                                        <span style={{ fontSize: '0.7rem', color: '#059669', marginLeft: 'auto' }}>✅ Guardada</span>
                                    </div>
                                )}

                                <p style={{ margin: '0 0 6px', fontSize: '0.72rem', color: '#9ca3af' }}>
                                    {firmaGuardada ? 'Dibuja abajo para reemplazar la firma:' : 'Dibuja la firma en el recuadro:'}
                                </p>

                                {/* Canvas de firma */}
                                <div style={{ border: '2px dashed #d1c4e9', borderRadius: 10, overflow: 'hidden', background: '#fdfcff', position: 'relative' }}>
                                    <SignatureCanvas
                                        ref={sigRef}
                                        penColor="#1a0533"
                                        canvasProps={{ style: { width: '100%', height: 150, display: 'block', touchAction: 'none' } }}
                                    />
                                    <span style={{ position: 'absolute', bottom: 6, right: 10, fontSize: '0.65rem', color: '#c4b5e8', pointerEvents: 'none' }}>
                                        Dibuja aquí
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    {/* Limpiar canvas */}
                                    <button onClick={() => { sigRef.current?.clear(); setFirmaYaGuardada(false); }}
                                        style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: '1px solid #d1c4e9', background: '#fff', color: '#6b5a8e', cursor: 'pointer', fontSize: '0.78rem' }}>
                                        Limpiar
                                    </button>

                                    {editTarget ? (
                                        // En modo EDITAR: botón independiente para guardar firma
                                        <button
                                            onClick={() => handleGuardarFirma(editTarget.id)}
                                            disabled={savingFirma}
                                            style={{
                                                padding: '0.35rem 0.9rem',
                                                borderRadius: 6,
                                                border: 'none',
                                                // Verde si ya se guardó, morado si no
                                                background: firmaYaGuardada
                                                    ? 'linear-gradient(135deg,#059669,#047857)'
                                                    : 'linear-gradient(135deg,#5e35b1,#7b1fa2)',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: 600
                                            }}>
                                            {savingFirma ? 'Guardando...' : firmaYaGuardada ? '✅ Firma guardada' : '💾 Guardar firma y QR'}
                                        </button>
                                    ) : (
                                        // En modo CREAR: la firma se guarda junto con el usuario
                                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                                            La firma se guardará al crear el usuario
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer del modal */}
                        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '0.45rem 1rem', borderRadius: 7, border: '1px solid #d1c4e9', background: '#fff', color: '#5e35b1', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                            <button onClick={handleSave} disabled={saving} style={{ padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {saving ? 'Guardando...' : editTarget ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal QR grande ──────────────────────────────────────────────
                Se abre al hacer clic en cualquier miniatura de QR.
                Muestra el QR en 280×280 con anti-caché y crossOrigin para evitar
                problemas de CORS en redes locales (192.168.x.x).
            ─────────────────────────────────────────────────────────────────── */}
            {modalImg && (
                <div
                    onClick={() => setModalImg(null)} // clic fuera cierra el modal
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, cursor: 'pointer' }}>
                    <div
                        onClick={e => e.stopPropagation()} // evitar cerrar al clic dentro
                        style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxWidth: 340 }}>

                        <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#1a0533', fontSize: '0.9rem' }}>
                            Código QR de firma
                        </p>

                        {/* Imagen del QR con anti-caché y crossOrigin */}
                        <img
                            src={modalImg}
                            alt="QR de firma"
                            crossOrigin="anonymous"
                            onError={(e) => {
                                // Si falla por caché, forzar recarga con nuevo timestamp
                                const base = modalImg.split('?')[0];
                                e.target.src = base + '?t=' + Date.now();
                            }}
                            style={{ width: 280, height: 280, objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #e8e0f5' }}
                        />

                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>
                            Escanea con tu celular para ver la firma
                        </p>

                        <button
                            onClick={() => setModalImg(null)}
                            style={{ marginTop: '1rem', padding: '0.4rem 1.4rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}