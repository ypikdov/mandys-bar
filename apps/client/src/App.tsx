import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthContext";
import { FavoritesProvider } from "@/providers/FavoritesContext";
import { SiteContentProvider } from "@/modules/site-content/providers/SiteContentProvider";
import { ClientLayout } from "@/layouts/ClientLayout";
import { loadPublicPage } from "@/lib/pagePreload";

const Home = lazy(() => loadPublicPage("home"));
const Menu = lazy(() => loadPublicPage("menu"));
const Events = lazy(() => loadPublicPage("events"));
const Gallery = lazy(() => loadPublicPage("gallery"));
const About = lazy(() => loadPublicPage("about"));
const Contact = lazy(() => loadPublicPage("contact"));
const ProfilePage = lazy(() => loadPublicPage("profile"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <AuthProvider>
    <FavoritesProvider>
      <SiteContentProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route element={<ClientLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/eventos/*" element={<Events />} />
                <Route path="/galeria" element={<Gallery />} />
                <Route path="/galería" element={<Navigate to="/galeria" replace />} />
                <Route path="/Galería" element={<Navigate to="/galeria" replace />} />
                <Route path="/Galeria" element={<Navigate to="/galeria" replace />} />
                <Route path="/acerca/*" element={<About />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </SiteContentProvider>
    </FavoritesProvider>
  </AuthProvider>
);

export default App;
