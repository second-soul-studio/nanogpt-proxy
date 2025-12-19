import { Outlet } from 'react-router';
import { AppShell, Container } from '@mantine/core';
import TopHeader from '../elements/headers/top-header.tsx';
import Footer from '../elements/headers/footer.tsx';

function LoginLayout() {
  return (
    <AppShell padding="md" header={{ height: 60 }} footer={{ height: { base: 120, sm: 100 } }}>
      <AppShell.Header>
        <TopHeader displayBurgerButton={false} />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}

export default LoginLayout;
