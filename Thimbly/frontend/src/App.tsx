import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout } from './routes/ProtectedLayout';
import { LoginStub } from './routes/LoginStub';
import { Editor } from './routes/Editor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginStub />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/editor" element={<Editor />} />
          <Route path="/" element={<Navigate to="/editor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
