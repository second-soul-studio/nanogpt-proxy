import { useState } from 'react';
import { IconKey, IconLogout, IconSettings, IconUser, IconUsersPlus } from '@tabler/icons-react';
import { Code, Group } from '@mantine/core';
import classes from './nav-bar.module.scss';
import { useNavigate } from 'react-router';
import { clearAuthCookies } from '../../utilities/cookies.utilities.ts';
import { useLogout } from '../../hooks/useLogout.ts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.ts';

const data = [
  { link: '/admin', label: 'menu.items.administer', roles: ['ADMIN'], icon: IconUsersPlus },
  { link: '/admin/apikey', label: 'menu.items.apiKeys', roles: ['ADMIN', 'USER'], icon: IconKey },
  { link: '/admin/settings', label: 'menu.items.settings', roles: ['ADMIN'], icon: IconSettings },
];

function NavBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { mutate: logout } = useLogout({
    onSuccess: () => {
      clearAuthCookies();
      navigate('/', { replace: true });
    },
    onError: (err) => {
      console.error('Logout failed', err);
      clearAuthCookies();
      navigate('/', { replace: true });
    },
  });

  const [active, setActive] = useState('Administer');

  const visibleLinks = data.filter((item) => (user ? item.roles.includes(user.roles) : false));
  const links = visibleLinks.map((item) => (
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      href={item.link}
      key={item.label}
      onClick={(event) => {
        event.preventDefault();
        setActive(item.label);
        navigate(item.link);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{t(item.label)}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Code fw={700} className={classes.version}>
            v0.0.1
          </Code>
          <Code ml={6} fw={700} className={classes.version}>
            {user?.roles}
          </Code>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        {user && (
          <a
            href="/admin/profile"
            className={classes.link}
            data-active={active === '/admin/profile' || undefined}
            onClick={(event) => {
              event.preventDefault();
              setActive('/admin/profile');
              navigate('/admin/profile');
            }}
          >
            <IconUser className={classes.linkIcon} stroke={1.5} />
            <span>{user.email}</span>
          </a>
        )}
        <a href="#" className={classes.link} onClick={() => logout()}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>{t('menu.items.logout')}</span>
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
