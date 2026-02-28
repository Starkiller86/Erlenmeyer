// SRC/CONTEXT/AUTHCONTEXT.JSX
import {createContext, useContext, useEffect, useState} from 'react';
import { supabase } from '../config/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({children}){
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  // CARGAR SESION AL INICIAR
  useEffect(() =>{
    const initSesion = async() =>{
      const {data: {session}} = await supabase.auth.getSession();
      if(session?.user){
        setUser(session.user);
        await cargarPerfil(session.user.id);
      }
      setLoading(false);
    };
    initSesion();

    // ESCUCHAR CAMBIOS DE SESION

    const {data: listener} = supabase.auth.onAuthStateChange(
      async(_event, session) =>{
        if(session?.user){
          setUser(session.user);
          await cargarPerfil(session.user.id);
        }
        else{
          setUser(null);
          setPerfil(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  },[]);

  // CARGAR EL PERFIL
const cargarPerfil = async (userId) => {
  console.log('Cargando perfil para:', userId);
  
  try {
    const resultado = await Promise.race([
      supabase.from('perfiles').select('*').eq('id', userId).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT 5s')), 5000))
    ]);
    
    console.log('Perfil data:', resultado.data);
    console.log('Perfil error:', resultado.error);
    if (!resultado.error) setPerfil(resultado.data);
  } catch (err) {
    console.error('Error en cargarPerfil:', err.message);
    // Continúa aunque falle el perfil
  }
};

  // FUNCION DEL LOGIN
  const login = async (email, password) =>{
    const {data, error} = await supabase.auth.signInWithPassword({
      email, password
    });

    if(error) throw error;

    setUser(data.user);
    await cargarPerfil(data.user.id);
  };

  // LOGOUT

  const logout = async () =>{
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
  };

  return(
    <AuthContext.Provider
    value={{
      user,
      perfil,
      loading,
      login,
      logout,
      isAdmin: perfil?.rol === 'admin'
    }}> {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if(!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}