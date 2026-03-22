import React, { useState } from 'react';
import { registrarMaterial, actualizarMaterial } from '../../services/api.service';
import { generarCodigoQR } from '../../utils/qrCodeUtils';
import { QRCodeSVG } from 'qrcode.react';

const FormularioMaterial = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        cantidad: 1,
        cantidad_minima: 1
    });
    const [codigoQR, setCodigoQR] = useState('');
    const [mostrarQR, setMostrarQR] = useState(false);
    const [cargando, setCargando] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const material = {
                nombre: formData.nombre,
                cantidad: parseInt(formData.cantidad),
                cantidad_minima: parseInt(formData.cantidad_minima)
            };
            const resultado = await registrarMaterial(material);
            const codigoGenerado = generarCodigoQR(resultado.id, 'MAT');
            await actualizarMaterial(resultado.id, { codigo_qr: codigoGenerado });
            setCodigoQR(codigoGenerado);
            setMostrarQR(true);
            alert('Material registrado exitosamente');
            setFormData({ nombre: '', cantidad: 1, cantidad_minima: 1 });
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setCargando(false);
        }
    };
    return (
        <div className='formulario-reactivo-container' style={{ marginTop: '80px' }}>
            <div className='formulario-reactivo-card'>
                <div className='formulario-header'>
                    <h1>Alta de material</h1>
                    <p>Registra material, equipo o cristaleria</p>
                </div>
                <form onSubmit={handleSubmit} className='formulario-reactivo'>
                    <div className='form-group'>
                        <label>Nombre del material</label>
                        <input
                            type='text'
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            required
                            placeholder='Ej. Matraz Erlenmeyer 250ml' />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Cantidad Inicial (Piezas) *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.cantidad}
                                onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Cantidad Mínima (Alerta) *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.cantidad_minima}
                                onChange={e => setFormData({ ...formData, cantidad_minima: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <button type='submit' className='btn btn-primary' disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Registrar material'}
                    </button>
                </form>
                {mostrarQR && codigoQR &&(
                    <div className='seccion-qr' style={{marginTop:'2rem', textAlign:'center'}}>
                        <h2>Codigo QR generado</h2>
                        <div style={{background:'#fff', padding:'1rem', display:'inline-block', borderRadius:'8px'}}>
                            <QRCodeSVG value={codigoQR} size={150}></QRCodeSVG>
                        </div>
                        <p style={{marginTop:'1rem'}}>
                            <code style={{color: '#ffffff', fontSize: '1.2rem'}}>{codigoQR}</code>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormularioMaterial;