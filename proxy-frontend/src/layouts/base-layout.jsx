import { Outlet } from 'react-router';
import { AppShell, Container } from '@mantine/core';
import TopHeader from '../components/navigations/top-header.jsx';

function BaseLayout() {
  return (
    <AppShell padding="md" header={{ height: 60 }} navbar={null}>
      <AppShell.Header>
        <TopHeader />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default BaseLayout;
