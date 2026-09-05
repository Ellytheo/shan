import './App.css';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Amenities from './components/Amenities';
import Rooms from './components/Rooms';
import Navbar from './common/Navbar';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from './common/Footer';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import Gallery from './components/Gallery';
import TermsAndPrivacy from './common/TermsAndPrivacy';
import WhatsAppWidget from './common/WhatsAppWidget';
import CookieBanner from './common/CookieBanner';
import { RoomAvailabilityProvider } from './context/RoomAvailabilityContext';
import Login from './common/Login';
import AdminPage from './common/AdminPage';
import ProtectedRoute from './common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './common/ErrorBoundary';
import NotFound from './components/NotFound';

function AppContent() {
  return (
    <>
      <Navbar />
      <div className="App">
        <Home />
        <About />
        <Rooms />
        <Amenities />
        <Contact />
        <Gallery />
        <CookieBanner />
        <WhatsAppWidget />
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <RoomAvailabilityProvider>
          <BrowserRouter>
            {/* AuthProvider must be inside BrowserRouter so it can use useNavigate */}
            <AuthProvider>
              <Routes>
                <Route path="/terms"    element={<><Navbar /><TermsAndPrivacy /><Footer /></>} />
                <Route path="/sponge"   element={<Login />} />
                <Route
                  path="/wp-adman"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<AppContent />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </RoomAvailabilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
