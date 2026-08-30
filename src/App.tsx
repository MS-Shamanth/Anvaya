import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { RequireAuth } from './components/RequireAuth';

import Landing from './pages/Landing';
import Enter from './pages/Enter';
import NotFound from './pages/NotFound';

import Browse from './pages/buyer/Browse';
import PieceDetail from './pages/buyer/PieceDetail';
import Checkout from './pages/buyer/Checkout';
import Acquisitions from './pages/buyer/Acquisitions';
import Watchlist from './pages/buyer/Watchlist';

import SellerDashboard from './pages/seller/Dashboard';
import NewListing from './pages/seller/NewListing';
import PieceManager from './pages/seller/PieceManager';

import RenewalPool from './pages/upcycler/RenewalPool';
import Atelier from './pages/upcycler/Atelier';

/**
 * Route table, kept separate from the router itself so it can be mounted under
 * a MemoryRouter for render checks as well as under BrowserRouter in the app.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public. The exchange floor and individual pieces stay browsable before
          signing in — you should be able to see the goods first. */}
      <Route path="/" element={<Landing />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/piece/:id" element={<PieceDetail />} />

      {/* Buyer */}
      <Route
        path="/checkout/:id"
        element={
          <RequireAuth role="buyer">
            <Checkout />
          </RequireAuth>
        }
      />
      <Route
        path="/orders"
        element={
          <RequireAuth role="buyer">
            <Acquisitions />
          </RequireAuth>
        }
      />
      <Route
        path="/watchlist"
        element={
          <RequireAuth role="buyer">
            <Watchlist />
          </RequireAuth>
        }
      />

      {/* Seller */}
      <Route
        path="/seller"
        element={
          <RequireAuth role="seller">
            <SellerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/seller/new"
        element={
          <RequireAuth role="seller">
            <NewListing />
          </RequireAuth>
        }
      />
      <Route
        path="/seller/piece/:id"
        element={
          <RequireAuth role="seller">
            <PieceManager />
          </RequireAuth>
        }
      />

      {/* Upcycler */}
      <Route
        path="/upcycler"
        element={
          <RequireAuth role="upcycler">
            <RenewalPool />
          </RequireAuth>
        }
      />
      <Route
        path="/upcycler/projects"
        element={
          <RequireAuth role="upcycler">
            <Atelier />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
