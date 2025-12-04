import { Group, Title } from '@mantine/core';
import classes from './top-header.module.scss';

function TopHeader() {
  return (
    <Group h="100%" px="md" justify="space-between" className={classes.topHeader}>
      <Title order={4}>NanoGPT Proxy</Title>
    </Group>
  );
}

export default TopHeader;
