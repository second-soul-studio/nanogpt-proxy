import { Burger, Group, Title } from '@mantine/core';
import classes from './top-header.module.scss';
import LanguageSwitcher from '../droplists/language-switcher.tsx';

type TopHeaderProps = {
  displayBurgerButton: boolean;
  navbarOpened?: boolean;
  onToggleNavbar?: () => void;
};

function TopHeader({ displayBurgerButton, navbarOpened, onToggleNavbar }: TopHeaderProps) {
  return (
    <Group h="100%" px="md" justify="space-between" className={classes.topHeader}>
      {displayBurgerButton && (
        <Burger opened={navbarOpened} onClick={onToggleNavbar} hiddenFrom="xl" size="sm" />
      )}
      <Title order={4}>NanoGPT Proxy</Title>
      <LanguageSwitcher />
    </Group>
  );
}

export default TopHeader;
