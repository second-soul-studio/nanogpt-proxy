import '@mantine/core/styles.css';

import { Route, Routes } from 'react-router';
import BaseLayout from './layouts/base-layout.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<BaseLayout />}>
        <Route index element={<>Index Level</>} />
      </Route>
      <Route path="*" element={<>Not Found</>} />
    </Routes>
  );
}

export default App;
