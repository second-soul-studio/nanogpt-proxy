import { useState } from 'react';
import { AppShell, Container } from '@mantine/core';
import { Outlet } from 'react-router';
import TopHeader from '../elements/headers/top-header.tsx';
import Navbar from '../navigation/nav-bar.tsx';

function AdminLayout() {
  const [navbarOpened, setNavbarOpened] = useState(false);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'xl',
        collapsed: { mobile: !navbarOpened },
      }}
    >
      <AppShell.Header>
        <TopHeader
          displayBurgerButton
          navbarOpened={navbarOpened}
          onToggleNavbar={() => setNavbarOpened((o) => !o)}
        />
      </AppShell.Header>

      <AppShell.Navbar withBorder={false} bg="transparent">
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg" px="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default AdminLayout;
