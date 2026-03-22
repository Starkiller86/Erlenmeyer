import React, {useState, useEffect} from 'react';
import { obtenerMateriales, actualizarMaterial } from '../services/api.service';
import {QRCodeSVG} from 'qrcode.react';

const MostrarMaterial=()=>{
    const[materiales, setMateriales]=useState([]);
    const[cargando, setCargando]=useState(true);
    const[busqueda, setBusqueda]=useState('');

    //Estado para los modales
    const[materialSeleccionado, setMaterialSeleccionado]=useState(null); //modal de vista
    const[materialEditar, setMaterialEditar]=useState(null); //modal de edicion
    const[formData, setFormData]=useState({});
    const[guardando, setGuardando]=useState(false);

    useEffect(()=>{
        cargarMateriales();
    },[]); //Se vuelve a ejecutar si cambia la busqueda

    const cargarMateriales=async()=>{
        setCargando(true);
        try{
            const data=await obtenerMateriales();
            setMateriales(data);
        }catch(error){
            console.error('Error al cargar materiales: ', error);
        }finally{
            setCargando(false);
        }
    };

    //Edicion de formulario
    const abrirFormularioEdicion=(material)=>{
        setFormData({
            nombre:material.nombre || '',
            cantidad:material.cantidad || 0,
            cantidad_minima:material.cantidad_minima || 0
        });
        setMaterialSeleccionado(null); //Cierra vista
        setMaterialEditar(material); //Abre la edicion
    };

    const handleGuardarCambios=async(e)=>{
        e.preventDefault();
        setGuardando(true);
        try{
            const datosActualizar={
                nombre: formData.nombre,
                cantidad:parseInt(formData.cantidad),
                cantidad_minima:parseInt(formData.cantidad_minima)
            };
            await actualizarMaterial(materialEditar.id, datosActualizar);
            cargarMateriales(); //Refresca la lista
            setMaterialEditar(null); //Cierra el modal
            alert('Material actualizado correctamente');
        }catch(error){
            console.error('Error al actualizar: ', error);
            alert('Error al actualizar el material: '+error.message);
        }finally{
            setGuardando(false);
        }
    };

    const normalizarTexto=(texto)=>{
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    };

    const materialesFiltrados=materiales.filter(mat=>
        normalizarTexto(mat.nombre).includes(normalizarTexto(busqueda))
    );
    //Descargar QR
    const descargarQR=(codigo, nombre)=>{
        const svg=document.getElementById('qr-code-svg-material');
        const svgData=new XMLSerializer().serializeToString(svg);
        const canvas=document.createElement('canvas');
        const ctx=canvas.getContext('2d');
        const img=new Image();

        img.onload=()=>{
            canvas.width=img.width;
            canvas.height=img.height;
            ctx.drawImage(img,0,0);
            canvas.toBlob((blob)=>{
                const url=URL.createObjectURL(blob);
                const link=document.createElement('a');
                link.href=url;
                link.download = `QR_${nombre.replace(/\s+/g, '_')}.png`;
                link.click();
                URL.revokeObjectURL(url);
            });
        };
        img.src="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData)));
    };

    return(
        <div className='mostrar-reactivo-container' style={{marginTop:'80px'}}>
            <div className='mostrar-header'>
                <h1>Inventario de materiales</h1>
                <p>Consulta y gestiona el equipo y la cristaleria</p>
            </div>
            {/*Barra de busqueda*/}
            <div className='filtros-section'>
                <div className='filtros-grid' style={{gridTemplateColumns:'1fr'}}>
                    <input
                        type='text'
                        placeholder='Buscar por nombre de material...'
                        value={busqueda}
                        onChange={(e)=>setBusqueda(e.target.value)}
                        style={{padding:'12px', fontSize:'1rem'}}
                    />
                </div>
            </div>
            {/*Lista de materiales */}
            {cargando ?(
                <div className='loading'>
                    <div className='spinner'></div>
                    <p>Cargando materiales...</p>
                </div>
            ):(
                <div className='reactivos-grid'>
                    {materialesFiltrados.length===0 ? (
                        <div className='no-resultados'><p>No se encontraron materiales</p></div>
                    ):(
                        materialesFiltrados.map((mat)=>{
                            const stockBajo=mat.cantidad<=mat.cantidad_minima;
                            return(
                                <div
                                key={mat.id}
                                className='reactivo-card'
                                style={{borderLeftColor:stockBajo ? '#ff4444' : '#4CAF50'}}
                                onClick={()=>setMaterialSeleccionado(mat)}>
                                    <div className='reactivo-header'>
                                        <h3>{mat.nombre}</h3>
                                    </div>
                                    <div className='reactivo-info'>
                                        <span className='badge' style={{backgroundColor:stockBajo ? '#ff4444' : '#4CAF50'}}>
                                            {stockBajo ? 'Stock Bajo' : 'Stock Normal'}
                                        </span>
                                    </div>
                                    <div className='reactivo-detalles' style={{marginTop:'1rem'}}>
                                        <div><strong>Cantidad actual </strong>{mat.cantidad} piezas</div>
                                        <div><strong>Cantidad minima </strong>{mat.cantidad_minima} piezas</div>
                                    </div>
                                    <div className='reactivo-codigo'><code>{mat.codigo_qr}</code></div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            {/*Modal de informacion*/}
            {materialSeleccionado &&(
                <div className='modal-overlay' onClick={()=>setMaterialSeleccionado(null)}>
                    <div className='modal-content' onClick={(e)=>e.stopPropagation()}>
                        <button className='modal-close' onClick={()=>setMaterialSeleccionado(null)}>X</button>
                        <h2>{materialSeleccionado.nombre}</h2>
                        <div className='modal-body'>
                            <div className='modal-qr'>
                                <QRCodeSVG id='qr-code-svg-material' value={materialSeleccionado.codigo_qr} size={150}></QRCodeSVG>
                                <code>{materialSeleccionado.codigo_qr}</code>
                            </div>
                            <div className='modal-info' style={{textAlign:'center', margin:'1.5rem 0'}}>
                                <p style={{fontSize:'1.2rem', marginBottom:'0.5rem'}}>
                                    <strong>En inventario: </strong> {materialSeleccionado.cantidad} piezas
                                </p>
                                <p style={{color:'#aaa'}}>
                                    <strong>Alerta de stock bajo al llegar a: </strong>{materialSeleccionado.cantidad_minima} piezas
                                </p>
                            </div>
                        </div>
                        <button
                        className='btn btn-primary'
                        style={{width:'100%', marginBottom:'0.5rem'}}
                        onClick={()=>descargarQR(materialSeleccionado.codigo_qr, materialSeleccionado.nombre)}>Descargar QR</button>
                        <button
                        className='btn btn-outline'
                        style={{width:'100%'}}
                        onClick={()=>abrirFormularioEdicion(materialSeleccionado)}>Editar material</button>
                    </div>
                </div>
            )}
            {/*Formulario de edicion */}
            {materialEditar && (
                <div className='modal-overlay' onClick={()=>setMaterialEditar(null)}>
                    <div className='modal-content' onClick={(e)=>e.stopPropagation()} style={{maxWidth:'400px'}}>
                        <button className='modal-close' onClick={()=>setMaterialEditar(null)}>X</button>
                        <h2>Editar: {materialEditar.nombre}</h2>
                        <form onSubmit={handleGuardarCambios} style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1.5rem'}}>
                            <div>
                                <label>Nombre del material</label>
                                <input
                                type='text'
                                value={formData.nombre}
                                onChange={e=>setFormData({...formData, nombre:e.target.value})}
                                required
                                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #12054e', background: '#fff', color: '#000'}}></input>
                            </div>
                            <div style={{display:'flex', gap:'1rem'}}>
                                <div style={{flex:1}}>
                                    <label>Cantidad actual</label>
                                    <input
                                    type='number'
                                    min='0'
                                    value={formData.cantidad}
                                    onChange={e=>setFormData({...formData, cantidad:e.target.value})}
                                    required
                                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #12054e', background: '#fff', color: '#000'}}></input>
                                </div>
                                <div style={{flex:1}}>
                                    <label>Cantidad minima</label>
                                    <input
                                    type='number'
                                    min='0'
                                    value={formData.cantidad_minima}
                                    onChange={e=>setFormData({...formData, cantidad_minima:e.target.value})}
                                    required
                                    style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #12054e', background: '#fff', color: '#000'}}></input>
                                </div>
                            </div>
                            <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
                                <button type='submit' disabled={guardando} className='btn btn-primary' style={{flex:1}}>
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                                <button type='button' onClick={()=>setMaterialEditar(null)} className='btn btn-outline' style={{flex:1}}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MostrarMaterial;