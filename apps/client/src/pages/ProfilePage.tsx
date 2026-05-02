import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, MapPin, ShoppingBag, LogOut, Pencil, Check, X, KeyRound, Trash2, Eye, EyeOff, ShieldAlert, Mail, Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";
import type { InvoiceItem } from '@mandys/shared';
import { eventPrices, eventTypeLabels } from "@/data/events";
import { useProfile } from "@/features/profile/useProfile";
import { IMAGE_UPLOAD_ACCEPT } from "@/services/api/uploadService";

type Section = "perfil" | "direccion" | "pedidos" | "reservas" | "seguridad";

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [editingSection, setEditingSection] = useState<"personal" | "billing" | "address" | "password" | null>(null);

  const {
    profile,
    orders,
    reservations,
    ordersPagination,
    reservationsPagination,
    loadingInitial,
    loadingOrders,
    loadingReservations,
    saving,
    uploadingPhoto,
    successMsg,
    errorMsg,
    
    bootstrapParams,
    fetchUserOrders,
    fetchUserReservations,
    saveSectionData,
    uploadProfilePhoto,
    changeUserPassword,
    deleteUserAccount,
  } = useProfile();

  // Edit forms
  const [personalForm, setPersonalForm] = useState({ nombre: "", telefono: "", genero: "", fecha_nac: "" });
  const [billingForm, setBillingForm] = useState({ tipo_documento: "", num_documento: "" });
  const [billingError, setBillingError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({ provincia: "", canton: "", distrito: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [reservationsPage, setReservationsPage] = useState(1);
  const ordersListRef = useRef<HTMLDivElement>(null);
  const reservationsListRef = useRef<HTMLDivElement>(null);
  const hasMountedOrdersPageRef = useRef(false);
  const hasMountedReservationsPageRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { 
    bootstrapParams(); 
  }, [bootstrapParams]);

  useEffect(() => {
    if (profile) {
      setPersonalForm({
        nombre: profile.nombre || "",
        telefono: profile.telefono || "",
        genero: profile.genero || "",
        fecha_nac: profile.fecha_nac ? profile.fecha_nac.split("T")[0] : ""
      });
      setBillingForm({
        tipo_documento: profile.tipo_documento || "",
        num_documento: profile.num_documento || ""
      });
      setAddressForm({
        provincia: profile.provincia || "",
        canton: profile.canton || "",
        distrito: profile.distrito || ""
      });
    }
  }, [profile]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profile?.foto_perfil]);

  // Lazy loading effects
  useEffect(() => {
    if (activeSection === "pedidos") { fetchUserOrders(false, ordersPage); }
    if (activeSection === "reservas") { fetchUserReservations(false, reservationsPage); }
  }, [activeSection, fetchUserOrders, fetchUserReservations, ordersPage, reservationsPage]);

  useEffect(() => {
    if (activeSection !== "pedidos") return;
    if (!hasMountedOrdersPageRef.current) {
      hasMountedOrdersPageRef.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      ordersListRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [activeSection, ordersPage]);

  useEffect(() => {
    if (activeSection !== "reservas") return;
    if (!hasMountedReservationsPageRef.current) {
      hasMountedReservationsPageRef.current = true;
      return;
    }

    window.requestAnimationFrame(() => {
      reservationsListRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [activeSection, reservationsPage]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadProfilePhoto(file);
  };

  const saveSection = async (section: "personal" | "billing" | "address") => {
    if (section === "billing") {
      setBillingError(null);
      if (billingForm.num_documento.length !== 9) {
        setBillingError("La cédula debe contener exactamente 9 dígitos numéricos");
        return;
      }
    }
    const body = section === "personal" ? personalForm : section === "billing" ? billingForm : addressForm;
    const success = await saveSectionData(body);
    if (success) setEditingSection(null);
  };

  const changePassword = async () => {
    setPwError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPwError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      await changeUserPassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setEditingSection(null);
    } catch (err: any) {
      setPwError(err.message);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const handleDownloadOrderInvoice = async (order: (typeof orders)[number]) => {
    const { generateInvoicePDF } = await import("@mandys/shared");
    const mappedItems: InvoiceItem[] = order.items?.map((it: any) => ({
      id: it.id || "item",
      name: it.product?.nombre || "Producto",
      price: it.precio_sin_iva ? it.precio_sin_iva * 1.13 : (it.product?.precio_con_iva || 0),
      quantity: it.cantidad || 1
    })) || [];

    const customerInfo = profile ? {
      fullName: profile.nombre || "Cliente Contado",
      email: profile.correo || "N/A",
      phone: profile.telefono || "N/A"
    } : undefined;

    generateInvoicePDF(
      order.consecutivo_anual,
      mappedItems,
      order.total || 0,
      customerInfo,
      order.pickup_time,
      order.estado,
      order.notas,
      order.fecha
    );
  };

  const downloadReservationPDF = async (reservationData: {
    id?: string;
    consecutivo_reserva?: number;
    created_at?: string;
    tipo_evento: string;
    fecha: string;
    hora_inicio: string;
    hora_fin?: string | null;
    precio: number;
    nombre: string;
    correo: string;
    telefono?: string;
    comensales: number | string;
    detalles: string;
    estado?: string;
    codigo_referencia?: string;
    monto_deposito?: number;
    medio_pago?: string;
    tipo_pago?: string;
    observacion_pago?: string;
    confirmado_por?: string;
    confirmado_por_rol?: string;
    fecha_confirmacion?: string;
  }) => {
    const { downloadReservationPDF: generateReservationPDF } = await import("@mandys/shared");
    generateReservationPDF({
      ...reservationData,
      hora_fin: reservationData.hora_fin ?? undefined
    });
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Optimizando tu perfil...</p>
          </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Error al cargar perfil</h2>
          <p className="text-zinc-400">{errorMsg || "No se pudieron obtener los datos de tu perfil. Asegurate de que el servidor esté activo."}</p>
          <div className="flex gap-3">
            <button
              onClick={() => bootstrapParams()}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
  const profileImageSrc = profile?.foto_perfil && !profileImageFailed
    ? /^https?:\/\//i.test(profile.foto_perfil)
      ? profile.foto_perfil
      : profile.foto_perfil.startsWith('/')
        ? profile.foto_perfil
        : `/${profile.foto_perfil}`
    : null;

  const sidebarItems = [
    { key: "perfil" as Section, label: "Mi Perfil", Icon: User },
    { key: "direccion" as Section, label: "Dirección", Icon: MapPin },
    { key: "pedidos" as Section, label: "Mis Pedidos", Icon: ShoppingBag },
    { key: "reservas" as Section, label: "Mis Reservas", Icon: Calendar },
    { key: "seguridad" as Section, label: "Seguridad", Icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group">
            <div className={`h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl relative transition-all ${uploadingPhoto ? 'opacity-50' : 'group-hover:ring-4 group-hover:ring-primary/30'}`}>
              {profileImageSrc ? (
                <img 
                  src={profileImageSrc} 
                  alt={profile.nombre} 
                  className="h-full w-full object-cover"
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center text-4xl font-black text-white">
                  {profile?.nombre?.charAt(0) || "?"}
                </div>
              )}
              
              {/* Overlay for upload */}
              <label 
                htmlFor="photo-upload" 
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="p-2 bg-white/10 rounded-full mb-1">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cambiar</span>
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept={IMAGE_UPLOAD_ACCEPT} 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
              
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
              ¡Hola, {profile?.nombre?.split(" ")[0] || user?.nombre}!
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <p className="text-zinc-500 text-sm flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {profile?.correo || user?.correo}
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-primary/20">
                  {profile?.role || user?.role}
                </span>
                {profile?.created_at && (
                  <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                    Miembro desde: {new Date(profile.created_at).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
            ✅ {successMsg}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {sidebarItems.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setActiveSection(key)}
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 text-sm font-bold transition-colors border-b border-zinc-800/50 last:border-b-0
                    ${activeSection === key ? "bg-primary/10 text-primary border-l-4 border-l-primary" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}

              <button onClick={handleLogout}
                className="w-full text-left px-5 py-4 flex items-center gap-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-6">

            {/* ===== MI PERFIL ===== */}
            {activeSection === "perfil" && (
              <>
                {/* Datos Personales */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-lg">Datos Personales</h2>
                    {editingSection !== "personal" ? (
                      <button onClick={() => setEditingSection("personal")} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" aria-label="Editar datos personales">
                        <Pencil className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => saveSection("personal")} disabled={saving}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button onClick={() => setEditingSection(null)}
                          className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField label="Nombre completo" value={profile?.nombre} isEditing={editingSection === "personal"}
                      inputValue={personalForm.nombre} onChange={(v) => setPersonalForm({ ...personalForm, nombre: v })} />
                    <ProfileField label="Teléfono" value={profile?.telefono} isEditing={editingSection === "personal"}
                      inputValue={personalForm.telefono} onChange={(v) => setPersonalForm({ ...personalForm, telefono: v })} placeholder="8888-8888" />
                    <ProfileField label="Género" value={profile?.genero} isEditing={editingSection === "personal"}
                      type="select" inputValue={personalForm.genero} onChange={(v) => setPersonalForm({ ...personalForm, genero: v })}
                      options={[{ value: "", label: "Seleccionar" }, { value: "Masculino", label: "Masculino" }, { value: "Femenino", label: "Femenino" }, { value: "Otro", label: "Otro" }]} />
                    <ProfileField label="Fecha de nacimiento" value={profile?.fecha_nac ? new Date(profile.fecha_nac).toLocaleDateString("es-CR") : null}
                      isEditing={editingSection === "personal"} type="date" inputValue={personalForm.fecha_nac}
                      onChange={(v) => setPersonalForm({ ...personalForm, fecha_nac: v })} />
                  </div>
                </div>

                {/* Datos de Facturación */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-lg">Datos de Facturación</h2>
                    {editingSection !== "billing" ? (
                      <button onClick={() => setEditingSection("billing")} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" aria-label="Editar datos de facturación">
                        <Pencil className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => saveSection("billing")} disabled={saving}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button onClick={() => { setEditingSection(null); setBillingError(null); }}
                          className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  {billingError && editingSection === "billing" && (
                    <div className="px-6 pt-4">
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                        <span>⚠️</span> {billingError}
                      </div>
                    </div>
                  )}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField label="Tipo de documento" value={profile?.tipo_documento} isEditing={editingSection === "billing"}
                      type="select" inputValue={billingForm.tipo_documento} onChange={(v) => setBillingForm({ ...billingForm, tipo_documento: v })}
                      options={[{ value: "", label: "Seleccionar" }, { value: "Cédula Física", label: "Cédula Física" }, { value: "Cédula Jurídica", label: "Cédula Jurídica" }, { value: "DIMEX", label: "DIMEX" }, { value: "Pasaporte", label: "Pasaporte" }]} />
                    <ProfileField label="No. Cédula" value={profile?.num_documento} isEditing={editingSection === "billing"}
                      inputValue={billingForm.num_documento} onChange={(v) => setBillingForm({ ...billingForm, num_documento: v.replace(/\D/g, '').slice(0, 9) })} />
                  </div>
                </div>
              </>
            )}

            {/* ===== DIRECCIÓN ===== */}
            {activeSection === "direccion" && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                  <h2 className="text-white font-bold text-lg">Dirección</h2>
                  {editingSection !== "address" ? (
                    <button onClick={() => setEditingSection("address")} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" aria-label="Editar dirección">
                      <Pencil className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => saveSection("address")} disabled={saving}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                      <button onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ProfileField label="Provincia" value={profile?.provincia} isEditing={editingSection === "address"}
                    type="select" inputValue={addressForm.provincia} onChange={(v) => setAddressForm({ ...addressForm, provincia: v })}
                    options={[{ value: "", label: "Seleccionar" }, { value: "SAN JOSÉ", label: "San José" }, { value: "ALAJUELA", label: "Alajuela" }, { value: "CARTAGO", label: "Cartago" }, { value: "HEREDIA", label: "Heredia" }, { value: "GUANACASTE", label: "Guanacaste" }, { value: "PUNTARENAS", label: "Puntarenas" }, { value: "LIMÓN", label: "Limón" }]} />
                  <ProfileField label="Cantón" value={profile?.canton} isEditing={editingSection === "address"}
                    inputValue={addressForm.canton} onChange={(v) => setAddressForm({ ...addressForm, canton: v })} placeholder="Ej: LIBERIA" />
                  <ProfileField label="Distrito" value={profile?.distrito} isEditing={editingSection === "address"}
                    inputValue={addressForm.distrito} onChange={(v) => setAddressForm({ ...addressForm, distrito: v })} placeholder="Ej: LIBERIA" />
                </div>
              </div>
            )}

            {/* ===== MIS PEDIDOS ===== */}
            {activeSection === "pedidos" && (
              <div ref={ordersListRef} className="scroll-mt-28 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-white font-bold text-lg">Mis Pedidos</h2>
                  <button onClick={() => fetchUserOrders(true, ordersPage)} className="text-[10px] font-black uppercase text-primary hover:underline">Refrescar</button>
                </div>
                
                {loadingOrders ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mr-auto ml-auto"></div>
                  </div>
                ) : orders.length > 0 ? (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-zinc-800/50 text-zinc-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Referencia</th>
                          <th className="px-6 py-3">Fecha</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Estado</th>
                          <th className="px-6 py-3 text-center">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-white">{order.consecutivo_anual}</td>
                            <td className="px-6 py-4 text-zinc-400">{new Date(order.fecha).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black text-primary">₡{order.total.toLocaleString("es-CR")}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter
                                ${order.estado === 'COMPLETADO' ? 'bg-green-500/10 text-green-400' : 
                                  order.estado === 'CANCELADO' ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>
                                {order.estado?.replace('_', ' ') || 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDownloadOrderInvoice(order);
                                }}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors inline-block"
                                title="Descargar comprobante de pedido"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ProfilePagination
                    currentPage={ordersPagination.page}
                    totalPages={ordersPagination.totalPages}
                    onPageChange={setOrdersPage}
                  />
                  </>
                ) : (
                  <div className="p-6 text-center py-16">
                    <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold text-lg">No tienes pedidos aún</p>
                    <p className="text-zinc-600 text-sm mt-2">Cuando realices un pedido, aparecerá aquí.</p>
                    <button onClick={() => navigate("/menu")}
                      className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm uppercase tracking-wide transition-colors">
                      Ver Menú
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== RESERVAS ===== */}
            {activeSection === "reservas" && (
              <div ref={reservationsListRef} className="scroll-mt-28 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
                  <div className="p-2 bg-primary/20 text-primary rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="text-white font-bold text-lg">Historial de Reservas</h2>
                </div>
                {loadingReservations ? (
                  <div className="p-12 text-center text-zinc-500">Cargando reservaciones...</div>
                ) : reservations.length > 0 ? (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Reserva</th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Fecha</th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Tipo</th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Personas</th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Estado</th>
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-center">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map(res => {
                          const isPending = res.estado === 'PENDIENTE';
                          const isCancelled = res.estado === 'CANCELADA';
                          return (
                            <tr key={res.id} className="border-b border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                              <td className="p-4">
                                <span className="text-white font-mono">#{res.consecutivo_reserva?.toString().padStart(4, '0')}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-zinc-300">
                                  {new Date(res.fecha).toLocaleDateString()}
                                  <br/>
                                  <span className="text-xs text-zinc-500">{res.hora_inicio} - {res.hora_fin}</span>
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-zinc-300 capitalize">{eventTypeLabels[res.tipo_evento] || res.tipo_evento}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-zinc-300 font-bold">{res.comensales}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 bg-zinc-800 text-xs font-bold rounded-full ${
                                  isPending ? "text-orange-400" : isCancelled ? "text-red-400" : "text-green-400"
                                }`}>
                                  {res.estado}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => downloadReservationPDF({
                                    tipo_evento: res.tipo_evento,
                                    id: res.id,
                                    consecutivo_reserva: res.consecutivo_reserva,
                                    created_at: res.created_at,
                                    fecha: res.fecha,
                                    hora_inicio: res.hora_inicio,
                                    hora_fin: res.hora_fin,
                                    // Mapear monto del depósito o placeholder si no está pagada (precio de tipo evento)
                                    precio: eventPrices[res.tipo_evento] || eventPrices.other || 30000,
                                    nombre: res.nombre,
                                    correo: res.correo,
                                    telefono: profile?.telefono || undefined,
                                    comensales: res.comensales,
                                    detalles: res.detalles || 'N/A',
                                    estado: res.estado,
                                    codigo_referencia: res.codigo_referencia,
                                    monto_deposito: res.monto_deposito,
                                    medio_pago: res.medio_pago,
                                    tipo_pago: res.tipo_pago,
                                    observacion_pago: res.observacion_pago,
                                    confirmado_por: res.confirmado_por,
                                    confirmado_por_rol: res.confirmado_por_rol,
                                    fecha_confirmacion: res.fecha_confirmacion
                                  })}
                                  title="Descargar Comprobante en PDF"
                                  className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <Download className="w-5 h-5 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <ProfilePagination
                    currentPage={reservationsPagination.page}
                    totalPages={reservationsPagination.totalPages}
                    onPageChange={setReservationsPage}
                  />
                  </>
                ) : (
                  <div className="p-6 text-center py-16">
                    <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold text-lg">No tienes reservas aún</p>
                    <p className="text-zinc-600 text-sm mt-2">Puedes programar tu próximo evento desde la sección de reservas.</p>
                    <button onClick={() => navigate("/eventos/publicos")}
                      className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm uppercase tracking-wide transition-colors">
                      Reservar Ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== SEGURIDAD ===== */}
            {activeSection === "seguridad" && (
              <>
                {/* Change Password */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-lg">Cambiar Contraseña</h2>
                    {editingSection !== "password" ? (
                      <button onClick={() => { setEditingSection("password"); setPwError(null); }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" aria-label="Modificar contraseña">
                        <Pencil className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={changePassword} disabled={saving}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button onClick={() => { setEditingSection(null); setPwError(null); }}
                          className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  {editingSection === "password" ? (
                    <div className="p-6 space-y-4 max-w-md">
                      {pwError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm">{pwError}</div>}
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Contraseña actual</label>
                        <div className="relative">
                          <input type={showCurrentPw ? "text" : "password"} value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            aria-label="Contraseña actual" title="Contraseña actual"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-12" />
                          <button onClick={() => setShowCurrentPw(!showCurrentPw)} type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Nueva contraseña</label>
                        <div className="relative">
                          <input type={showNewPw ? "text" : "password"} value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            aria-label="Nueva contraseña" title="Nueva contraseña"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors pr-12" />
                          <button onClick={() => setShowNewPw(!showNewPw)} type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Confirmar nueva contraseña</label>
                        <input type="password" value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          aria-label="Confirmar nueva contraseña" title="Confirmar nueva contraseña"
                          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <p className="text-zinc-500 text-sm">••••••••••••</p>
                      <p className="text-zinc-600 text-xs mt-1">Haz clic en el lápiz para cambiar tu contraseña.</p>
                    </div>
                  )}
                </div>

                {/* Delete Account */}
                <div className="bg-zinc-900 border border-red-900/30 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-red-900/20">
                    <h2 className="text-red-400 font-bold text-lg">Zona de Peligro</h2>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-300 font-bold text-sm">Eliminar cuenta</p>
                      <p className="text-zinc-600 text-xs mt-1">Esta acción eliminará permanentemente tu cuenta y todos tus datos.</p>
                    </div>
                    <button onClick={deleteUserAccount}
                      className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wide flex items-center gap-2 transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

interface ProfilePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProfilePagination = ({ currentPage, totalPages, onPageChange }: ProfilePaginationProps) => {
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, onPageChange, totalPages]);

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-900/70 px-6 py-4" aria-label="Paginacion del perfil">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Pagina anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {visiblePages.map((page, index) => {
        const previous = visiblePages[index - 1];
        const showGap = previous !== undefined && page - previous > 1;

        return (
          <span key={page} className="inline-flex items-center gap-2">
            {showGap && <span className="px-1 text-sm font-black text-zinc-600" aria-hidden="true">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-10 min-w-10 rounded-full px-3 text-sm font-black transition ${
                page === currentPage
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-primary hover:text-white"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Pagina siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
};

// --- Reusable field component ---
interface ProfileFieldProps {
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  inputValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "select";
  options?: { value: string; label: string }[];
}

const ProfileField = ({ label, value, isEditing, inputValue, onChange, placeholder, type = "text", options }: ProfileFieldProps) => {
  if (isEditing) {
    if (type === "select" && options) {
      return (
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">{label}</label>
          <select
            value={inputValue || ""}
            onChange={(e) => onChange?.(e.target.value)}
            aria-label={label}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">{label}</label>
        <input type={type} value={inputValue || ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{value || <span className="text-zinc-600 italic">Sin definir</span>}</p>
    </div>
  );
};
