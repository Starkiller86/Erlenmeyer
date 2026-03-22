import { useEffect, useState } from "react";
import { supabase } from "../../config/supabaseClient"; // ajusta ruta

export function useNuevasSolicitudes(userRol) {
  const [contador, setContador] = useState(0);
  const rolesPermitidos = ["admin", "laboratorista"];

  useEffect(() => {
    if (!rolesPermitidos.includes(userRol)) return;

    //  Cargar pendientes existentes al montar
    const cargarPendientes = async () => {
      const { count, error } = await supabase
        .from("loan_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente"); // ajusta el valor exacto de tu enum

      if (!error && count !== null) {
        setContador(count);
      }
    };

    cargarPendientes();

    // 2️ Escuchar nuevas inserciones en tiempo real
    const channel = supabase
      .channel("nuevas-solicitudes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "loan_requests" },
        () => setContador((prev) => prev + 1)
      )
      // 3️También escuchar cuando cambia el status (ej: de pendiente a aprobado)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "loan_requests" },
        () => cargarPendientes() // recalcula el total real de pendientes
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userRol]);

  // Ya NO exportamos limpiarContador — el contador baja solo cuando cambia el status
  return { contador };
}