import './App.css';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Amenities from './components/Amenities';
import Rooms from './components/Rooms';
import Navbar from './common/Navbar';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css'; // ✅ correct
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
    <ThemeProvider theme={theme}>
      <RoomAvailabilityProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/terms" element={<><Navbar /><TermsAndPrivacy /><Footer /></>} />
            <Route path="/sponge" element={<Login />} />
            <Route path="/wp-adman" element={<AdminPage />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </RoomAvailabilityProvider>
    </ThemeProvider>
  );
}

export default App;
