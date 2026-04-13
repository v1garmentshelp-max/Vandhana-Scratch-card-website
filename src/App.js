import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainForm from './pages/MainForm';
import ScratchCardPage from './pages/ScratchCardPage';
import PopupProvider from './PopupProvider';
import './App.css';

export default function App() {
  return (
    <PopupProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainForm />} />
          <Route path="/scratch" element={<ScratchCardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PopupProvider>
  );
}
