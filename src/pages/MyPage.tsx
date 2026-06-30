import { Badge, Box, Button, Card, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBookmark, IconCalendar, IconLogout, IconMail } from '@tabler/icons-react';
import type { Translation } from '../i18n';
import type { ArticleData, AuthUser } from '../types';

interface MyPageProps {
  user: AuthUser | null;
  scraps: ArticleData[];
  onOpenAuth: () => void;
  onSignOut: () => void;
  onReadScrap: (scrap: ArticleData) => void;
  onOpenScraps: () => void;
  copy: Translation['myPage'];
}

export function MyPage({ user, scraps, onOpenAuth, onSignOut, onReadScrap, onOpenScraps, copy }: MyPageProps) {
  if (!user) {
    return (
      <Paper p="xl" radius="md" withBorder className="status-panel">
        <Stack gap="md" align="center" ta="center">
          <Title order={2} size="h3">
            {copy.signedOutTitle}
          </Title>
          <Text c="dimmed" maw={520}>
            {copy.signedOutDescription}
          </Text>
          <Button onClick={onOpenAuth}>{copy.openLogin}</Button>
        </Stack>
      </Paper>
    );
  }

  const joinedDate = new Date(user.createdAt).toLocaleDateString();
  const latestScraps = scraps.slice(0, 3);

  return (
    <Stack gap="lg">
      <Paper p="xl" radius="md" withBorder className="profile-panel">
        <Group justify="space-between" align="flex-start" gap="lg">
          <Stack gap="xs">
            <Badge variant="light" w="fit-content">
              {copy.badge}
            </Badge>
            <Title order={2} size="h3">
              {copy.greeting(user.name)}
            </Title>
            <Group gap="lg" c="dimmed">
              <Group gap={6}>
                <IconMail size={16} aria-hidden />
                <Text size="sm">{user.email}</Text>
              </Group>
              <Group gap={6}>
                <IconCalendar size={16} aria-hidden />
                <Text size="sm">{copy.joined(joinedDate)}</Text>
              </Group>
            </Group>
          </Stack>
          <Button variant="light" color="gray" leftSection={<IconLogout size={16} />} onClick={onSignOut}>
            {copy.signOut}
          </Button>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Group gap="xs">
              <IconBookmark size={20} aria-hidden />
              <Text fw={800}>{copy.savedArticles}</Text>
            </Group>
            <Title order={3}>{scraps.length}</Title>
            <Text size="sm" c="dimmed">
              {copy.savedDescription}
            </Text>
          </Stack>
        </Paper>
        <Paper p="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text fw={800}>{copy.nextAction}</Text>
            <Text size="sm" c="dimmed">
              {copy.nextActionDescription}
            </Text>
            <Button variant="light" onClick={onOpenScraps} w="fit-content">
              {copy.openScraps}
            </Button>
          </Stack>
        </Paper>
      </SimpleGrid>

      <Box>
        <Group justify="space-between" mb="sm">
          <Title order={3} size="h4">
            {copy.latestScraps}
          </Title>
          <Button variant="subtle" onClick={onOpenScraps}>
            {copy.viewAll}
          </Button>
        </Group>
        {latestScraps.length === 0 ? (
          <Paper p="xl" radius="md" withBorder ta="center">
            <Text c="dimmed">{copy.empty}</Text>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {latestScraps.map((scrap) => (
              <Card key={scrap.url || scrap.title} radius="md" withBorder>
                <Stack gap="sm">
                  <Text fw={800} lineClamp={2}>
                    {scrap.title}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={3}>
                    {scrap.summary}
                  </Text>
                  <Button variant="light" onClick={() => onReadScrap(scrap)}>
                    {copy.read}
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Stack>
  );
}
