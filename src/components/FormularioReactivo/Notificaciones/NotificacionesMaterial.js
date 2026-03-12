import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../config/supabaseClient";

export const useNotificaciones = (userId) => {  

    const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
    const [nuevaSolicitud, setNuevaSolicitud] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [totalPendientes, setTotalPendientes] = useState(0);
    const [rol, setRol] = useState(null); 


    useEffect(() => {
        if (!userId) return;

        const obtenerRol = async () => {
            const { data } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', userId)
                .single();

            console.log('Rol obtenido desde perfiles:', data?.rol); 
            setRol(data?.rol);
        };

        obtenerRol();
    }, [userId]);
    useEffect(() => {
    if (!userId) {
        console.log('❌ userId es undefined o null:', userId);
        return;
    }

    const obtenerRol = async () => {
        console.log('🔍 Buscando rol para userId:', userId);
        
        const { data, error } = await supabase  
            .from('perfiles')
            .select('rol')
            .eq('id', userId)
            .single();

        console.log('📦 data:', data);
        console.log('❗ error:', error);
        console.log('✅ Rol obtenido:', data?.rol);
        
        setRol(data?.rol);
    };

    obtenerRol();
}, [userId]);

    const esAdmin = rol === 'admin'; 

    const cargarPendientes = useCallback(async () => {
        if (!esAdmin) return;

        const { data } = await supabase
            .from('loan_requests')
            .select('id, practice_name, subject, group_name, user_nombre_compl, created_at, request_date')
            .eq('status', 'pendiente')
            .order('created_at', { ascending: false });

        if (data) {
            setSolicitudesPendientes(data);
            setTotalPendientes(data.length);
        }
    }, [esAdmin]);

    useEffect(() => {
        if (!esAdmin) return;

        cargarPendientes();

        const channel = supabase
            .channel('nuevas-solicitudes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'loan_requests'
                },
                (payload) => {
                    const solicitud = payload.new;
                    setNuevaSolicitud(solicitud);
                    setSolicitudesPendientes((prev) => [solicitud, ...prev]);
                    setTotalPendientes((prev) => prev + 1);
                    setShowModal(true);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);

    }, [esAdmin, cargarPendientes]);

    return {
        solicitudesPendientes,
        nuevaSolicitud,
        showModal,
        setShowModal,
        totalPendientes,
        cargarPendientes,
    };
};