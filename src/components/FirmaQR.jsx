import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import QRCode from 'qrcode';
import { supabase } from '../supabaseClient';

export default function FirmaQR({ userId, onGuardado }) {
  const sigRef = useRef(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const limpiar = () => sigRef.current.clear();

  const guardar = async () => {
    if (sigRef.current.isEmpty()) {
      return setMsg({ type: 'warning', text: 'Dibuja tu firma primero' });
    }
    setSaving(true);
    try {
      // 1. Obtener imagen de la firma como blob
      const firmaDataUrl = sigRef.current.toDataURL('image/png');
      const firmaBlob = await (await fetch(firmaDataUrl)).blob();

      // 2. Subir firma al Storage
      const firmaPath = `firmas/${userId}/firma.png`;
      const { error: uploadError } = await supabase.storage
        .from('firmas')
        .upload(firmaPath, firmaBlob, { upsert: true, contentType: 'image/png' });
      if (uploadError) throw uploadError;

      // 3. Obtener URL pública de la firma
      const { data: { publicUrl: firmaUrl } } = supabase.storage
        .from('firmas')
        .getPublicUrl(firmaPath);

      // 4. Generar imagen QR que apunta a la firma
      const qrDataUrl = await QRCode.toDataURL(firmaUrl, { width: 200 });
      const qrBlob = await (await fetch(qrDataUrl)).blob();

      // 5. Subir QR al Storage
      const qrPath = `firmas/${userId}/qr.png`;
      const { error: qrUploadError } = await supabase.storage
        .from('firmas')
        .upload(qrPath, qrBlob, { upsert: true, contentType: 'image/png' });
      if (qrUploadError) throw qrUploadError;

      const { data: { publicUrl: qrUrl } } = supabase.storage
        .from('firmas')
        .getPublicUrl(qrPath);

      // 6. Guardar URLs en la tabla perfiles
      const { error: dbError } = await supabase
        .from('perfiles')
        .update({ firma_url: firmaUrl, firma_qr_url: qrUrl })
        .eq('id', userId);
      if (dbError) throw dbError;

      setQrUrl(qrUrl);
      setMsg({ type: 'success', text: '¡Firma y QR guardados!' });
      if (onGuardado) onGuardado({ firmaUrl, qrUrl });

    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '1.5rem' }}>
      <h5 style={{ fontWeight: 700, color: '#1a0533', marginBottom: '1rem' }}>
        ✍️ Dibuja tu firma
      </h5>

      {/* Canvas de firma */}
      <div style={{ border: '2px solid #d1c4e9', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#1a0533"
          canvasProps={{ width: 460, height: 180, style: { display: 'block' } }}
        />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
        <button onClick={limpiar}
          style={{ padding: '0.45rem 1rem', borderRadius: 7, border: '1px solid #d1c4e9', background: '#fff', color: '#5e35b1', cursor: 'pointer', fontWeight: 500 }}>
          Limpiar
        </button>
        <button onClick={guardar} disabled={saving}
          style={{ padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#5e35b1,#7b1fa2)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          {saving ? 'Guardando...' : 'Guardar firma y generar QR'}
        </button>
      </div>

      {/* Mensaje */}
      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginTop: '0.75rem' }}>
          {msg.text}
        </div>
      )}

      {/* Mostrar QR generado */}
      {qrUrl && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ color: '#6b5a8e', fontSize: '0.85rem', marginBottom: 6 }}>Tu código QR:</p>
          <img src={qrUrl} alt="QR de firma" style={{ width: 160, border: '1px solid #e8e0f5', borderRadius: 8, padding: 6 }} />
        </div>
      )}
    </div>
  );
}