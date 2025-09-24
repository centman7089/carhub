import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import AppRoutes from './routes';
import Navbar from './components/shared/Navbar';
import { CssBaseline, Container } from '@mui/material';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <CssBaseline />
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <AppRoutes />
        </Container>
      </BrowserRouter>
    </Provider>
  );
};

export default App;