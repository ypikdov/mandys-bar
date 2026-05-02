import { useState, useCallback } from 'react';
import { 
  getBootstrapProfile, 
  updateProfile, 
  updatePassword, 
  deleteAccount, 
  getUserReservations, 
  getUserOrders 
} from '@/features/auth/profileService';
import { uploadImage } from '@/shared/api/uploadService';
import { useAuth } from '@/providers/AuthContext';
import { useNavigate } from 'react-router-dom';

export interface ProfileData {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  role: string;
  genero: string | null;
  fecha_nac: string | null;
  tipo_documento: string | null;
  num_documento: string | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  foto_perfil: string | null;
  created_at: string;
}

export function useProfile() {
  const { token, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [hasLoadedFullOrders, setHasLoadedFullOrders] = useState(false);
  const [hasLoadedFullReservations, setHasLoadedFullReservations] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  const bootstrapParams = useCallback(async () => {
    if (!token) return;
    setLoadingInitial(true);
    try {
      const data = await getBootstrapProfile(token);
      setProfile(data.profile);
      setOrders(data.recentOrders || []);
      setReservations(data.recentReservations || []);
    } catch (err) {
      console.error("Error bootstrapping profile", err);
    } finally {
      setLoadingInitial(false);
    }
  }, [token]);

  const fetchUserOrders = useCallback(async (force = false) => {
    if (!token) return;
    if (hasLoadedFullOrders && !force) return;
    
    setLoadingOrders(true);
    try {
      const data = await getUserOrders(token);
      setOrders(data);
      setHasLoadedFullOrders(true);
    } catch (err) {
      console.error("Error fetching user orders", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [token, hasLoadedFullOrders]);

  const fetchUserReservations = useCallback(async (force = false) => {
    if (!token) return;
    if (hasLoadedFullReservations && !force) return;
    
    setLoadingReservations(true);
    try {
      const data = await getUserReservations(token);
      setReservations(data);
      setHasLoadedFullReservations(true);
    } catch (err) {
      console.error("Error fetching user reservations", err);
    } finally {
      setLoadingReservations(false);
    }
  }, [token, hasLoadedFullReservations]);

  const saveSectionData = useCallback(async (body: any) => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProfile(body, token);
      setProfile(updated);
      updateUser({
        id: updated.id,
        nombre: updated.nombre,
        correo: updated.correo,
        role: updated.role,
        foto_perfil: updated.foto_perfil
      });
      showSuccess("¡Datos actualizados exitosamente!");
      return true;
    } catch (error) {
      const err = error as Error;
      alert(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, updateUser, showSuccess]);

  const uploadProfilePhoto = useCallback(async (file: File) => {
    if (!token) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, token, { bucket: 'users-avatars' });
      const updated = await updateProfile({ foto_perfil: url }, token);
      
      setProfile(updated);
      updateUser({
        id: updated.id,
        nombre: updated.nombre,
        correo: updated.correo,
        role: updated.role,
        foto_perfil: updated.foto_perfil
      });
      
      showSuccess("¡Foto de perfil actualizada!");
    } catch (error) {
      const err = error as Error;
      alert(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }, [token, updateUser, showSuccess]);

  const changeUserPassword = useCallback(async (body: any) => {
    if (!token) return;
    setSaving(true);
    try {
      await updatePassword(body, token);
      showSuccess("¡Contraseña actualizada!");
      return true;
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message);
    } finally {
      setSaving(false);
    }
  }, [token, showSuccess]);

  const deleteUserAccount = useCallback(async () => {
    if (!token) return;
    if (!confirm("⚠️ ¿Estás seguro de eliminar tu cuenta? Esta acción es irreversible y se perderán todos tus datos.")) return;
    
    try {
      await deleteAccount(token);
      logout();
      navigate("/");
    } catch (error) {
      const err = error as Error;
      alert(err.message);
    }
  }, [token, logout, navigate]);

  return {
    profile,
    orders,
    reservations,
    loadingInitial,
    loadingOrders,
    loadingReservations,
    saving,
    uploadingPhoto,
    successMsg,
    
    bootstrapParams,
    fetchUserOrders,
    fetchUserReservations,
    saveSectionData,
    uploadProfilePhoto,
    changeUserPassword,
    deleteUserAccount,
  };
}
