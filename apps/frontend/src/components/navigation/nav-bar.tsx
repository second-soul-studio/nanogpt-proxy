import { useState } from 'react';
import { IconKey, IconLogout, IconUsersPlus } from '@tabler/icons-react';
import { Code, Group } from '@mantine/core';
import classes from './nav-bar.module.scss';
import { useNavigate } from 'react-router';
import { clearAuthCookies } from '../../utilities/cookies.utilities.ts';
import { useLogout } from '../../hooks/useLogout.ts';

const data = [
  { link: '/admin', label: 'Administer', icon: IconUsersPlus },
  { link: '/admin/apikey', label: 'API Keys', icon: IconKey },
];

function NavBar() {
  const navigate = useNavigate();

  const { mutate: logout } = useLogout({
    onSuccess: () => {
      clearAuthCookies();
      navigate('/', { replace: true });
    },
    onError: (err) => {
      console.error('Logout failed', err);
      clearAuthCookies(); // tu peux aussi décider de forcer le cleanup
      navigate('/', { replace: true });
    },
  });

  const [active, setActive] = useState('Administer');

  const links = data.map((item) => (
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
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Code fw={700} className={classes.version}>
            v0.0.1
          </Code>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        <a href="#" className={classes.link} onClick={() => logout()}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
