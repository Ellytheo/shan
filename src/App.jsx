import './App.css';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Booking from './components/Booking';
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
import ChatBot from './common/ChatBot';
import CookieBanner from './common/CookieBanner';

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
        <Booking/>
        <CookieBanner />
        <ChatBot />
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/terms" element={<><Navbar /><TermsAndPrivacy /><Footer /></>} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
